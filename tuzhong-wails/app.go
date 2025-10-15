package main

import (
	"context"
	"embed"
	"tuzhong-wails/backend"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

// App 应用结构体
type App struct {
	ctx       context.Context
	generator *backend.Generator
}

// NewApp 创建一个新的应用程序结构实例
func NewApp() *App {
	return &App{
		generator: backend.NewGenerator(),
	}
}

// startup 在应用启动时调用。传入的上下文
// 可用于执行启动任务，例如保存
// 上下文供将来使用
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.generator.SetContext(ctx)
}

// SelectImageFile 包装后端的 SelectImageFile 方法
func (a *App) SelectImageFile() (string, error) {
	return a.generator.SelectImageFile()
}

// SelectZipFile 包装后端的 SelectZipFile 方法
func (a *App) SelectZipFile() (string, error) {
	return a.generator.SelectZipFile()
}

// SelectSaveLocation 包装后端的 SelectSaveLocation 方法
func (a *App) SelectSaveLocation(defaultName string) (string, error) {
	return a.generator.SelectSaveLocation(defaultName)
}

// MergeFiles 包装后端的 MergeFiles 方法供前端访问
func (a *App) MergeFiles(imagePath, zipPath, outputPath string) (string, error) {
	return a.generator.MergeFiles(imagePath, zipPath, outputPath)
}

func main() {
	// 创建应用程序结构的实例
	app := NewApp()

	// 使用配置选项创建应用程序
	err := wails.Run(&options.App{
		Title:  "图种生成器",
		Width:  600,
		Height: 400,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup: app.startup,
		Bind: []interface{}{
			app,
		},
	})
	if err != nil {
		panic(err)
	}
}
