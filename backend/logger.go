package backend

import (
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"sync"
	"time"
)

// 日志级别
type LogLevel int

const (
	LogLevelDebug LogLevel = iota
	LogLevelInfo
	LogLevelWarn
	LogLevelError
	LogLevelFatal
)

// 日志级别字符串映射
var logLevelStrings = map[LogLevel]string{
	LogLevelDebug: "DEBUG",
	LogLevelInfo:  "INFO",
	LogLevelWarn:  "WARN",
	LogLevelError: "ERROR",
	LogLevelFatal: "FATAL",
}

// 日志级别颜色映射（用于控制台输出）
var logLevelColors = map[LogLevel]string{
	LogLevelDebug: "\033[36m", // 青色
	LogLevelInfo:  "\033[32m", // 绿色
	LogLevelWarn:  "\033[33m", // 黄色
	LogLevelError: "\033[31m", // 红色
	LogLevelFatal: "\033[35m", // 紫色
}

const colorReset = "\033[0m"

// Logger 结构体
type Logger struct {
	mu            sync.RWMutex
	level         LogLevel
	loggers       map[LogLevel]*log.Logger
	logFile       *os.File
	enableColors  bool
	enableFile    bool
	enableConsole bool
	maxFileSize   int64 // 最大日志文件大小（字节）
	maxFiles      int   // 最大保留文件数
	logDir        string
}

// LoggerConfig 日志配置
type LoggerConfig struct {
	Level         LogLevel `json:"level"`
	EnableColors  bool     `json:"enableColors"`
	EnableFile    bool     `json:"enableFile"`
	EnableConsole bool     `json:"enableConsole"`
	LogDir        string   `json:"logDir"`
	MaxFileSize   int64    `json:"maxFileSize"` // MB
	MaxFiles      int      `json:"maxFiles"`
}

// 默认配置
func DefaultLoggerConfig() *LoggerConfig {
	return &LoggerConfig{
		Level:         LogLevelInfo,
		EnableColors:  true,
		EnableFile:    true,
		EnableConsole: true,
		LogDir:        "logs",
		MaxFileSize:   10, // 10MB
		MaxFiles:      5,
	}
}

// 全局日志实例
var (
	globalLogger *Logger
	loggerOnce   sync.Once
)

// GetGlobalLogger 获取全局日志实例
func GetGlobalLogger() *Logger {
	loggerOnce.Do(func() {
		config := DefaultLoggerConfig()
		var err error
		globalLogger, err = NewLogger(config)
		if err != nil {
			// 如果创建失败，使用基础配置
			fallbackConfig := &LoggerConfig{
				Level:         LogLevelInfo,
				EnableColors:  false,
				EnableFile:    false,
				EnableConsole: true,
				LogDir:        "",
				MaxFileSize:   0,
				MaxFiles:      0,
			}
			globalLogger, _ = NewLogger(fallbackConfig)
		}
	})
	return globalLogger
}

// NewLogger 创建新的日志实例
func NewLogger(config *LoggerConfig) (*Logger, error) {
	logger := &Logger{
		level:         config.Level,
		enableColors:  config.EnableColors,
		enableFile:    config.EnableFile,
		enableConsole: config.EnableConsole,
		maxFileSize:   config.MaxFileSize * 1024 * 1024, // 转换为字节
		maxFiles:      config.MaxFiles,
		logDir:        config.LogDir,
		loggers:       make(map[LogLevel]*log.Logger),
	}

	// 如果启用文件日志，创建日志目录和文件
	if config.EnableFile && config.LogDir != "" {
		if err := logger.setupFileLogging(); err != nil {
			return nil, fmt.Errorf("设置文件日志失败: %v", err)
		}
	}

	// 初始化所有级别的日志器
	logger.initLoggers()

	return logger, nil
}

// setupFileLogging 设置文件日志
func (l *Logger) setupFileLogging() error {
	// 创建日志目录
	if err := os.MkdirAll(l.logDir, 0755); err != nil {
		return fmt.Errorf("创建日志目录失败: %v", err)
	}

	// 清理旧的日志文件
	if err := l.cleanupOldLogs(); err != nil {
		// 清理失败不应该阻止日志系统启动，只记录警告
		fmt.Printf("清理旧日志文件失败: %v\n", err)
	}

	// 创建新的日志文件
	logFileName := fmt.Sprintf("tuzhong_%s.log", time.Now().Format("2006-01-02_15-04-05"))
	logFilePath := filepath.Join(l.logDir, logFileName)

	var err error
	l.logFile, err = os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return fmt.Errorf("创建日志文件失败: %v", err)
	}

	return nil
}

// cleanupOldLogs 清理旧的日志文件
func (l *Logger) cleanupOldLogs() error {
	if l.maxFiles <= 0 {
		return nil
	}

	entries, err := os.ReadDir(l.logDir)
	if err != nil {
		return err
	}

	// 过滤出日志文件并按修改时间排序
	var logFiles []os.FileInfo
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if filepath.Ext(entry.Name()) == ".log" {
			info, err := entry.Info()
			if err == nil {
				logFiles = append(logFiles, info)
			}
		}
	}

	// 如果日志文件数量超过限制，删除最旧的文件
	if len(logFiles) >= l.maxFiles {
		// 按修改时间排序（最新的在前）
		for i := 0; i < len(logFiles)-1; i++ {
			for j := i + 1; j < len(logFiles); j++ {
				if logFiles[i].ModTime().Before(logFiles[j].ModTime()) {
					logFiles[i], logFiles[j] = logFiles[j], logFiles[i]
				}
			}
		}

		// 删除多余的文件
		for i := l.maxFiles - 1; i < len(logFiles); i++ {
			oldFilePath := filepath.Join(l.logDir, logFiles[i].Name())
			if err := os.Remove(oldFilePath); err != nil {
				fmt.Printf("删除旧日志文件失败 %s: %v\n", oldFilePath, err)
			}
		}
	}

	return nil
}

// initLoggers 初始化所有级别的日志器
func (l *Logger) initLoggers() {
	for level := LogLevelDebug; level <= LogLevelFatal; level++ {
		var writers []io.Writer

		// 添加控制台输出
		if l.enableConsole {
			writers = append(writers, os.Stdout)
		}

		// 添加文件输出
		if l.enableFile && l.logFile != nil {
			writers = append(writers, l.logFile)
		}

		// 如果没有任何输出，使用标准输出
		if len(writers) == 0 {
			writers = append(writers, os.Stdout)
		}

		multiWriter := io.MultiWriter(writers...)
		l.loggers[level] = log.New(multiWriter, "", 0) // 不使用默认前缀，我们自己格式化
	}
}

// formatMessage 格式化日志消息
func (l *Logger) formatMessage(level LogLevel, msg string) string {
	now := time.Now().Format("2006-01-02 15:04:05.000")
	levelStr := logLevelStrings[level]

	// 获取调用者信息
	_, file, line, ok := runtime.Caller(3) // 3层调用栈：formatMessage -> log方法 -> 实际调用者
	caller := "unknown"
	if ok {
		caller = fmt.Sprintf("%s:%d", filepath.Base(file), line)
	}

	// 根据输出目标决定是否使用颜色
	if l.enableColors && l.enableConsole {
		color := logLevelColors[level]
		return fmt.Sprintf("%s[%s]%s %s [%s] %s",
			color, levelStr, colorReset, now, caller, msg)
	}

	return fmt.Sprintf("[%s] %s [%s] %s", levelStr, now, caller, msg)
}

// shouldLog 检查是否应该记录指定级别的日志
func (l *Logger) shouldLog(level LogLevel) bool {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return level >= l.level
}

// log 记录日志的核心方法
func (l *Logger) log(level LogLevel, format string, args ...interface{}) {
	if !l.shouldLog(level) {
		return
	}

	var msg string
	if len(args) > 0 {
		msg = fmt.Sprintf(format, args...)
	} else {
		msg = format
	}

	formattedMsg := l.formatMessage(level, msg)

	l.mu.Lock()
	defer l.mu.Unlock()

	if logger, exists := l.loggers[level]; exists {
		logger.Println(formattedMsg)
	}

	// 检查文件大小并轮转
	if l.enableFile && l.logFile != nil {
		l.checkAndRotateLog()
	}
}

// checkAndRotateLog 检查并轮转日志文件
func (l *Logger) checkAndRotateLog() {
	if l.maxFileSize <= 0 {
		return
	}

	stat, err := l.logFile.Stat()
	if err != nil {
		return
	}

	if stat.Size() >= l.maxFileSize {
		// 关闭当前文件
		l.logFile.Close()

		// 重新设置文件日志
		if err := l.setupFileLogging(); err != nil {
			fmt.Printf("日志文件轮转失败: %v\n", err)
			return
		}

		// 重新初始化日志器
		l.initLoggers()
	}
}

// Debug 记录调试级别日志
func (l *Logger) Debug(format string, args ...interface{}) {
	l.log(LogLevelDebug, format, args...)
}

// Info 记录信息级别日志
func (l *Logger) Info(format string, args ...interface{}) {
	l.log(LogLevelInfo, format, args...)
}

// Warn 记录警告级别日志
func (l *Logger) Warn(format string, args ...interface{}) {
	l.log(LogLevelWarn, format, args...)
}

// Error 记录错误级别日志
func (l *Logger) Error(format string, args ...interface{}) {
	l.log(LogLevelError, format, args...)
}

// Fatal 记录致命错误级别日志
func (l *Logger) Fatal(format string, args ...interface{}) {
	l.log(LogLevelFatal, format, args...)
}

// SetLevel 设置日志级别
func (l *Logger) SetLevel(level LogLevel) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.level = level
}

// GetLevel 获取当前日志级别
func (l *Logger) GetLevel() LogLevel {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return l.level
}

// Close 关闭日志器
func (l *Logger) Close() error {
	l.mu.Lock()
	defer l.mu.Unlock()

	if l.logFile != nil {
		return l.logFile.Close()
	}
	return nil
}

// 全局日志函数
func Debug(format string, args ...interface{}) {
	GetGlobalLogger().Debug(format, args...)
}

func Info(format string, args ...interface{}) {
	GetGlobalLogger().Info(format, args...)
}

func Warn(format string, args ...interface{}) {
	GetGlobalLogger().Warn(format, args...)
}

func Error(format string, args ...interface{}) {
	GetGlobalLogger().Error(format, args...)
}

func Fatal(format string, args ...interface{}) {
	GetGlobalLogger().Fatal(format, args...)
}

func SetLogLevel(level LogLevel) {
	GetGlobalLogger().SetLevel(level)
}

func CloseLogger() error {
	return GetGlobalLogger().Close()
}
