# 图种生成器日志系统文档

## 🎉 完成状态

✅ **日志系统完善 - 已完成**

本次更新为图种生成器添加了完整的日志系统，显著提升了应用的可维护性和问题排查能力。

## 🚀 主要特性

### 1. 核心日志系统
- **多级别日志支持**
  - **DEBUG**: 详细的调试信息
  - **INFO**: 一般信息记录
  - **WARN**: 警告信息
  - **ERROR**: 错误信息
  - **FATAL**: 致命错误

### 2. 灵活的输出方式
- **控制台输出**: 彩色格式化的实时日志
- **文件输出**: 持久化日志存储
- **双重输出**: 同时输出到控制台和文件

### 3. 智能文件管理
- **自动轮转**: 文件大小超限时自动创建新文件
- **历史管理**: 自动清理旧日志文件
- **目录管理**: 自动创建日志目录

### 4. 性能优化
- **并发安全**: 多线程环境下的安全日志记录
- **内存优化**: 高效的缓冲区管理
- **调用栈跟踪**: 自动记录调用位置

## 🎯 新增功能

### 1. 核心日志系统
- **多级别日志**: DEBUG, INFO, WARN, ERROR, FATAL
- **灵活输出**: 控制台 + 文件双重输出
- **智能管理**: 自动文件轮转和历史清理
- **性能优化**: 并发安全 + 调用栈跟踪

### 2. 配置管理集成
- **配置文件支持**: JSON格式的日志配置
- **动态更新**: 运行时调整日志设置
- **默认配置**: 开箱即用的合理默认值

### 3. 错误处理集成
- **自动记录**: 所有错误自动记录到日志
- **上下文信息**: 错误包含详细的上下文数据
- **级别分类**: 根据错误类型自动选择日志级别

### 4. 前端API接口
- **日志配置管理**: 获取和更新日志配置
- **级别控制**: 动态调整日志级别
- **配置查询**: 获取可用的日志级别列表

## 📋 技术实现

### 核心文件结构
```
backend/
├── logger.go           # 核心日志系统
├── logger_test.go      # 测试和演示
├── config.go          # 配置管理(含日志配置)
├── error_middleware.go # 错误处理集成
└── errors.go          # 错误类型定义
```

### 主要特性
- **并发安全**: 使用 `sync.RWMutex` 保护并发访问
- **内存优化**: 高效的日志格式化和缓冲管理
- **文件管理**: 自动创建目录、轮转文件、清理历史
- **错误处理**: 优雅处理日志系统自身的错误

## 📋 配置说明

### 配置文件结构
```json
{
  "logging": {
    "level": "info",          // 日志级别
    "enableColors": true,     // 启用彩色输出
    "enableFile": true,       // 启用文件日志
    "enableConsole": true,    // 启用控制台日志
    "logDir": "logs",         // 日志目录
    "maxFileSize": 10,        // 最大文件大小(MB)
    "maxFiles": 5             // 最大保留文件数
  }
}
```

### 默认配置
- **日志级别**: INFO
- **彩色输出**: 启用
- **文件日志**: 启用
- **控制台日志**: 启用
- **日志目录**: `logs/`
- **最大文件大小**: 10MB
- **最大文件数**: 5个

## 💻 使用示例

### 基本使用
```go
// 使用全局日志函数
backend.Info("应用启动成功")
backend.Debug("调试信息: 用户ID = %d", userID)
backend.Warn("警告: 文件大小超过建议值")
backend.Error("错误: 文件读取失败 - %v", err)
```

### 创建自定义日志器
```go
// 创建配置
config := &backend.LoggerConfig{
    Level:         backend.LogLevelDebug,
    EnableColors:  true,
    EnableFile:    true,
    EnableConsole: true,
    LogDir:        "custom_logs",
    MaxFileSize:   20, // 20MB
    MaxFiles:      10,
}

// 创建日志器
logger, err := backend.NewLogger(config)
if err != nil {
    panic(err)
}
defer logger.Close()

// 使用自定义日志器
logger.Info("这是自定义日志器的消息")
```

### 动态配置更新
```go
// 通过前端API更新日志配置
app.SetLogLevel("debug")
app.UpdateLoggingConfig(backend.LoggingConfig{
    Level:         "debug",
    EnableColors:  true,
    EnableFile:    true,
    EnableConsole: false,
    LogDir:        "logs",
    MaxFileSize:   50,
    MaxFiles:      3,
})
```

## 🎯 集成的功能模块

### 1. 错误处理集成
错误处理中间件自动记录所有错误信息：
```go
// 错误会自动记录到日志
err := generator.ExtractFromTuzhong(path, output)
if err != nil {
    // 错误已自动记录，包含上下文信息
    return err
}
```

### 2. 配置管理集成
配置系统的所有操作都会记录：
```go
// 配置加载成功/失败都会记录
err := backend.InitConfig(configPath)
// 日志输出: "Configuration loaded successfully from: /path/to/config"
```

### 3. 文件操作跟踪
主要文件操作都有详细的日志记录：
```go
// 文件合并操作
backend.Info("Starting file merge: %s + %s -> %s", img, target, output)
// 文件读取进度
backend.Debug("File read progress: %d%% (%d bytes)", percent, bytes)
// 操作完成
backend.Info("File merge completed successfully")
```

## 🔧 API 接口

### 前端可用的日志管理API

#### 获取日志配置
```javascript
const config = await window.go.main.App.GetLoggingConfig();
console.log('当前日志级别:', config.level);
```

#### 更新日志配置
```javascript
await window.go.main.App.UpdateLoggingConfig({
    level: "debug",
    enableColors: true,
    enableFile: true,
    enableConsole: true,
    logDir: "logs",
    maxFileSize: 20,
    maxFiles: 8
});
```

#### 设置日志级别
```javascript
await window.go.main.App.SetLogLevel("debug");
```

#### 获取可用级别
```javascript
const levels = await window.go.main.App.GetAvailableLogLevels();
// 返回: ["debug", "info", "warn", "error", "fatal"]
```

## 📁 日志文件

### 文件命名规则
```
logs/
├── tuzhong_2024-10-24_14-30-15.log  (当前日志)
├── tuzhong_2024-10-24_09-15-22.log  (历史日志)
└── tuzhong_2024-10-23_16-45-33.log  (历史日志)
```

### 日志格式
```
[INFO] 2024-10-24 14:30:15.123 [app.go:95] Application startup completed
[DEBUG] 2024-10-24 14:30:16.456 [logic.go:127] Worker slot acquired successfully
[ERROR] 2024-10-24 14:30:17.789 [error_middleware.go:45] File read failed: permission denied
```

## 🎯 最佳实践

### 1. 日志级别选择
- **生产环境**: 使用 `INFO` 或 `WARN` 级别
- **开发环境**: 使用 `DEBUG` 级别
- **故障排查**: 临时调整到 `DEBUG` 级别

### 2. 消息格式
```go
// ✅ 好的做法
backend.Info("User %s started operation %s with file %s", user, operation, file)
backend.Error("Failed to process file %s: %v", filename, err)

// ❌ 避免的做法
backend.Info("Something happened")
backend.Error("Error occurred")
```

### 3. 性能考虑
```go
// ✅ 对于可能昂贵的操作，先检查级别
if backend.GetGlobalLogger().GetLevel() <= backend.LogLevelDebug {
    expensiveDebugInfo := computeExpensiveInfo()
    backend.Debug("Expensive debug info: %s", expensiveDebugInfo)
}
```

### 4. 错误记录
```go
// ✅ 包含足够的上下文信息
backend.Error("Failed to merge files - Image: %s, Target: %s, Error: %v", 
    imagePath, targetPath, err)

// ❌ 信息不足
backend.Error("Merge failed: %v", err)
```

## 🛠️ 故障排查

### 常见问题

#### 1. 日志文件未创建
- 检查日志目录权限
- 检查磁盘空间
- 确认 `enableFile` 配置为 `true`

#### 2. 日志级别不生效
- 确认配置文件格式正确
- 重启应用以应用新配置
- 检查是否有配置缓存

#### 3. 性能问题
- 调整日志级别到更高级别
- 减少 `maxFiles` 数量
- 增大 `maxFileSize` 以减少轮转频率

## 📈 监控和维护

### 日志监控
- 定期检查错误日志数量
- 监控日志文件大小增长
- 关注磁盘空间使用

### 维护建议
- 定期备份重要日志文件
- 根据需要调整保留策略
- 监控应用性能影响

---

通过这个完整的日志系统，您可以更好地监控应用运行状态、快速定位问题并提升用户体验。