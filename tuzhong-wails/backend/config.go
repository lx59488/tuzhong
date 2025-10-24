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
		return cm.SaveConfig()
	}

	data, err := os.ReadFile(cm.configPath)
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, cm.config)
	if err != nil {
		// 如果配置文件损坏，使用默认配置
		cm.config = DefaultConfig()
		return cm.SaveConfig()
	}

	return nil
}

// SaveConfig 保存配置
func (cm *ConfigManager) SaveConfig() error {
	// 确保配置目录存在
	configDir := filepath.Dir(cm.configPath)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	data, err := json.MarshalIndent(cm.config, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(cm.configPath, data, 0644)
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

// 全局配置管理器实例
var GlobalConfigManager *ConfigManager

// InitConfig 初始化配置系统
func InitConfig(configPath string) error {
	GlobalConfigManager = NewConfigManager(configPath)
	return GlobalConfigManager.LoadConfig()
}

// GetGlobalConfig 获取全局配置
func GetGlobalConfig() *AppConfig {
	if GlobalConfigManager == nil {
		return DefaultConfig()
	}
	return GlobalConfigManager.GetConfig()
}
