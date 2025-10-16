package main

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

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

	var imagePath, targetPath string

	imageLabel := widget.NewLabel("未选择图片")
	targetLabel := widget.NewLabel("未选择文件/文件夹")

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

	// 修改为选择文件或文件夹
	targetBtn := widget.NewButton("选择文件/文件夹", func() {
		// 先询问用户要选择文件还是文件夹
		fileBtn := widget.NewButton("选择文件", func() {
			file, err := sysdialog.File().Title("选择要隐藏的文件").Load()
			if err != nil {
				fmt.Println("取消选择或错误:", err)
				return
			}
			targetPath = file
			targetLabel.SetText("文件: " + filepath.Base(file))
		})

		folderBtn := widget.NewButton("选择文件夹", func() {
			folder, err := sysdialog.Directory().Title("选择要隐藏的文件夹").Browse()
			if err != nil {
				fmt.Println("取消选择或错误:", err)
				return
			}
			targetPath = folder
			targetLabel.SetText("文件夹: " + filepath.Base(folder))
		})

		selectDialog := dialog.NewCustom("选择类型", "取消",
			container.NewHBox(fileBtn, folderBtn), w)
		selectDialog.Show()
	})

	generateBtn := widget.NewButton("生成图种", func() {
		if imagePath == "" || targetPath == "" {
			dialog.ShowError(fmt.Errorf("缺少参数：请确保选择了图片和文件/文件夹"), w)
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

		// 创建进度条对话框
		progress := widget.NewProgressBar()
		progressLabel := widget.NewLabel("准备开始...")
		progressDialog := dialog.NewCustom("生成图种", "取消", container.NewVBox(
			progressLabel,
			progress,
		), w)
		progressDialog.Show()

		// 在goroutine中执行耗时操作
		go func() {
			defer progressDialog.Hide()

			// 步骤1: 压缩文件 (0-50%)
			progressLabel.SetText("正在压缩文件...")
			progress.SetValue(0.1)

			tempDir := filepath.Dir(savePath)
			tempZip := filepath.Join(tempDir, "temp_"+filepath.Base(savePath)+".zip")

			err = createZipWithProgress(targetPath, tempZip, func(current, total int) {
				if total > 0 {
					p := 0.1 + (float64(current)/float64(total))*0.4 // 10%-50%
					progress.SetValue(p)
				}
			})
			if err != nil {
				dialog.ShowError(fmt.Errorf("压缩文件失败: %v", err), w)
				return
			}
			defer os.Remove(tempZip) // 清理临时文件

			// 步骤2: 合并文件 (50-100%)
			progressLabel.SetText("正在生成图种...")
			progress.SetValue(0.5)

			err = mergeFilesWithProgress(imagePath, tempZip, savePath, func(p float64) {
				progress.SetValue(0.5 + p*0.5) // 50%-100%
			})

			if err != nil {
				dialog.ShowError(fmt.Errorf("生成失败: %v", err), w)
			} else {
				progress.SetValue(1.0)
				progressLabel.SetText("生成完成！")

				// 显示成功对话框
				successDialog := dialog.NewConfirm("生成成功",
					fmt.Sprintf("图种文件已成功保存到:\n%s\n\n是否打开文件所在位置？", savePath),
					func(open bool) {
						if open {
							// 打开文件所在文件夹
							openFileLocation(savePath)
						}
					}, w)
				successDialog.Show()
			}
		}()
	})

	w.SetContent(container.NewVBox(
		imageBtn, imageLabel,
		targetBtn, targetLabel,
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

// 创建zip压缩文件
func createZip(sourcePath, zipPath string) error {
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
		return addDirToZip(zipWriter, sourcePath, "")
	} else {
		return addFileToZip(zipWriter, sourcePath, filepath.Base(sourcePath))
	}
}

// 将文件夹添加到zip
func addDirToZip(zipWriter *zip.Writer, dirPath, baseInZip string) error {
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

		return addFileToZip(zipWriter, path, zipPath)
	})
}

// 将文件添加到zip
func addFileToZip(zipWriter *zip.Writer, filePath, nameInZip string) error {
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

// 带进度回调的压缩函数
func createZipWithProgress(sourcePath, zipPath string, progressCallback func(current, total int)) error {
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
			progressCallback(currentFile, totalFiles)
			return addFileToZip(zipWriter, path, zipPath)
		})
	} else {
		progressCallback(0, 1)
		err = addFileToZip(zipWriter, sourcePath, filepath.Base(sourcePath))
		if err == nil {
			progressCallback(1, 1)
		}
		return err
	}
}

// 带进度回调的文件合并函数
func mergeFilesWithProgress(imagePath, zipPath, outputPath string, progressCallback func(p float64)) error {
	outFile, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	// 复制图片文件 (0-50%)
	progressCallback(0.0)
	if err := appendFileWithProgress(outFile, imagePath, func(p float64) {
		progressCallback(p * 0.5)
	}); err != nil {
		return err
	}

	// 复制zip文件 (50-100%)
	if err := appendFileWithProgress(outFile, zipPath, func(p float64) {
		progressCallback(0.5 + p*0.5)
	}); err != nil {
		return err
	}

	progressCallback(1.0)
	return nil
}

// 带进度回调的文件追加函数
func appendFileWithProgress(dst *os.File, srcPath string, progressCallback func(p float64)) error {
	src, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer src.Close()

	// 获取文件大小
	stat, err := src.Stat()
	if err != nil {
		return err
	}
	totalSize := stat.Size()

	// 创建进度跟踪的复制
	buf := make([]byte, 32*1024) // 32KB buffer
	var written int64

	for {
		nr, er := src.Read(buf)
		if nr > 0 {
			nw, ew := dst.Write(buf[0:nr])
			if nw > 0 {
				written += int64(nw)
				if totalSize > 0 {
					progressCallback(float64(written) / float64(totalSize))
				}
			}
			if ew != nil {
				return ew
			}
			if nr != nw {
				return io.ErrShortWrite
			}
		}
		if er != nil {
			if er != io.EOF {
				return er
			}
			break
		}
	}
	return nil
}

// 打开文件所在位置
func openFileLocation(filePath string) {
	dir := filepath.Dir(filePath)
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", "/select,", filePath)
	case "darwin":
		cmd = exec.Command("open", "-R", filePath)
	case "linux":
		cmd = exec.Command("xdg-open", dir)
	default:
		return
	}

	cmd.Start()
}
