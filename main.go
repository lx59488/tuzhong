package main

import (
	"fmt"
	"io"
	"os"
	"path/filepath"

	"fyne.io/fyne/v2"
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/dialog"
	"fyne.io/fyne/v2/widget"
	sysdialog "github.com/sqweek/dialog"
)

func main() {
	a := app.New()
	w := a.NewWindow("图种生成器")

	var imagePath, zipPath string

	imageLabel := widget.NewLabel("未选择图片")
	zipLabel := widget.NewLabel("未选择压缩包")

	outputName := widget.NewEntry()
	outputName.SetPlaceHolder("输出文件名，如 output.jpg")

	// 替换后的按钮：调用系统原生文件选择器
	imageBtn := widget.NewButton("选择图片", func() {
		file, err := sysdialog.File().Title("选择封面图片").Filter("图片", "jpg", "jpeg", "png").Load()
		if err != nil {
			fmt.Println("取消选择或错误:", err)
			return
		}
		imagePath = file
		imageLabel.SetText("图片: " + filepath.Base(file))
	})

	zipBtn := widget.NewButton("选择压缩包", func() {
		file, err := sysdialog.File().Title("选择压缩包").Filter("压缩文件", "zip").Load()
		if err != nil {
			fmt.Println("取消选择或错误:", err)
			return
		}
		zipPath = file
		zipLabel.SetText("压缩包: " + filepath.Base(file))
	})

	generateBtn := widget.NewButton("生成图种", func() {
		if imagePath == "" || zipPath == "" {
			dialog.ShowError(fmt.Errorf("缺少参数：请确保选择了图片和压缩包"), w)
			return
		}

		if outputName.Text == "" {
			dialog.ShowError(fmt.Errorf("请填写输出文件名（如 output.jpg）"), w)
			return
		}

		// 弹出系统保存对话框，让用户选择完整路径
		savePath, err := sysdialog.File().Title("保存图种").SetStartFile(outputName.Text).Save()
		if err != nil {
			fmt.Println("取消保存或出错:", err)
			return
		}

		err = mergeFiles(imagePath, zipPath, savePath)
		if err != nil {
			dialog.ShowError(fmt.Errorf("生成失败: %v", err), w)
		} else {
			dialog.ShowInformation("成功", "图种文件已保存到:\n"+savePath, w)
		}
	})

	w.SetContent(container.NewVBox(
		imageBtn, imageLabel,
		zipBtn, zipLabel,
		outputName,
		generateBtn,
	))

	w.Resize(fyne.NewSize(400, 300))
	w.ShowAndRun()
}

func mergeFiles(imagePath, zipPath, outputPath string) error {
	outFile, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	if err := appendFile(outFile, imagePath); err != nil {
		return err
	}
	if err := appendFile(outFile, zipPath); err != nil {
		return err
	}
	return nil
}

func appendFile(dst *os.File, srcPath string) error {
	src, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer src.Close()

	_, err = io.Copy(dst, src)
	return err
}
