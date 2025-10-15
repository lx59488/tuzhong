package backend

import (
	"context"
	"io"
	"os"

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
				Pattern:     "*.jpg;*.jpeg;*.png",
			},
		},
	})
	return file, err
}

// 选择压缩包文件
func (g *Generator) SelectZipFile() (string, error) {
	file, err := runtime.OpenFileDialog(g.ctx, runtime.OpenDialogOptions{
		Title: "选择压缩包",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "压缩包文件",
				Pattern:     "*.zip",
			},
		},
	})
	return file, err
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
func (g *Generator) MergeFiles(imagePath, zipPath, outputPath string) (string, error) {
	outFile, err := os.Create(outputPath)
	if err != nil {
		return "", err
	}
	defer outFile.Close()

	if err := g.appendFile(outFile, imagePath); err != nil {
		return "", err
	}
	if err := g.appendFile(outFile, zipPath); err != nil {
		return "", err
	}
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
