package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("用法: image-check.exe <图片路径>")
		return
	}

	imagePath := os.Args[1]

	// 检查文件是否存在
	if _, err := os.Stat(imagePath); os.IsNotExist(err) {
		fmt.Printf("❌ 文件不存在: %s\n", imagePath)
		return
	}

	// 获取文件信息
	fileInfo, err := os.Stat(imagePath)
	if err != nil {
		fmt.Printf("❌ 无法获取文件信息: %v\n", err)
		return
	}

	fmt.Printf("📁 文件路径: %s\n", imagePath)
	fmt.Printf("📊 文件大小: %d 字节 (%.2f MB)\n", fileInfo.Size(), float64(fileInfo.Size())/(1024*1024))

	// 检查扩展名
	ext := strings.ToLower(filepath.Ext(imagePath))
	fmt.Printf("📎 文件扩展名: %s\n", ext)

	// 读取文件头
	file, err := os.Open(imagePath)
	if err != nil {
		fmt.Printf("❌ 无法打开文件: %v\n", err)
		return
	}
	defer file.Close()

	// 读取前16字节
	header := make([]byte, 16)
	n, err := file.Read(header)
	if err != nil {
		fmt.Printf("❌ 无法读取文件头: %v\n", err)
		return
	}

	fmt.Printf("🔍 文件头 (前%d字节): ", n)
	for i := 0; i < n; i++ {
		fmt.Printf("%02X ", header[i])
	}
	fmt.Println()

	// 检测图片格式
	if n >= 2 && header[0] == 0xFF && header[1] == 0xD8 {
		fmt.Println("✅ 检测到 JPEG 格式 (FF D8)")

		// 检查文件尾部是否有 JPEG 结束标记
		fileSize := fileInfo.Size()
		if fileSize > 2 {
			file.Seek(fileSize-2, 0)
			tail := make([]byte, 2)
			file.Read(tail)
			if tail[0] == 0xFF && tail[1] == 0xD9 {
				fmt.Println("✅ 找到 JPEG 结束标记 (FF D9)")
			} else {
				fmt.Printf("⚠️  文件尾部不是标准 JPEG 结束标记: %02X %02X\n", tail[0], tail[1])
			}
		}
	} else if n >= 8 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47 {
		fmt.Println("🔍 实际是 PNG 格式 (89 50 4E 47)")
	} else if n >= 12 && string(header[0:4]) == "RIFF" && string(header[8:12]) == "WEBP" {
		fmt.Println("🔍 实际是 WebP 格式")
	} else if n >= 6 && (string(header[0:6]) == "GIF87a" || string(header[0:6]) == "GIF89a") {
		fmt.Println("🔍 实际是 GIF 格式")
	} else if n >= 2 && header[0] == 0x42 && header[1] == 0x4D {
		fmt.Println("🔍 实际是 BMP 格式")
	} else {
		fmt.Println("❌ 无法识别的图片格式")
		fmt.Println("📋 常见格式特征:")
		fmt.Println("   JPEG: FF D8 开头")
		fmt.Println("   PNG:  89 50 4E 47 开头")
		fmt.Println("   WebP: RIFF...WEBP")
		fmt.Println("   GIF:  GIF87a 或 GIF89a")
		fmt.Println("   BMP:  42 4D 开头")
	}

	// 检查是否符合你的应用要求
	fmt.Println()
	fmt.Println("🔧 应用兼容性检查:")

	// 扩展名检查
	supportedExts := []string{".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
	extSupported := false
	for _, supportedExt := range supportedExts {
		if ext == supportedExt {
			extSupported = true
			break
		}
	}

	if extSupported {
		fmt.Printf("✅ 扩展名 %s 被支持\n", ext)
	} else {
		fmt.Printf("❌ 扩展名 %s 不被支持\n", ext)
	}

	// 文件头检查
	if n >= 2 && header[0] == 0xFF && header[1] == 0xD8 && (ext == ".jpg" || ext == ".jpeg") {
		fmt.Println("✅ JPEG 文件头和扩展名匹配")
	} else if ext == ".jpg" || ext == ".jpeg" {
		fmt.Println("❌ 文件扩展名是 JPG 但文件头不是 JPEG 格式")
		fmt.Println("💡 建议: 用图片编辑器重新保存为标准 JPEG 格式")
	}
}
