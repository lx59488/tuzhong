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
			// 发送压缩进度
			if totalFiles > 0 {
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
