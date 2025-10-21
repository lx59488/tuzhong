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

// GetImageBase64 包装后端的 GetImageBase64 方法
func (a *App) GetImageBase64(imagePath string) (string, error) {
	return a.generator.GetImageBase64(imagePath)
}

// SelectFile 包装后端的 SelectFile 方法
func (a *App) SelectFile() (string, error) {
	return a.generator.SelectFile()
}

// SelectFolder 包装后端的 SelectFolder 方法
func (a *App) SelectFolder() (string, error) {
	return a.generator.SelectFolder()
}

// SelectSaveLocation 包装后端的 SelectSaveLocation 方法
func (a *App) SelectSaveLocation(defaultName string) (string, error) {
	return a.generator.SelectSaveLocation(defaultName)
}

// SelectExtractLocation 包装后端的 SelectExtractLocation 方法
func (a *App) SelectExtractLocation(suggestedName string) (string, error) {
	return a.generator.SelectExtractLocation(suggestedName)
}

// MergeFiles 包装后端的 MergeFiles 方法供前端访问
func (a *App) MergeFiles(imagePath, targetPath, outputPath string) (string, error) {
	return a.generator.MergeFiles(imagePath, targetPath, outputPath)
}

// OpenFileLocation 包装后端的 OpenFileLocation 方法
func (a *App) OpenFileLocation(filePath string) error {
	return a.generator.OpenFileLocation(filePath)
}

// SelectTuzhongFile 包装后端的 SelectTuzhongFile 方法
func (a *App) SelectTuzhongFile() (string, error) {
	return a.generator.SelectTuzhongFile()
}

// AnalyzeTuzhong 包装后端的 AnalyzeTuzhong 方法
func (a *App) AnalyzeTuzhong(tuzhongPath string) (*backend.TuzhongInfo, error) {
	return a.generator.AnalyzeTuzhong(tuzhongPath)
}

// ExtractFromTuzhong 包装后端的 ExtractFromTuzhong 方法
func (a *App) ExtractFromTuzhong(tuzhongPath, outputDir string) error {
	return a.generator.ExtractFromTuzhong(tuzhongPath, outputDir)
}

func main() {
	// 创建应用程序结构的实例
	app := NewApp()

	// 使用配置选项创建应用程序
	err := wails.Run(&options.App{
		Title:     "图种生成器",
		Width:     900,
		Height:    750,
		MinWidth:  700,
		MinHeight: 600,
		MaxWidth:  1400,
		MaxHeight: 1000,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		// 优化窗口行为，防止标题栏和图标跳动
		DisableResize:     false,
		Fullscreen:        false,
		HideWindowOnClose: false,
		AlwaysOnTop:       false,
		WindowStartState:  options.Normal,
		// 固定窗口属性，防止重绘时的视觉问题
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId:               "com.tuzhong.generator",
			OnSecondInstanceLaunch: nil,
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
