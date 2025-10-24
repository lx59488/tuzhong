package backend

import (
	"fmt"
	"testing"
	"time"
)

// TestLoggerBasicFunctionality 测试日志基本功能
func TestLoggerBasicFunctionality(t *testing.T) {
	// 创建测试日志配置
	config := &LoggerConfig{
		Level:         LogLevelDebug,
		EnableColors:  false, // 测试时禁用颜色
		EnableFile:    false, // 测试时禁用文件输出
		EnableConsole: true,
		LogDir:        "",
		MaxFileSize:   0,
		MaxFiles:      0,
	}

	// 创建日志器
	logger, err := NewLogger(config)
	if err != nil {
		t.Fatalf("Failed to create logger: %v", err)
	}
	defer logger.Close()

	// 测试不同级别的日志
	logger.Debug("This is a debug message")
	logger.Info("This is an info message")
	logger.Warn("This is a warning message")
	logger.Error("This is an error message")

	// 测试格式化消息
	logger.Info("User %s performed action %s at %s", "testUser", "fileUpload", time.Now().Format(time.RFC3339))
}

// TestLoggerLevelFiltering 测试日志级别过滤
func TestLoggerLevelFiltering(t *testing.T) {
	config := &LoggerConfig{
		Level:         LogLevelWarn, // 只显示警告及以上级别
		EnableColors:  false,
		EnableFile:    false,
		EnableConsole: true,
		LogDir:        "",
		MaxFileSize:   0,
		MaxFiles:      0,
	}

	logger, err := NewLogger(config)
	if err != nil {
		t.Fatalf("Failed to create logger: %v", err)
	}
	defer logger.Close()

	fmt.Println("Testing log level filtering (should only see WARN, ERROR, FATAL):")
	logger.Debug("This debug message should NOT appear")
	logger.Info("This info message should NOT appear")
	logger.Warn("This warning message SHOULD appear")
	logger.Error("This error message SHOULD appear")
	logger.Fatal("This fatal message SHOULD appear")
}

// TestGlobalLogger 测试全局日志器
func TestGlobalLogger(t *testing.T) {
	fmt.Println("Testing global logger functions:")

	// 使用全局日志函数
	Info("Testing global Info function")
	Warn("Testing global Warn function")
	Error("Testing global Error function")

	// 测试日志级别设置
	SetLogLevel(LogLevelError)
	fmt.Println("Set log level to ERROR - the following should not appear:")
	Info("This info should not appear after setting level to ERROR")
	Warn("This warning should not appear after setting level to ERROR")
	Error("This error should appear")
}

// TestDemoLoggerUsage 演示日志系统在实际应用中的使用
func TestDemoLoggerUsage(t *testing.T) {
	fmt.Println("=== 图种生成器日志系统演示 ===")

	// 模拟应用启动
	Info("图种生成器应用启动中...")
	Info("初始化配置管理器...")
	Info("加载用户配置文件...")

	// 模拟文件操作
	imagePath := "/path/to/image.jpg"
	targetPath := "/path/to/target.zip"
	outputPath := "/path/to/output.jpg"

	Info("开始合并文件操作 - 图片: %s, 目标: %s, 输出: %s", imagePath, targetPath, outputPath)
	Debug("验证文件路径安全性...")
	Debug("检查文件大小限制...")

	// 模拟处理过程
	Info("开始读取图片文件...")
	Debug("使用 %d 字节的缓冲区进行文件读取", 1024*1024)
	Info("图片文件读取完成 - 大小: %d 字节", 2048576)

	Info("开始读取目标文件...")
	Debug("检测到ZIP文件，使用优化的ZIP处理流程")
	Info("目标文件读取完成 - 大小: %d 字节", 5242880)

	Info("开始合并文件...")
	Debug("分配工作线程...")
	Debug("进度: 25%% - 正在写入图片数据")
	Debug("进度: 75%% - 正在附加目标数据")
	Info("文件合并完成 - 输出文件: %s", outputPath)

	// 模拟错误情况
	Warn("检测到大文件操作，建议用户注意磁盘空间")

	// 模拟严重错误
	Error("模拟错误: 磁盘空间不足，无法完成操作")

	Info("应用操作完成")
}

// BenchmarkLogger 性能基准测试
func BenchmarkLogger(b *testing.B) {
	config := &LoggerConfig{
		Level:         LogLevelInfo,
		EnableColors:  false,
		EnableFile:    false,
		EnableConsole: false, // 禁用所有输出以测试纯性能
		LogDir:        "",
		MaxFileSize:   0,
		MaxFiles:      0,
	}

	logger, err := NewLogger(config)
	if err != nil {
		b.Fatalf("Failed to create logger: %v", err)
	}
	defer logger.Close()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		for pb.Next() {
			logger.Info("Benchmark test message with parameter: %d", 12345)
		}
	})
}
