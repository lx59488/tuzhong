package main

import (
	"context"
	"embed"
	"os"
	"path/filepath"

	"github.com/lixin/tuzhong/backend"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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

	// 初始化日志系统
	backend.Info("Application starting up...")

	// 初始化配置系统
	configPath := a.getConfigPath()
	if err := backend.InitConfig(configPath); err != nil {
		// 如果配置初始化失败，使用默认配置
		backend.Warn("Failed to initialize config from %s, using default config: %v", configPath, err)
		backend.GlobalConfigManager = backend.NewConfigManager(configPath)
	} else {
		backend.Info("Configuration initialized successfully from: %s", configPath)
	}

	backend.Info("Application startup completed")
}

// getConfigPath 获取配置文件路径
func (a *App) getConfigPath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "./config.json"
	}
	return filepath.Join(homeDir, ".tuzhong", "config.json")
}

// SelectImageFile 包装后端的 SelectImageFile 方法
func (a *App) SelectImageFile() (string, error) {
	return a.generator.SelectImageFile()
}

// GetImageBase64 包装后端的 GetImageBase64 方法
func (a *App) GetImageBase64(imagePath string) (string, error) {
	return a.generator.GetImageBase64(imagePath)
}

// GetTuzhongImageBase64 获取图种文件的图片预览（不限制文件大小）
func (a *App) GetTuzhongImageBase64(imagePath string) (string, error) {
	return a.generator.GetTuzhongImageBase64(imagePath)
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
	return a.generator.SelectSaveLocation()
}

// SelectExtractLocation 包装后端的 SelectExtractLocation 方法
func (a *App) SelectExtractLocation(suggestedName string) (string, error) {
	return a.generator.SelectExtractLocation()
}

// MergeFiles 包装后端的 MergeFiles 方法供前端访问
func (a *App) MergeFiles(imagePath, targetPath, outputPath string) (string, error) {
	backend.Info("Starting file merge operation: image=%s, target=%s, output=%s", imagePath, targetPath, outputPath)

	err := a.generator.MergeFiles(imagePath, targetPath, outputPath)
	if err != nil {
		backend.Error("File merge operation failed: %v", err)
		return "", err
	}

	backend.Info("File merge operation completed successfully: %s", outputPath)
	return "合并完成", nil
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
	backend.Info("Starting tuzhong analysis: %s", tuzhongPath)

	info, err := a.generator.AnalyzeTuzhong(tuzhongPath)
	if err != nil {
		backend.Error("Tuzhong analysis failed: %v", err)
		return nil, err
	}

	backend.Info("Tuzhong analysis completed - Valid: %t, ImageSize: %d, HiddenSize: %d",
		info.IsValid, info.ImageSize, info.HiddenSize)
	return info, nil
}

// ExtractFromTuzhong 包装后端的 ExtractFromTuzhong 方法
func (a *App) ExtractFromTuzhong(tuzhongPath, outputDir string) error {
	backend.Info("Starting tuzhong extraction: %s -> %s", tuzhongPath, outputDir)

	err := a.generator.ExtractFromTuzhong(tuzhongPath, outputDir)
	if err != nil {
		backend.Error("Tuzhong extraction failed: %v", err)
		return err
	}

	backend.Info("Tuzhong extraction completed successfully: %s", outputDir)
	return nil
}

// ExtractFromTuzhongWithInfo 使用预分析的信息进行提取，避免重复分析
func (a *App) ExtractFromTuzhongWithInfo(tuzhongPath, outputDir string, imageSize int64) error {
	return a.generator.ExtractFromTuzhongWithInfo(tuzhongPath, outputDir, imageSize)
}

// ===== 配置管理方法 =====

// GetConfig 获取当前配置
func (a *App) GetConfig() *backend.AppConfig {
	return backend.GetGlobalConfig()
}

// UpdateFileSizeLimits 更新文件大小限制
func (a *App) UpdateFileSizeLimits(limits backend.FileSizeLimits) error {
	if backend.GlobalConfigManager == nil {
		return backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}
	return backend.GlobalConfigManager.UpdateFileSizeLimits(limits)
}

// DisableFileSizeCheck 禁用文件大小检查
func (a *App) DisableFileSizeCheck() error {
	if backend.GlobalConfigManager == nil {
		return backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}
	return backend.GlobalConfigManager.DisableFileSizeCheck()
}

// EnableFileSizeCheck 启用文件大小检查
func (a *App) EnableFileSizeCheck() error {
	if backend.GlobalConfigManager == nil {
		return backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}
	return backend.GlobalConfigManager.EnableFileSizeCheck()
}

// RemoveAllSizeLimits 移除所有文件大小限制
func (a *App) RemoveAllSizeLimits() error {
	if backend.GlobalConfigManager == nil {
		return backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}
	return backend.GlobalConfigManager.RemoveAllSizeLimits()
}

// SetMaxImageSize 设置最大图片大小（字节）
func (a *App) SetMaxImageSize(size int64) error {
	if backend.GlobalConfigManager == nil {
		return backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}
	return backend.GlobalConfigManager.SetMaxImageSize(size)
}

// SetMaxZipSize 设置最大ZIP文件大小（字节）
func (a *App) SetMaxZipSize(size int64) error {
	if backend.GlobalConfigManager == nil {
		return backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}
	return backend.GlobalConfigManager.SetMaxZipSize(size)
}

// GetLoggingConfig 获取日志配置
func (a *App) GetLoggingConfig() (backend.LoggingConfig, error) {
	if backend.GlobalConfigManager == nil {
		return backend.LoggingConfig{}, backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}
	return backend.GlobalConfigManager.GetConfig().Logging, nil
}

// UpdateLoggingConfig 更新日志配置
func (a *App) UpdateLoggingConfig(config backend.LoggingConfig) error {
	backend.Info("Updating logging configuration - Level: %s, File: %t, Console: %t",
		config.Level, config.EnableFile, config.EnableConsole)

	if backend.GlobalConfigManager == nil {
		return backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}

	err := backend.GlobalConfigManager.UpdateLoggingConfig(config)
	if err != nil {
		backend.Error("Failed to update logging configuration: %v", err)
		return err
	}

	backend.Info("Logging configuration updated successfully")
	return nil
}

// SetLogLevel 设置日志级别
func (a *App) SetLogLevel(level string) error {
	backend.Info("Setting log level to: %s", level)

	if backend.GlobalConfigManager == nil {
		return backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}

	config := backend.GlobalConfigManager.GetConfig().Logging
	config.Level = level

	return backend.GlobalConfigManager.UpdateLoggingConfig(config)
}

// GetAvailableLogLevels 获取可用的日志级别
func (a *App) GetAvailableLogLevels() []string {
	return []string{"debug", "info", "warn", "error", "fatal"}
}

// SetMaxGeneralFileSize 设置最大一般文件大小（字节）
func (a *App) SetMaxGeneralFileSize(size int64) error {
	if backend.GlobalConfigManager == nil {
		return backend.NewConfigError("CONFIG_NOT_INITIALIZED", "配置管理器未初始化")
	}
	return backend.GlobalConfigManager.SetMaxGeneralFileSize(size)
}

// GetTuzhongImageBase64Async 异步获取图种文件预览（优化版本）
func (a *App) GetTuzhongImageBase64Async(imagePath string) {
	go func() {
		// 发送开始事件
		runtime.EventsEmit(a.ctx, "tuzhongPreviewStart", map[string]interface{}{
			"message": "开始生成图种预览...",
		})

		// 获取图种预览
		result, err := a.generator.GetTuzhongImageBase64(imagePath)

		if err != nil {
			runtime.EventsEmit(a.ctx, "tuzhongPreviewError", map[string]interface{}{
				"error": err.Error(),
			})
			return
		}

		// 发送完成事件
		runtime.EventsEmit(a.ctx, "tuzhongPreviewComplete", map[string]interface{}{
			"imageData": result,
			"message":   "图种预览生成完成",
		})
	}()
}

// 便捷设置方法 - 设置为无限制
func (a *App) SetUnlimitedImageSize() error {
	return a.SetMaxImageSize(0) // 0表示无限制
}

func (a *App) SetUnlimitedZipSize() error {
	return a.SetMaxZipSize(0) // 0表示无限制
}

func (a *App) SetUnlimitedGeneralFileSize() error {
	return a.SetMaxGeneralFileSize(0) // 0表示无限制
}

// 预设大小设置方法
func (a *App) SetImageSizeLimit1GB() error {
	return a.SetMaxImageSize(1024 * 1024 * 1024) // 1GB
}

func (a *App) SetImageSizeLimit2GB() error {
	return a.SetMaxImageSize(2 * 1024 * 1024 * 1024) // 2GB
}

func (a *App) SetImageSizeLimit5GB() error {
	return a.generator.GetConfigManager().SetMaxImageSize(5 * 1024 * 1024 * 1024) // 5GB
}

// AnalyzeTuzhongExtended 扩展的图种分析，支持多种数据格式和加密检测
func (a *App) AnalyzeTuzhongExtended(tuzhongPath string) (*backend.ExtendedTuzhongInfo, error) {
	return a.generator.AnalyzeTuzhongExtended(tuzhongPath)
}

// ExtractFromTuzhongWithPassword 支持密码的图种提取
func (a *App) ExtractFromTuzhongWithPassword(tuzhongPath, outputDir, password string) error {
	return a.generator.ExtractFromTuzhongWithPassword(tuzhongPath, outputDir, password)
}

// DetectDataFormat 检测隐藏数据的格式类型
func (a *App) DetectDataFormat(tuzhongPath string) (string, error) {
	// 分析图种基本信息
	info, err := a.generator.AnalyzeTuzhong(tuzhongPath)
	if err != nil {
		return "", err
	}

	if !info.IsValid {
		return "unknown", nil
	}

	// 提取隐藏数据
	hiddenData, err := a.generator.ExtractHiddenDataFromTuzhong(tuzhongPath, info.ImageSize)
	if err != nil {
		return "", err
	}

	// 创建格式检测管理器
	manager := backend.NewFormatDetectionManager(a.generator)
	formatInfo, _, err := manager.DetectFormat(hiddenData)
	if err != nil {
		return "unknown", nil
	}

	return formatInfo.Name, nil
}

// GetSupportedFormats 获取支持的数据格式列表
func (a *App) GetSupportedFormats() []map[string]interface{} {
	return []map[string]interface{}{
		{
			"name":        "ZIP",
			"description": "标准ZIP压缩格式",
			"encrypted":   false,
			"extensions":  []string{".zip"},
		},
		{
			"name":        "Encrypted ZIP",
			"description": "密码保护的ZIP文件",
			"encrypted":   true,
			"extensions":  []string{".zip"},
		},
		{
			"name":        "GZIP",
			"description": "GZIP压缩格式",
			"encrypted":   false,
			"extensions":  []string{".gz"},
		},
		{
			"name":        "RAW",
			"description": "原始文件格式",
			"encrypted":   false,
			"extensions":  []string{".*"},
		},
		{
			"name":        "Custom Encrypted",
			"description": "自定义加密格式",
			"encrypted":   true,
			"extensions":  []string{".enc"},
		},
	}
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
		DragAndDrop: &options.DragAndDrop{
			EnableFileDrop: true,
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
