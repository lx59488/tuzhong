package backend

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// AppConfig 应用配置
type AppConfig struct {
	// 文件大小限制配置
	FileSizeLimits FileSizeLimits `json:"fileSizeLimits"`

	// 性能配置
	Performance PerformanceConfig `json:"performance"`

	// 安全配置
	Security SecurityConfig `json:"security"`

	// 日志配置
	Logging LoggingConfig `json:"logging"`
}

// FileSizeLimits 文件大小限制配置
type FileSizeLimits struct {
	MaxImageSize    int64 `json:"maxImageSize"`    // 最大图片大小 (字节)
	MaxZipSize      int64 `json:"maxZipSize"`      // 最大ZIP文件大小 (字节)
	MaxGeneralFile  int64 `json:"maxGeneralFile"`  // 最大一般文件大小 (字节)
	EnableSizeCheck bool  `json:"enableSizeCheck"` // 是否启用大小检查
}

// PerformanceConfig 性能配置
type PerformanceConfig struct {
	ChunkSize        int `json:"chunkSize"`        // 文件块大小
	MaxWorkers       int `json:"maxWorkers"`       // 最大工作线程数
	BufferPoolSize   int `json:"bufferPoolSize"`   // 缓冲池大小
	ProgressInterval int `json:"progressInterval"` // 进度更新间隔(毫秒)
}

// SecurityConfig 安全配置
type SecurityConfig struct {
	ValidateFilePaths bool     `json:"validateFilePaths"` // 是否验证文件路径
	AllowedExtensions []string `json:"allowedExtensions"` // 允许的文件扩展名
	BlockUnsafePaths  bool     `json:"blockUnsafePaths"`  // 是否阻止不安全路径
}

// LoggingConfig 日志配置
type LoggingConfig struct {
	Level         string `json:"level"`         // 日志级别: "debug", "info", "warn", "error", "fatal"
	EnableColors  bool   `json:"enableColors"`  // 启用颜色输出
	EnableFile    bool   `json:"enableFile"`    // 启用文件日志
	EnableConsole bool   `json:"enableConsole"` // 启用控制台日志
	LogDir        string `json:"logDir"`        // 日志目录
	MaxFileSize   int64  `json:"maxFileSize"`   // 最大日志文件大小(MB)
	MaxFiles      int    `json:"maxFiles"`      // 最大保留文件数
}

// DefaultConfig 返回默认配置
func DefaultConfig() *AppConfig {
	return &AppConfig{
		FileSizeLimits: FileSizeLimits{
			MaxImageSize:    500 * 1024 * 1024,       // 500MB - 增加限制
			MaxZipSize:      5 * 1024 * 1024 * 1024,  // 5GB - 增加限制
			MaxGeneralFile:  20 * 1024 * 1024 * 1024, // 20GB - 增加限制
			EnableSizeCheck: true,
		},
		Performance: PerformanceConfig{
			ChunkSize:        1024 * 1024, // 1MB
			MaxWorkers:       4,
			BufferPoolSize:   10,
			ProgressInterval: 100, // 100ms
		},
		Security: SecurityConfig{
			ValidateFilePaths: true,
			AllowedExtensions: []string{".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".zip", ".rar", ".7z"},
			BlockUnsafePaths:  true,
		},
		Logging: LoggingConfig{
			Level:         "info",
			EnableColors:  true,
			EnableFile:    true,
			EnableConsole: true,
			LogDir:        "logs",
			MaxFileSize:   10, // 10MB
			MaxFiles:      5,
		},
	}
}

// ConfigManager 配置管理器
type ConfigManager struct {
	config     *AppConfig
	configPath string
}

// NewConfigManager 创建配置管理器
func NewConfigManager(configPath string) *ConfigManager {
	return &ConfigManager{
		config:     DefaultConfig(),
		configPath: configPath,
	}
}

// LoadConfig 加载配置
func (cm *ConfigManager) LoadConfig() error {
	if _, err := os.Stat(cm.configPath); os.IsNotExist(err) {
		// 配置文件不存在，使用默认配置并保存
		Info("Configuration file not found, creating default config: %s", cm.configPath)
		return cm.SaveConfig()
	}

	Debug("Loading configuration from: %s", cm.configPath)
	data, err := os.ReadFile(cm.configPath)
	if err != nil {
		Error("Failed to read configuration file: %v", err)
		return err
	}

	err = json.Unmarshal(data, cm.config)
	if err != nil {
		// 如果配置文件损坏，使用默认配置
		Warn("Configuration file corrupted, using default config: %v", err)
		cm.config = DefaultConfig()
		return cm.SaveConfig()
	}

	Info("Configuration loaded successfully from: %s", cm.configPath)
	return nil
}

// SaveConfig 保存配置
func (cm *ConfigManager) SaveConfig() error {
	// 确保配置目录存在
	configDir := filepath.Dir(cm.configPath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		Error("Failed to create config directory %s: %v", configDir, err)
		return err
	}

	Debug("Saving configuration to: %s", cm.configPath)
	data, err := json.MarshalIndent(cm.config, "", "  ")
	if err != nil {
		Error("Failed to marshal configuration: %v", err)
		return err
	}

	err = os.WriteFile(cm.configPath, data, 0644)
	if err != nil {
		Error("Failed to write configuration file: %v", err)
		return err
	}

	Info("Configuration saved successfully to: %s", cm.configPath)
	return nil
}

// GetConfig 获取配置
func (cm *ConfigManager) GetConfig() *AppConfig {
	return cm.config
}

// UpdateConfig 更新配置
func (cm *ConfigManager) UpdateConfig(newConfig *AppConfig) error {
	cm.config = newConfig
	return cm.SaveConfig()
}

// UpdateFileSizeLimits 更新文件大小限制
func (cm *ConfigManager) UpdateFileSizeLimits(limits FileSizeLimits) error {
	cm.config.FileSizeLimits = limits
	return cm.SaveConfig()
}

// DisableFileSizeCheck 禁用文件大小检查
func (cm *ConfigManager) DisableFileSizeCheck() error {
	cm.config.FileSizeLimits.EnableSizeCheck = false
	return cm.SaveConfig()
}

// EnableFileSizeCheck 启用文件大小检查
func (cm *ConfigManager) EnableFileSizeCheck() error {
	cm.config.FileSizeLimits.EnableSizeCheck = true
	return cm.SaveConfig()
}

// SetMaxImageSize 设置最大图片大小
func (cm *ConfigManager) SetMaxImageSize(size int64) error {
	cm.config.FileSizeLimits.MaxImageSize = size
	return cm.SaveConfig()
}

// SetMaxZipSize 设置最大ZIP文件大小
func (cm *ConfigManager) SetMaxZipSize(size int64) error {
	cm.config.FileSizeLimits.MaxZipSize = size
	return cm.SaveConfig()
}

// SetMaxGeneralFileSize 设置最大一般文件大小
func (cm *ConfigManager) SetMaxGeneralFileSize(size int64) error {
	cm.config.FileSizeLimits.MaxGeneralFile = size
	return cm.SaveConfig()
}

// RemoveAllSizeLimits 移除所有文件大小限制
func (cm *ConfigManager) RemoveAllSizeLimits() error {
	cm.config.FileSizeLimits = FileSizeLimits{
		MaxImageSize:    0, // 0表示无限制
		MaxZipSize:      0,
		MaxGeneralFile:  0,
		EnableSizeCheck: false,
	}
	return cm.SaveConfig()
}

// ApplyLoggingConfig 应用日志配置
func (cm *ConfigManager) ApplyLoggingConfig() error {
	logConfig := cm.config.Logging

	// 将字符串级别转换为LogLevel
	var level LogLevel
	switch logConfig.Level {
	case "debug":
		level = LogLevelDebug
	case "info":
		level = LogLevelInfo
	case "warn":
		level = LogLevelWarn
	case "error":
		level = LogLevelError
	case "fatal":
		level = LogLevelFatal
	default:
		level = LogLevelInfo // 默认级别
	}

	// 创建日志配置
	loggerConfig := &LoggerConfig{
		Level:         level,
		EnableColors:  logConfig.EnableColors,
		EnableFile:    logConfig.EnableFile,
		EnableConsole: logConfig.EnableConsole,
		LogDir:        logConfig.LogDir,
		MaxFileSize:   logConfig.MaxFileSize,
		MaxFiles:      logConfig.MaxFiles,
	}

	// 重新初始化全局日志器
	newLogger, err := NewLogger(loggerConfig)
	if err != nil {
		return err
	}

	// 关闭旧的日志器
	if globalLogger != nil {
		globalLogger.Close()
	}

	// 替换全局日志器
	globalLogger = newLogger

	Info("Logging configuration applied successfully - Level: %s, File: %t, Console: %t",
		logConfig.Level, logConfig.EnableFile, logConfig.EnableConsole)

	return nil
}

// UpdateLoggingConfig 更新日志配置
func (cm *ConfigManager) UpdateLoggingConfig(config LoggingConfig) error {
	cm.config.Logging = config

	// 应用新的日志配置
	if err := cm.ApplyLoggingConfig(); err != nil {
		return err
	}

	return cm.SaveConfig()
}

// 全局配置管理器实例
var GlobalConfigManager *ConfigManager

// InitConfig 初始化配置系统
func InitConfig(configPath string) error {
	GlobalConfigManager = NewConfigManager(configPath)

	// 加载配置
	if err := GlobalConfigManager.LoadConfig(); err != nil {
		return err
	}

	// 应用日志配置
	return GlobalConfigManager.ApplyLoggingConfig()
}

// GetGlobalConfig 获取全局配置
func GetGlobalConfig() *AppConfig {
	if GlobalConfigManager == nil {
		return DefaultConfig()
	}
	return GlobalConfigManager.GetConfig()
}
