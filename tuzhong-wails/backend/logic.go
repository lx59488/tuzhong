package backend

import (
	"archive/zip"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Generator struct {
	ctx context.Context
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
	return &Generator{}
}

// 设置上下文
func (g *Generator) SetContext(ctx context.Context) {
	g.ctx = ctx
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
	if imagePath == "" {
		return "", fmt.Errorf("图片路径为空")
	}

	// 检查文件是否存在
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		return "", fmt.Errorf("图片文件不存在: %s", imagePath)
	}

	// 读取图片文件
	imageData, err := os.ReadFile(imagePath)
	if err != nil {
		return "", fmt.Errorf("读取图片文件失败: %v", err)
	}

	// 检查文件大小（限制为 20MB，增加限制）
	if len(imageData) > 20*1024*1024 {
		return "", fmt.Errorf("图片文件太大（%.2f MB），请选择小于 20MB 的图片", float64(len(imageData))/(1024*1024))
	}

	// 检查文件是否为空
	if len(imageData) == 0 {
		return "", fmt.Errorf("图片文件为空")
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
			return "", fmt.Errorf("不支持的图片格式: %s", ext)
		}
	}

	// 转换为 base64
	base64String := base64.StdEncoding.EncodeToString(imageData)

	// 返回完整的 data URL
	return fmt.Sprintf("data:%s;base64,%s", mimeType, base64String), nil
}

// 通过文件头检测图片格式
func (g *Generator) detectImageMimeType(data []byte) string {
	if len(data) < 4 {
		return ""
	}

	// JPEG
	if len(data) >= 2 && data[0] == 0xFF && data[1] == 0xD8 {
		return "image/jpeg"
	}

	// PNG
	if len(data) >= 8 && data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 &&
		data[4] == 0x0D && data[5] == 0x0A && data[6] == 0x1A && data[7] == 0x0A {
		return "image/png"
	}

	// GIF
	if len(data) >= 6 && string(data[0:6]) == "GIF87a" || string(data[0:6]) == "GIF89a" {
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

// 选择任意文件
func (g *Generator) SelectFile() (string, error) {
	file, err := runtime.OpenFileDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择要隐藏的文件",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "所有文件",
				Pattern:     "*.*",
			},
		},
	})
	return file, err
}

// 选择文件夹
func (g *Generator) SelectFolder() (string, error) {
	folder, err := runtime.OpenDirectoryDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择要隐藏的文件夹",
	})
	return folder, err
}

// 选择保存位置
func (g *Generator) SelectSaveLocation(defaultName string) (string, error) {
	file, err := runtime.SaveFileDialog(g.ctx, runtime.SaveDialogOptions{
		Title:           "保存图种",
		DefaultFilename: defaultName,
		Filters: []runtime.FileFilter{
			{
				DisplayName: "图片文件",
				Pattern:     "*.jpg;*.jpeg;*.png",
			},
		},
	})
	return file, err
}

// 选择提取文件夹
func (g *Generator) SelectExtractLocation(suggestedName string) (string, error) {
	folder, err := runtime.OpenDirectoryDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择提取位置",
	})
	if err != nil || folder == "" {
		return "", err
	}

	// 在选择的文件夹中创建以建议名称命名的子文件夹
	extractPath := filepath.Join(folder, suggestedName)
	return extractPath, nil
}

// 图种生成逻辑，供前端调用
func (g *Generator) MergeFiles(imagePath, targetPath, outputPath string) (string, error) {
	// 发送开始事件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "start",
		"message": "开始生成图种...",
		"percent": 0,
	})

	// 创建临时zip文件
	tempDir := filepath.Dir(outputPath)
	tempZip := filepath.Join(tempDir, "temp_"+filepath.Base(outputPath)+".zip")

	// 发送压缩进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "compress",
		"message": "正在压缩文件...",
		"percent": 10,
	})

	err := g.createZipWithProgress(targetPath, tempZip)
	if err != nil {
		return "", err
	}
	defer os.Remove(tempZip) // 清理临时文件

	// 发送合并进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "merge",
		"message": "正在生成图种...",
		"percent": 60,
	})

	outFile, err := os.Create(outputPath)
	if err != nil {
		return "", err
	}
	defer outFile.Close()

	if err := g.appendFile(outFile, imagePath); err != nil {
		return "", err
	}

	// 发送最终合并进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "merge",
		"message": "正在生成图种...",
		"percent": 80,
	})

	if err := g.appendFile(outFile, tempZip); err != nil {
		return "", err
	}

	// 发送完成事件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "complete",
		"message": "图种生成完成！",
		"percent": 100,
	})

	return "图种生成成功！文件已保存到: " + outputPath, nil
}

func (g *Generator) appendFile(dst *os.File, srcPath string) error {
	src, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer src.Close()

	_, err = io.Copy(dst, src)
	return err
}

// 创建zip压缩文件
func (g *Generator) createZip(sourcePath, zipPath string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	// 检查是文件还是文件夹
	info, err := os.Stat(sourcePath)
	if err != nil {
		return err
	}

	if info.IsDir() {
		return g.addDirToZip(zipWriter, sourcePath, "")
	} else {
		return g.addFileToZip(zipWriter, sourcePath, filepath.Base(sourcePath))
	}
}

// 将文件夹添加到zip
func (g *Generator) addDirToZip(zipWriter *zip.Writer, dirPath, baseInZip string) error {
	return filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 计算在zip中的路径
		relPath, err := filepath.Rel(dirPath, path)
		if err != nil {
			return err
		}

		zipPath := filepath.Join(baseInZip, relPath)
		// 将Windows路径分隔符转换为标准的斜杠
		zipPath = strings.ReplaceAll(zipPath, "\\", "/")

		if info.IsDir() {
			// 为文件夹创建一个条目（以/结尾）
			if zipPath != "" && zipPath != "." {
				_, err := zipWriter.Create(zipPath + "/")
				return err
			}
			return nil
		}

		return g.addFileToZip(zipWriter, path, zipPath)
	})
}

// 将文件添加到zip
func (g *Generator) addFileToZip(zipWriter *zip.Writer, filePath, nameInZip string) error {
	file, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	zipEntry, err := zipWriter.Create(nameInZip)
	if err != nil {
		return err
	}

	_, err = io.Copy(zipEntry, file)
	return err
}

// 带进度的压缩方法
func (g *Generator) createZipWithProgress(sourcePath, zipPath string) error {
	zipFile, err := os.Create(zipPath)
	if err != nil {
		return err
	}
	defer zipFile.Close()

	zipWriter := zip.NewWriter(zipFile)
	defer zipWriter.Close()

	// 检查是文件还是文件夹
	info, err := os.Stat(sourcePath)
	if err != nil {
		return err
	}

	if info.IsDir() {
		// 先统计总文件数
		totalFiles := 0
		filepath.Walk(sourcePath, func(path string, info os.FileInfo, err error) error {
			if err == nil && !info.IsDir() {
				totalFiles++
			}
			return nil
		})

		currentFile := 0
		return filepath.Walk(sourcePath, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			relPath, err := filepath.Rel(sourcePath, path)
			if err != nil {
				return err
			}

			zipPath := strings.ReplaceAll(relPath, "\\", "/")

			if info.IsDir() {
				if zipPath != "" && zipPath != "." {
					_, err := zipWriter.Create(zipPath + "/")
					return err
				}
				return nil
			}

			currentFile++
			// 减少进度事件频率，避免UI跳动
			if totalFiles > 0 && (currentFile%10 == 0 || currentFile == totalFiles || currentFile == 1) {
				percent := 10 + int(float64(currentFile)/float64(totalFiles)*50) // 10%-60%
				runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
					"step":    "compress",
					"message": fmt.Sprintf("正在压缩文件... (%d/%d)", currentFile, totalFiles),
					"percent": percent,
				})
			}

			return g.addFileToZip(zipWriter, path, zipPath)
		})
	} else {
		// 单文件压缩
		runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
			"step":    "compress",
			"message": "正在压缩文件...",
			"percent": 30,
		})
		return g.addFileToZip(zipWriter, sourcePath, filepath.Base(sourcePath))
	}
}

// 打开文件所在位置的方法
func (g *Generator) OpenFileLocation(filePath string) error {
	runtime.BrowserOpenURL(g.ctx, "file://"+filepath.Dir(filePath))
	return nil
}

// 选择图种文件进行解析
func (g *Generator) SelectTuzhongFile() (string, error) {
	file, err := runtime.OpenFileDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择图种文件",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "图片文件",
				Pattern:     "*.jpg;*.jpeg;*.png;*.gif;*.bmp;*.webp",
			},
			{
				DisplayName: "所有文件",
				Pattern:     "*.*",
			},
		},
	})
	return file, err
}

// 分析图种文件
func (g *Generator) AnalyzeTuzhong(tuzhongPath string) (*TuzhongInfo, error) {
	info := &TuzhongInfo{}

	if tuzhongPath == "" {
		info.ErrorMessage = "请选择图种文件"
		return info, fmt.Errorf("图种文件路径为空")
	}

	// 检查文件是否存在
	fileInfo, err := os.Stat(tuzhongPath)
	if os.IsNotExist(err) {
		info.ErrorMessage = "图种文件不存在"
		return info, fmt.Errorf("图种文件不存在: %s", tuzhongPath)
	}

	info.TotalSize = fileInfo.Size()

	// 读取文件
	data, err := os.ReadFile(tuzhongPath)
	if err != nil {
		info.ErrorMessage = fmt.Sprintf("读取文件失败: %v", err)
		return info, err
	}

	// 检测图片格式和大小
	imageSize, imageFormat, err := g.detectImageInfo(data)
	if err != nil {
		info.ErrorMessage = fmt.Sprintf("无法识别图片格式: %v", err)
		return info, err
	}

	info.ImageSize = imageSize
	info.ImageFormat = imageFormat

	// 检查是否有隐藏数据
	if int64(len(data)) <= imageSize {
		info.IsValid = false
		info.ErrorMessage = "这是一个普通图片文件，没有隐藏数据"
		// 虽然不是一个有效的图种，但对于前端来说这不是一个需要弹窗的“错误”，而是一个状态
		// 所以我们返回 info 对象，让前端根据 IsValid 字段来判断如何显示
		return info, nil
	}

	// 提取隐藏的zip数据
	hiddenData := data[imageSize:]
	info.HiddenSize = int64(len(hiddenData))

	// 尝试解析zip内容
	files, err := g.analyzeZipData(hiddenData)
	if err != nil {
		info.IsValid = false
		info.ErrorMessage = "解析隐藏数据失败，可能不是一个有效的图种文件。"
		// 同样，返回 info 对象供前端判断
		return info, nil
	}

	info.HiddenFiles = files
	info.IsValid = true

	return info, nil
}

// 从图种中提取文件
func (g *Generator) ExtractFromTuzhong(tuzhongPath, outputDir string) error {
	// 发送开始事件
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "start",
		"message": "开始解析图种...",
		"percent": 0,
	})

	// 分析图种
	info, err := g.AnalyzeTuzhong(tuzhongPath)
	if err != nil {
		return err
	}

	if !info.IsValid {
		return fmt.Errorf(info.ErrorMessage)
	}

	// 发送解析进度
	runtime.EventsEmit(g.ctx, "progress", map[string]interface{}{
		"step":    "analyze",
		"message": "正在解析图种结构...",
		"percent": 20,
	})

	// 读取文件
	data, err := os.ReadFile(tuzhongPath)
	if err != nil {
		return fmt.Errorf("读取图种文件失败: %v", err)
	}

	// 提取隐藏数据
	hiddenData := data[info.ImageSize:]

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

// 检测图片信息
func (g *Generator) detectImageInfo(data []byte) (int64, string, error) {
	if len(data) < 4 {
		return 0, "", fmt.Errorf("文件太小")
	}

	// JPEG
	if len(data) >= 2 && data[0] == 0xFF && data[1] == 0xD8 {
		// 查找JPEG结束标记 FF D9
		for i := len(data) - 2; i >= 0; i-- {
			if data[i] == 0xFF && data[i+1] == 0xD9 {
				return int64(i + 2), "JPEG", nil
			}
		}
		return int64(len(data)), "JPEG", nil
	}

	// PNG
	if len(data) >= 8 && data[0] == 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47 {
		// 查找PNG结束标记 IEND
		for i := len(data) - 12; i >= 0; i-- {
			if string(data[i:i+4]) == "IEND" {
				return int64(i + 8), "PNG", nil
			}
		}
		return int64(len(data)), "PNG", nil
	}

	// GIF
	if len(data) >= 6 && (string(data[0:6]) == "GIF87a" || string(data[0:6]) == "GIF89a") {
		// GIF以 0x3B 结束
		for i := len(data) - 1; i >= 0; i-- {
			if data[i] == 0x3B {
				return int64(i + 1), "GIF", nil
			}
		}
		return int64(len(data)), "GIF", nil
	}

	return 0, "", fmt.Errorf("不支持的图片格式")
}

// 分析zip数据内容
func (g *Generator) analyzeZipData(zipData []byte) ([]string, error) {
	// 创建内存中的zip读取器
	reader, err := zip.NewReader(strings.NewReader(string(zipData)), int64(len(zipData)))
	if err != nil {
		return nil, fmt.Errorf("无法解析zip数据: %v", err)
	}

	var files []string
	for _, file := range reader.File {
		files = append(files, file.Name)
	}

	return files, nil
}

// 提取zip数据到目录
func (g *Generator) extractZipData(zipData []byte, outputDir string) error {
	// 创建内存中的zip读取器
	reader, err := zip.NewReader(strings.NewReader(string(zipData)), int64(len(zipData)))
	if err != nil {
		return fmt.Errorf("无法解析zip数据: %v", err)
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

		// 构建输出路径
		outputPath := filepath.Join(outputDir, file.Name)

		// 确保目录存在
		if file.FileInfo().IsDir() {
			os.MkdirAll(outputPath, file.FileInfo().Mode())
			continue
		}

		// 确保父目录存在
		if err := os.MkdirAll(filepath.Dir(outputPath), 0755); err != nil {
			return fmt.Errorf("创建目录失败: %v", err)
		}

		// 打开zip中的文件
		rc, err := file.Open()
		if err != nil {
			return fmt.Errorf("打开zip文件失败: %v", err)
		}

		// 创建输出文件
		outFile, err := os.Create(outputPath)
		if err != nil {
			rc.Close()
			return fmt.Errorf("创建输出文件失败: %v", err)
		}

		// 复制文件内容
		_, err = io.Copy(outFile, rc)
		rc.Close()
		outFile.Close()

		if err != nil {
			return fmt.Errorf("复制文件内容失败: %v", err)
		}
	}

	return nil
}
