package backend

import (
	"archive/zip"
	"bufio"
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// 性能优化常量
const (
	ChunkSize        = 1024 * 1024            // 1MB chunks for large file processing
	MaxWorkers       = 4                      // 最大并发工作数
	BufferPoolSize   = 10                     // 缓冲池大小
	ProgressInterval = 100 * time.Millisecond // 进度更新间隔
)

type Generator struct {
	ctx          context.Context
	bufferPool   sync.Pool
	workers      chan struct{} // 用于限制并发数量
	errorHandler *ErrorMiddleware
	validator    *ValidationHelper
	configMgr    *ConfigManager // 配置管理器
}

// 图种信息结构体
type TuzhongInfo struct {
	ImageSize    int64    `json:"imageSize"`
	HiddenSize   int64    `json:"hiddenSize"`
	TotalSize    int64    `json:"totalSize"`
	ImageFormat  string   `json:"imageFormat"`
	HiddenFiles  []string `json:"hiddenFiles"`
	IsValid      bool     `json:"isValid"`
	ErrorMessage string   `json:"errorMessage"`
}

func NewGenerator() *Generator {
	g := &Generator{
		workers:   make(chan struct{}, MaxWorkers),
		validator: &ValidationHelper{},
		configMgr: GlobalConfigManager,
	}

	// 初始化缓冲池
	g.bufferPool.New = func() interface{} {
		return make([]byte, ChunkSize)
	}

	// 记录生成器初始化日志
	Info("Generator initialized with %d max workers, chunk size: %d bytes", MaxWorkers, ChunkSize)

	return g
}

// 设置上下文
func (g *Generator) SetContext(ctx context.Context) {
	g.ctx = ctx
	// 初始化错误处理中间件
	g.errorHandler = NewErrorMiddleware(ctx)

	// 记录上下文设置日志
	Info("Generator context set and error middleware initialized")
}

// 优化的缓冲池管理
func (g *Generator) getBuffer() []byte {
	if buf := g.bufferPool.Get(); buf != nil {
		return buf.([]byte)
	}
	return make([]byte, ChunkSize)
}

func (g *Generator) putBuffer(buf []byte) {
	if cap(buf) == ChunkSize {
		buf = buf[:0] // 重置长度但保留容量
		g.bufferPool.Put(buf)
	}
}

// 优化的文件读取 - 支持大文件分块处理
func (g *Generator) readFileOptimized(filePath string) ([]byte, error) {
	// 验证文件路径
	if err := g.validator.ValidateFilePath(filePath); err != nil {
		return nil, g.errorHandler.HandleError(err)
	}

	file, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, g.errorHandler.HandleError(NewFileNotFoundError(filePath))
		}
		if os.IsPermission(err) {
			return nil, g.errorHandler.HandleError(NewFilePermissionError(filePath))
		}
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "打开文件失败", err))
	}
	defer file.Close()

	// 获取文件信息
	fileInfo, err := file.Stat()
	if err != nil {
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "获取文件信息失败", err))
	}

	fileSize := fileInfo.Size()

	// 根据配置验证文件大小
	config := GetGlobalConfig()
	if config.FileSizeLimits.EnableSizeCheck && config.FileSizeLimits.MaxGeneralFile > 0 {
		if err := g.validator.ValidateFileSize(fileSize, config.FileSizeLimits.MaxGeneralFile); err != nil {
			return nil, g.errorHandler.HandleError(err)
		}
	}

	// 对于小文件，直接读取
	if fileSize <= ChunkSize {
		data, err := os.ReadFile(filePath)
		if err != nil {
			return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "读取文件失败", err))
		}
		return data, nil
	}

	// 大文件分块读取
	return g.readLargeFile(file, fileSize)
} // 大文件分块读取
func (g *Generator) readLargeFile(file *os.File, totalSize int64) ([]byte, error) {
	result := make([]byte, 0, totalSize)
	buffer := g.getBuffer()
	defer g.putBuffer(buffer)

	reader := bufio.NewReaderSize(file, ChunkSize)
	var bytesRead int64
	lastProgress := time.Now()

	for {
		n, err := reader.Read(buffer)
		if n > 0 {
			result = append(result, buffer[:n]...)
			bytesRead += int64(n)

			// 定期更新进度，避免过于频繁的UI更新
			if time.Since(lastProgress) >= ProgressInterval {
				progress := float64(bytesRead) / float64(totalSize) * 100
				runtime.EventsEmit(g.ctx, "fileReadProgress", map[string]interface{}{
					"percent": progress,
					"message": fmt.Sprintf("读取文件中... (%.1f%%)", progress),
				})
				lastProgress = time.Now()
			}
		}

		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("读取文件块失败: %v", err)
		}
	}

	return result, nil
}

// 优化的图种文件读取 - 不进行大小限制检查
func (g *Generator) readTuzhongFileOptimized(filePath string) ([]byte, error) {
	// 验证文件路径
	if err := g.validator.ValidateFilePath(filePath); err != nil {
		return nil, g.errorHandler.HandleError(err)
	}

	file, err := os.Open(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, g.errorHandler.HandleError(NewFileNotFoundError(filePath))
		}
		if os.IsPermission(err) {
			return nil, g.errorHandler.HandleError(NewFilePermissionError(filePath))
		}
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "打开图种文件失败", err))
	}
	defer file.Close()

	// 获取文件信息
	fileInfo, err := file.Stat()
	if err != nil {
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "获取图种文件信息失败", err))
	}

	fileSize := fileInfo.Size()

	// 图种文件不进行大小限制检查，因为它们本身就包含了压缩数据

	// 对于小文件，直接读取
	if fileSize <= ChunkSize {
		data, err := os.ReadFile(filePath)
		if err != nil {
			return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "读取图种文件失败", err))
		}
		return data, nil
	}

	// 大文件分块读取
	return g.readLargeFile(file, fileSize)
}

// 选择图片文件
func (g *Generator) SelectImageFile() (string, error) {
	file, err := runtime.OpenFileDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择封面图片",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "图片文件",
				Pattern:     "*.jpg;*.jpeg;*.png;*.gif;*.bmp;*.webp",
			},
		},
	})
	return file, err
}

// 获取图片的 base64 编码，用于预览
func (g *Generator) GetImageBase64(imagePath string) (string, error) {
	// 验证输入
	if err := g.validator.ValidateFilePath(imagePath); err != nil {
		return "", g.errorHandler.HandleError(err)
	}

	// 检查文件是否存在
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		return "", g.errorHandler.HandleError(NewFileNotFoundError(imagePath))
	}

	// 使用优化的文件读取
	imageData, err := g.readFileOptimized(imagePath)
	if err != nil {
		return "", err // 错误已在readFileOptimized中处理
	}

	// 根据配置检查图片文件大小
	config := GetGlobalConfig()
	if config.FileSizeLimits.EnableSizeCheck && config.FileSizeLimits.MaxImageSize > 0 {
		if int64(len(imageData)) > config.FileSizeLimits.MaxImageSize {
			return "", g.errorHandler.HandleError(NewFileTooLargeError(imagePath, int64(len(imageData)), config.FileSizeLimits.MaxImageSize))
		}
	}

	// 检查文件是否为空
	if len(imageData) == 0 {
		return "", g.errorHandler.HandleError(NewImageError(ErrCodeImageInvalid, "图片文件为空"))
	}

	// 根据文件扩展名确定 MIME 类型
	ext := strings.ToLower(filepath.Ext(imagePath))
	var mimeType string
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".png":
		mimeType = "image/png"
	case ".gif":
		mimeType = "image/gif"
	case ".bmp":
		mimeType = "image/bmp"
	case ".webp":
		mimeType = "image/webp"
	default:
		// 如果扩展名不匹配，尝试检测文件头
		mimeType = g.detectImageMimeType(imageData)
		if mimeType == "" {
			return "", g.errorHandler.HandleError(NewInvalidFormatError(ext, "JPEG, PNG, GIF, BMP, WEBP"))
		}
	}

	// 验证图像格式
	format := strings.ToUpper(strings.TrimPrefix(ext, "."))
	if err := g.validator.ValidateImageFormat(format); err != nil {
		return "", g.errorHandler.HandleError(err)
	}

	// 转换为 base64
	base64String := base64.StdEncoding.EncodeToString(imageData)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64String), nil
}

// 检测图片的 MIME 类型
func (g *Generator) detectImageMimeType(data []byte) string {
	if len(data) < 4 {
		return ""
	}

	// JPEG
	if len(data) >= 2 && data[0] == 0xFF && data[1] == 0xD8 {
		return "image/jpeg"
	}

	// PNG
	if len(data) >= 8 && data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 {
		return "image/png"
	}

	// GIF
	if len(data) >= 6 && (string(data[0:6]) == "GIF87a" || string(data[0:6]) == "GIF89a") {
		return "image/gif"
	}

	// BMP
	if len(data) >= 2 && data[0] == 0x42 && data[1] == 0x4D {
		return "image/bmp"
	}

	// WebP
	if len(data) >= 12 && string(data[0:4]) == "RIFF" && string(data[8:12]) == "WEBP" {
		return "image/webp"
	}

	return ""
}

// GetTuzhongImageBase64 获取图种文件的图片预览（优化版本）
func (g *Generator) GetTuzhongImageBase64(imagePath string) (string, error) {
	if imagePath == "" {
		return "", g.errorHandler.HandleError(NewValidationError(ErrCodeInvalidInput, "图种文件路径为空"))
	}

	// 检查文件是否存在
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		return "", g.errorHandler.HandleError(NewFileNotFoundError(imagePath))
	}

	// 只读取图片部分，不读取整个图种文件
	imageData, err := g.extractImageOnlyFromTuzhong(imagePath)
	if err != nil {
		return "", err
	}

	// 检查文件是否为空
	if len(imageData) == 0 {
		return "", g.errorHandler.HandleError(NewImageError(ErrCodeImageInvalid, "图种文件中的图片为空"))
	}

	// 根据文件扩展名确定 MIME 类型
	ext := strings.ToLower(filepath.Ext(imagePath))
	var mimeType string
	switch ext {
	case ".jpg", ".jpeg":
		mimeType = "image/jpeg"
	case ".png":
		mimeType = "image/png"
	case ".gif":
		mimeType = "image/gif"
	case ".bmp":
		mimeType = "image/bmp"
	case ".webp":
		mimeType = "image/webp"
	default:
		// 如果扩展名不匹配，尝试检测文件头
		mimeType = g.detectImageMimeType(imageData)
		if mimeType == "" {
			return "", g.errorHandler.HandleError(NewImageError(ErrCodeImageInvalid, fmt.Sprintf("不支持的图片格式: %s", ext)))
		}
	}

	// 转换为 base64
	base64String := base64.StdEncoding.EncodeToString(imageData)
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64String), nil
}

// 从图种文件中只提取图片部分（优化性能）
func (g *Generator) extractImageOnlyFromTuzhong(tuzhongPath string) ([]byte, error) {
	// 验证文件路径
	if err := g.validator.ValidateFilePath(tuzhongPath); err != nil {
		return nil, g.errorHandler.HandleError(err)
	}

	file, err := os.Open(tuzhongPath)
	if err != nil {
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "打开图种文件失败", err))
	}
	defer file.Close()

	// 读取文件头部信息以确定图片格式和大小
	headerBuffer := make([]byte, 64*1024) // 读取64KB头部信息
	n, err := file.Read(headerBuffer)
	if err != nil && err != io.EOF {
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "读取图种文件头部失败", err))
	}

	headerData := headerBuffer[:n]

	// 检测图片信息
	imageSize, imageFormat, err := g.detectImageInfo(headerData)
	if err != nil {
		// 如果从头部无法检测，尝试读取更多数据
		return g.readImagePortionFromTuzhong(file, tuzhongPath)
	}

	// 重新定位到文件开头
	if _, err := file.Seek(0, 0); err != nil {
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "重置文件指针失败", err))
	}

	// 只读取图片部分
	imageData := make([]byte, imageSize)
	_, err = io.ReadFull(file, imageData)
	if err != nil {
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "读取图种中的图片数据失败", err))
	}

	runtime.EventsEmit(g.ctx, "tuzhongPreviewProgress", map[string]interface{}{
		"message": fmt.Sprintf("已提取图片数据 (%.2f MB，格式: %s)", float64(imageSize)/(1024*1024), imageFormat),
	})

	return imageData, nil
}

// 当无法从头部检测图片信息时，读取图片部分的备用方法
func (g *Generator) readImagePortionFromTuzhong(file *os.File, tuzhongPath string) ([]byte, error) {
	// 获取文件大小
	fileInfo, err := file.Stat()
	if err != nil {
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "获取图种文件信息失败", err))
	}

	fileSize := fileInfo.Size()

	// 对于大文件，限制读取大小以提高性能
	maxReadSize := int64(50 * 1024 * 1024) // 最多读取50MB
	if fileSize > maxReadSize {
		fileSize = maxReadSize
	}

	// 重新定位到文件开头
	if _, err := file.Seek(0, 0); err != nil {
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "重置文件指针失败", err))
	}

	// 分块读取数据直到找到图片结束标记
	data := make([]byte, fileSize)
	_, err = io.ReadFull(file, data)
	if err != nil && err != io.EOF {
		return nil, g.errorHandler.HandleError(NewIOError(ErrCodeOperationFailed, "读取图种文件数据失败", err))
	}

	// 检测图片信息
	imageSize, _, err := g.detectImageInfo(data)
	if err != nil {
		return nil, g.errorHandler.HandleError(NewImageError(ErrCodeImageInvalid, "无法检测图种文件中的图片格式"))
	}

	// 如果检测到的图片大小超过了读取的数据，返回所有读取的数据
	if imageSize > int64(len(data)) {
		imageSize = int64(len(data))
	}

	return data[:imageSize], nil
}

// 选择文件
func (g *Generator) SelectFile() (string, error) {
	file, err := runtime.OpenFileDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择文件",
	})
	return file, err
}

// 选择文件夹
func (g *Generator) SelectFolder() (string, error) {
	folder, err := runtime.OpenDirectoryDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择文件夹",
	})
	return folder, err
}

// 选择保存位置
func (g *Generator) SelectSaveLocation() (string, error) {
	file, err := runtime.SaveFileDialog(g.ctx, runtime.SaveDialogOptions{
		Title: "选择保存位置",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "图片文件",
				Pattern:     "*.jpg;*.jpeg;*.png;*.gif;*.bmp;*.webp",
			},
		},
	})
	return file, err
}

// 打开文件位置
func (g *Generator) OpenFileLocation(filePath string) error {
	if filePath == "" {
		return fmt.Errorf("文件路径为空")
	}
	runtime.BrowserOpenURL(g.ctx, "file://"+filepath.Dir(filePath))
	return nil
}

// 合并文件 - 优化版本
func (g *Generator) MergeFiles(imagePath, targetPath, outputPath string) error {
	// 获取工作槽位
	g.workers <- struct{}{}
	defer func() { <-g.workers }()

	// 发送开始事件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "start",
		"message": "开始处理...",
		"percent": 0,
	})

	// 验证输入文件
	if imagePath == "" || targetPath == "" {
		return fmt.Errorf("图片路径或目标路径为空")
	}

	if outputPath == "" {
		return fmt.Errorf("输出路径为空")
	}

	// 检查文件是否存在
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		return fmt.Errorf("图片文件不存在: %s", imagePath)
	}

	if _, err := os.Stat(targetPath); os.IsNotExist(err) {
		return fmt.Errorf("目标文件不存在: %s", targetPath)
	}

	// 读取图片文件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "compress",
		"message": "读取图片文件...",
		"percent": 10,
	})

	imageData, err := g.readFileOptimized(imagePath)
	if err != nil {
		return fmt.Errorf("读取图片文件失败: %v", err)
	}

	// 创建临时zip文件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "compress",
		"message": "压缩目标文件...",
		"percent": 30,
	})

	zipData, err := g.createZipOptimized(targetPath)
	if err != nil {
		return fmt.Errorf("创建zip文件失败: %v", err)
	}

	// 合并文件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "merge",
		"message": "合并文件...",
		"percent": 70,
	})

	err = g.writeOutputFileOptimized(outputPath, imageData, zipData)
	if err != nil {
		return fmt.Errorf("写入输出文件失败: %v", err)
	}

	// 完成
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "complete",
		"message": "合并完成！",
		"percent": 100,
	})

	return nil
}

// 优化的zip创建
func (g *Generator) createZipOptimized(sourcePath string) ([]byte, error) {
	var buf bytes.Buffer
	writer := zip.NewWriter(&buf)
	defer writer.Close()

	info, err := os.Stat(sourcePath)
	if err != nil {
		return nil, err
	}

	if info.IsDir() {
		err = g.addDirToZipOptimized(writer, sourcePath, "")
	} else {
		err = g.addFileToZipOptimized(writer, sourcePath, filepath.Base(sourcePath))
	}

	if err != nil {
		return nil, err
	}

	writer.Close()
	return buf.Bytes(), nil
}

// 优化的文件添加到zip
func (g *Generator) addFileToZipOptimized(writer *zip.Writer, filePath, zipPath string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		return err
	}

	header, err := zip.FileInfoHeader(info)
	if err != nil {
		return err
	}

	header.Name = strings.ReplaceAll(zipPath, "\\", "/")
	header.Method = zip.Deflate

	zipFile, err := writer.CreateHeader(header)
	if err != nil {
		return err
	}

	// 使用缓冲区进行分块复制
	buffer := g.getBuffer()
	defer g.putBuffer(buffer)

	_, err = io.CopyBuffer(zipFile, file, buffer)
	return err
}

// 优化的目录添加到zip
func (g *Generator) addDirToZipOptimized(writer *zip.Writer, sourcePath, baseInZip string) error {
	return filepath.Walk(sourcePath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(sourcePath, path)
		if err != nil {
			return err
		}

		zipPath := filepath.Join(baseInZip, relPath)
		return g.addFileToZipOptimized(writer, path, zipPath)
	})
}

// 优化的输出文件写入
func (g *Generator) writeOutputFileOptimized(outputPath string, imageData, zipData []byte) error {
	// 确保目录存在
	if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
		return err
	}

	file, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer file.Close()

	// 使用缓冲写入
	writer := bufio.NewWriterSize(file, ChunkSize)
	defer writer.Flush()

	// 写入图片数据
	if _, err := writer.Write(imageData); err != nil {
		return err
	}

	// 写入zip数据
	if _, err := writer.Write(zipData); err != nil {
		return err
	}

	return writer.Flush()
}

// 选择图种文件
func (g *Generator) SelectTuzhongFile() (string, error) {
	file, err := runtime.OpenFileDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择图种文件",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "图片文件",
				Pattern:     "*.jpg;*.jpeg;*.png;*.gif;*.bmp;*.webp",
			},
		},
	})
	return file, err
}

// 分析图种文件
func (g *Generator) AnalyzeTuzhong(tuzhongPath string) (*TuzhongInfo, error) {
	fmt.Printf("[DEBUG] AnalyzeTuzhong 内部开始，路径: %s\n", tuzhongPath)
	info := &TuzhongInfo{}

	if tuzhongPath == "" {
		fmt.Println("[DEBUG] 图种文件路径为空")
		info.ErrorMessage = "请选择图种文件"
		return info, fmt.Errorf("图种文件路径为空")
	}

	// 检查文件是否存在
	fmt.Println("[DEBUG] 检查文件是否存在...")
	fileInfo, err := os.Stat(tuzhongPath)
	if os.IsNotExist(err) {
		fmt.Printf("[DEBUG] 文件不存在: %s\n", tuzhongPath)
		info.ErrorMessage = "图种文件不存在"
		return info, fmt.Errorf("图种文件不存在: %s", tuzhongPath)
	}
	fmt.Printf("[DEBUG] 文件存在，大小: %d bytes\n", fileInfo.Size())

	info.TotalSize = fileInfo.Size()

	// 使用不限制大小的文件读取（图种文件可能很大）
	fmt.Println("[DEBUG] 开始调用 readTuzhongFileOptimized...")
	data, err := g.readTuzhongFileOptimized(tuzhongPath)
	if err != nil {
		fmt.Printf("[DEBUG] readTuzhongFileOptimized 失败: %v\n", err)
		info.ErrorMessage = fmt.Sprintf("读取文件失败: %v", err)
		return info, err
	}
	fmt.Printf("[DEBUG] readTuzhongFileOptimized 完成，数据大小: %d bytes\n", len(data))

	// 检测图片格式和大小
	fmt.Println("[DEBUG] 开始调用 detectImageInfo...")
	imageSize, imageFormat, err := g.detectImageInfo(data)
	if err != nil {
		fmt.Printf("[DEBUG] detectImageInfo 失败: %v\n", err)
		info.ErrorMessage = fmt.Sprintf("无法识别图片格式: %v", err)
		return info, err
	}
	fmt.Printf("[DEBUG] detectImageInfo 完成，图片大小: %d, 格式: %s\n", imageSize, imageFormat)

	info.ImageSize = imageSize
	info.ImageFormat = imageFormat

	// 检查是否有隐藏数据
	fmt.Printf("[DEBUG] 检查隐藏数据，总大小: %d, 图片大小: %d\n", len(data), imageSize)
	if int64(len(data)) <= imageSize {
		fmt.Println("[DEBUG] 没有隐藏数据，这是普通图片")
		info.IsValid = false
		info.ErrorMessage = "这是一个普通图片文件，没有隐藏数据"
		return info, nil
	}

	// 提取隐藏的zip数据
	fmt.Println("[DEBUG] 开始提取隐藏数据...")
	hiddenData := data[imageSize:]
	fmt.Printf("[DEBUG] 隐藏数据大小: %d bytes\n", len(hiddenData))
	info.HiddenSize = int64(len(hiddenData))

	// 验证zip数据的基本结构
	if len(hiddenData) < 4 {
		info.IsValid = false
		info.ErrorMessage = "隐藏数据太小，不是有效的zip文件"
		return info, nil
	}

	// 检查zip文件头
	if !(hiddenData[0] == 0x50 && hiddenData[1] == 0x4B) {
		info.IsValid = false
		info.ErrorMessage = "隐藏数据不是有效的zip文件格式"
		return info, nil
	}

	// 尝试解析zip内容
	files, err := g.analyzeZipData(hiddenData)
	if err != nil {
		info.IsValid = false
		info.ErrorMessage = fmt.Sprintf("解析隐藏数据失败: %v", err)
		return info, nil
	}

	info.HiddenFiles = files
	info.IsValid = true

	return info, nil
}

// 从图种中提取文件
func (g *Generator) ExtractFromTuzhong(tuzhongPath, outputDir string) error {
	Info("Starting tuzhong extraction: %s -> %s", tuzhongPath, outputDir)

	// 立即发送初始进度事件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "start",
		"message": "准备开始提取...",
		"percent": 5,
	})
	Debug("Initial progress event sent (5%%)")

	// 获取工作槽位
	Debug("Acquiring worker slot...")
	g.workers <- struct{}{}
	defer func() { <-g.workers }()
	Debug("Worker slot acquired successfully")

	// 发送开始事件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "start",
		"message": "开始解析图种...",
		"percent": 10,
	})
	Debug("Start progress event sent (10%%)")

	// 分析图种
	Debug("Starting tuzhong analysis...")
	info, err := g.AnalyzeTuzhong(tuzhongPath)
	if err != nil {
		Error("Tuzhong analysis failed: %v", err)
		return err
	}
	Info("Tuzhong analysis completed - Valid: %t, ImageSize: %d, HiddenSize: %d",
		info.IsValid, info.ImageSize, info.HiddenSize)

	if !info.IsValid {
		Error("Invalid tuzhong file: %s", info.ErrorMessage)
		return fmt.Errorf(info.ErrorMessage)
	}

	// 发送解析进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "analyze",
		"message": "正在解析图种结构...",
		"percent": 20,
	})
	Debug("Analysis progress event sent (20%%)")

	// 读取图种文件（不限制大小）- 优化：直接提取隐藏数据避免重复读取
	Debug("Extracting hidden data using optimized method, ImageSize: %d", info.ImageSize)
	hiddenData, err := g.extractHiddenDataFromTuzhong(tuzhongPath, info.ImageSize)
	if err != nil {
		Error("Failed to extract hidden data: %v", err)
		return fmt.Errorf("提取隐藏数据失败: %v", err)
	}
	fmt.Printf("[DEBUG] 隐藏数据提取完成，大小: %d bytes\n", len(hiddenData))

	// 发送提取进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "extract",
		"message": "正在提取隐藏文件...",
		"percent": 40,
	})

	// 确保输出目录存在
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("创建输出目录失败: %v", err)
	}

	// 发送准备解压进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "extract",
		"message": "准备解压文件...",
		"percent": 50,
	})

	// 解压zip数据到目标目录
	err = g.extractZipData(hiddenData, outputDir)
	if err != nil {
		return fmt.Errorf("提取文件失败: %v", err)
	}

	// 发送完成事件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "complete",
		"message": "提取完成！",
		"percent": 100,
	})

	return nil
}

// ExtractFromTuzhongWithInfo 使用预分析的信息进行提取，避免重复分析
func (g *Generator) ExtractFromTuzhongWithInfo(tuzhongPath, outputDir string, imageSize int64) error {
	fmt.Printf("[DEBUG] ExtractFromTuzhongWithInfo 开始执行，文件路径: %s，输出目录: %s，imageSize: %d\n", tuzhongPath, outputDir, imageSize)

	// 获取工作槽位
	g.workers <- struct{}{}
	defer func() { <-g.workers }()

	// 发送开始事件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "start",
		"message": "开始提取文件...",
		"percent": 10,
	})

	// 发送解析进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "analyze",
		"message": "使用已分析的信息...",
		"percent": 20,
	})

	// 直接提取隐藏数据，避免重复读取
	fmt.Printf("[DEBUG] 使用优化方法直接提取隐藏数据，ImageSize: %d\n", imageSize)
	hiddenData, err := g.extractHiddenDataFromTuzhong(tuzhongPath, imageSize)
	if err != nil {
		fmt.Printf("[ERROR] 提取隐藏数据失败: %v\n", err)
		return fmt.Errorf("提取隐藏数据失败: %v", err)
	}
	fmt.Printf("[DEBUG] 隐藏数据提取完成，大小: %d bytes\n", len(hiddenData))

	// 发送提取进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "extract",
		"message": "正在提取隐藏文件...",
		"percent": 40,
	})

	// 确保输出目录存在
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("创建输出目录失败: %v", err)
	}

	// 发送准备解压进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "extract",
		"message": "准备解压文件...",
		"percent": 50,
	})

	// 解压zip数据到目标目录
	err = g.extractZipData(hiddenData, outputDir)
	if err != nil {
		return fmt.Errorf("提取文件失败: %v", err)
	}

	// 发送完成事件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "complete",
		"message": "提取完成！",
		"percent": 100,
	})

	return nil
}

// 选择提取位置
func (g *Generator) SelectExtractLocation() (string, error) {
	folder, err := runtime.OpenDirectoryDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择提取位置",
	})
	return folder, err
}

// 检测图片信息 - 优化版本
func (g *Generator) detectImageInfo(data []byte) (int64, string, error) {
	if len(data) < 4 {
		return 0, "", fmt.Errorf("文件太小")
	}

	// JPEG - 优化的检测逻辑
	if len(data) >= 2 && data[0] == 0xFF && data[1] == 0xD8 {
		// 从后往前查找结束标记，提高效率
		for i := len(data) - 2; i >= 2; i-- {
			if data[i] == 0xFF && data[i+1] == 0xD9 {
				return int64(i + 2), "JPEG", nil
			}
		}
		return int64(len(data)), "JPEG", nil
	}

	// PNG - 优化的IEND查找
	if len(data) >= 8 && data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 {
		// 查找IEND chunk
		for i := len(data) - 12; i >= 8; i-- {
			if i+8 <= len(data) && string(data[i:i+4]) == "IEND" {
				return int64(i + 8), "PNG", nil
			}
		}
		return int64(len(data)), "PNG", nil
	}

	// GIF
	if len(data) >= 6 && (string(data[0:6]) == "GIF87a" || string(data[0:6]) == "GIF89a") {
		for i := len(data) - 1; i >= 6; i-- {
			if data[i] == 0x3B {
				return int64(i + 1), "GIF", nil
			}
		}
		return int64(len(data)), "GIF", nil
	}

	// WebP
	if len(data) >= 12 && string(data[0:4]) == "RIFF" && string(data[8:12]) == "WEBP" {
		size := uint32(data[4]) | uint32(data[5])<<8 | uint32(data[6])<<16 | uint32(data[7])<<24
		webpSize := int64(size + 8)
		if webpSize <= int64(len(data)) && webpSize > 0 {
			return webpSize, "WEBP", nil
		}
		return int64(len(data)), "WEBP", nil
	}

	// BMP
	if len(data) >= 14 && data[0] == 0x42 && data[1] == 0x4D {
		size := uint32(data[2]) | uint32(data[3])<<8 | uint32(data[4])<<16 | uint32(data[5])<<24
		if int64(size) <= int64(len(data)) && size > 0 {
			return int64(size), "BMP", nil
		}
		return int64(len(data)), "BMP", nil
	}

	return 0, "", fmt.Errorf("不支持的图片格式")
}

// 分析zip数据内容
func (g *Generator) analyzeZipData(zipData []byte) ([]string, error) {
	if len(zipData) < 22 {
		return nil, fmt.Errorf("zip数据太小，至少需要22字节")
	}

	// 验证zip文件结构
	if err := g.validateZipData(zipData); err != nil {
		return nil, fmt.Errorf("zip文件验证失败: %v", err)
	}

	// 创建内存中的zip读取器
	reader, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return nil, fmt.Errorf("无法解析zip数据: %v", err)
	}

	var files []string
	for _, file := range reader.File {
		files = append(files, file.Name)
	}

	return files, nil
}

// 验证zip文件数据结构
func (g *Generator) validateZipData(data []byte) error {
	// 查找End of Central Directory Record (EOCD)
	eocdPos := -1
	for i := len(data) - 22; i >= 0; i-- {
		if len(data) >= i+4 &&
			data[i] == 0x50 && data[i+1] == 0x4B &&
			data[i+2] == 0x05 && data[i+3] == 0x06 {
			eocdPos = i
			break
		}
	}

	if eocdPos == -1 {
		return fmt.Errorf("找不到zip文件的中央目录结束记录")
	}

	// 验证EOCD记录的完整性
	if len(data) < eocdPos+22 {
		return fmt.Errorf("zip文件的中央目录结束记录不完整")
	}

	// 提取中央目录的偏移量和大小
	cdOffset := uint32(data[eocdPos+16]) | uint32(data[eocdPos+17])<<8 |
		uint32(data[eocdPos+18])<<16 | uint32(data[eocdPos+19])<<24
	cdSize := uint32(data[eocdPos+12]) | uint32(data[eocdPos+13])<<8 |
		uint32(data[eocdPos+14])<<16 | uint32(data[eocdPos+15])<<24

	// 验证偏移量的合理性
	if cdOffset >= uint32(len(data)) {
		return fmt.Errorf("中央目录偏移量超出文件范围: %d >= %d", cdOffset, len(data))
	}

	if cdOffset+cdSize > uint32(len(data)) {
		return fmt.Errorf("中央目录超出文件范围: %d + %d > %d", cdOffset, cdSize, len(data))
	}

	return nil
}

// 提取zip数据到目录 - 优化版本
func (g *Generator) extractZipData(zipData []byte, outputDir string) error {
	if len(zipData) < 22 {
		return fmt.Errorf("zip数据太小，至少需要22字节")
	}

	// 发送验证进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "extract",
		"message": "验证zip文件结构...",
		"percent": 55,
	})

	// 验证zip文件结构
	if err := g.validateZipData(zipData); err != nil {
		return fmt.Errorf("zip文件验证失败: %v", err)
	}

	// 发送打开进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "extract",
		"message": "打开zip文件...",
		"percent": 60,
	})

	// 创建内存中的zip读取器
	reader, err := zip.NewReader(bytes.NewReader(zipData), int64(len(zipData)))
	if err != nil {
		return fmt.Errorf("打开zip文件失败: %v", err)
	}

	totalFiles := len(reader.File)
	currentFile := 0

	for _, file := range reader.File {
		currentFile++

		// 减少进度事件频率，避免UI跳动
		if totalFiles > 0 && (currentFile%5 == 0 || currentFile == totalFiles || currentFile == 1) {
			percent := 40 + int(float64(currentFile)/float64(totalFiles)*50) // 40%-90%
			runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
				"step":    "extract",
				"message": fmt.Sprintf("正在提取文件... (%d/%d)", currentFile, totalFiles),
				"percent": percent,
			})
		}

		err := g.extractSingleFileOptimized(file, outputDir)
		if err != nil {
			return fmt.Errorf("提取文件 %s 失败: %v", file.Name, err)
		}
	}

	return nil
}

// 优化的单文件提取
func (g *Generator) extractSingleFileOptimized(file *zip.File, outputDir string) error {
	// 安全检查文件路径
	if strings.Contains(file.Name, "..") {
		return fmt.Errorf("不安全的文件路径: %s", file.Name)
	}

	targetPath := filepath.Join(outputDir, file.Name)

	// 确保目录存在
	if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
		return err
	}

	// 如果是目录，创建目录并返回
	if file.FileInfo().IsDir() {
		return os.MkdirAll(targetPath, file.FileInfo().Mode())
	}

	// 打开zip中的文件
	rc, err := file.Open()
	if err != nil {
		return err
	}
	defer rc.Close()

	// 创建目标文件
	targetFile, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer targetFile.Close()

	// 使用缓冲区复制文件
	buffer := g.getBuffer()
	defer g.putBuffer(buffer)

	_, err = io.CopyBuffer(targetFile, rc, buffer)
	return err
}

// extractHiddenDataFromTuzhong 直接从图种文件中提取隐藏数据，避免读取整个文件
func (g *Generator) extractHiddenDataFromTuzhong(tuzhongPath string, imageSize int64) ([]byte, error) {
	fmt.Printf("[DEBUG] extractHiddenDataFromTuzhong: 打开文件 %s, imageSize: %d\n", tuzhongPath, imageSize)

	file, err := os.Open(tuzhongPath)
	if err != nil {
		return nil, fmt.Errorf("打开文件失败: %v", err)
	}
	defer file.Close()

	// 跳过图片部分，直接定位到隐藏数据
	fmt.Printf("[DEBUG] 跳过图片部分，定位到偏移量: %d\n", imageSize)
	_, err = file.Seek(imageSize, 0)
	if err != nil {
		return nil, fmt.Errorf("定位文件位置失败: %v", err)
	}

	// 读取剩余的隐藏数据
	fmt.Println("[DEBUG] 开始读取隐藏数据...")
	hiddenData, err := io.ReadAll(file)
	if err != nil {
		return nil, fmt.Errorf("读取隐藏数据失败: %v", err)
	}

	fmt.Printf("[DEBUG] 隐藏数据读取完成，大小: %d bytes\n", len(hiddenData))
	return hiddenData, nil
}
