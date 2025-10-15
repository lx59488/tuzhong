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

// App struct
type App struct {
	ctx       context.Context
	generator *backend.Generator
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		generator: backend.NewGenerator(),
	}
}

// startup is called when the app starts. The context passed
// can be used to perform startup tasks, such as saving
// the context for future use
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.generator.SetContext(ctx)
}

// SelectImageFile wraps the backend SelectImageFile method
func (a *App) SelectImageFile() (string, error) {
	return a.generator.SelectImageFile()
}

// SelectZipFile wraps the backend SelectZipFile method
func (a *App) SelectZipFile() (string, error) {
	return a.generator.SelectZipFile()
}

// SelectSaveLocation wraps the backend SelectSaveLocation method
func (a *App) SelectSaveLocation(defaultName string) (string, error) {
	return a.generator.SelectSaveLocation(defaultName)
}

// MergeFiles wraps the backend MergeFiles method for frontend access
func (a *App) MergeFiles(imagePath, zipPath, outputPath string) (string, error) {
	return a.generator.MergeFiles(imagePath, zipPath, outputPath)
}

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Create application with options
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
