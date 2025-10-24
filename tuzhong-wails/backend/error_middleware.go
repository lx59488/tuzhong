package backend

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ErrorMiddleware 错误处理中间件
type ErrorMiddleware struct {
	ctx     context.Context
	handler ErrorHandler
}

// NewErrorMiddleware 创建错误处理中间件
func NewErrorMiddleware(ctx context.Context) *ErrorMiddleware {
	return &ErrorMiddleware{
		ctx:     ctx,
		handler: &DefaultErrorHandler{},
	}
}

// SetHandler 设置错误处理器
func (m *ErrorMiddleware) SetHandler(handler ErrorHandler) {
	m.handler = handler
}

// HandleError 处理错误并发送到前端
func (m *ErrorMiddleware) HandleError(err error) *AppError {
	if err == nil {
		return nil
	}

	var appErr *AppError

	// 检查是否已经是AppError
	if ae, ok := err.(*AppError); ok {
		appErr = ae
	} else {
		// 包装为AppError
		appErr = WrapError(err, ErrCodeOperationFailed, "操作失败")
	}

	// 调用错误处理器
	if m.handler != nil {
		m.handler.HandleError(appErr)
	}

	// 发送错误事件到前端
	m.emitErrorToFrontend(appErr)

	return appErr
}

// emitErrorToFrontend 发送错误事件到前端
func (m *ErrorMiddleware) emitErrorToFrontend(err *AppError) {
	if m.ctx == nil {
		return
	}

	// 创建前端错误对象
	frontendError := map[string]interface{}{
		"code":      err.Code,
		"message":   err.Message,
		"type":      err.Type,
		"timestamp": err.Timestamp.Unix(),
	}

	// 只在开发模式下包含详细信息
	if isDevelopmentMode() && err.Details != "" {
		frontendError["details"] = err.Details
	}

	// 包含上下文信息（排除敏感信息）
	if err.Context != nil {
		safeContext := make(map[string]interface{})
		for k, v := range err.Context {
			// 过滤敏感信息
			if !isSensitiveKey(k) {
				safeContext[k] = v
			}
		}
		if len(safeContext) > 0 {
			frontendError["context"] = safeContext
		}
	}

	// 发送错误事件
	runtime.EventsEmit(m.ctx, "error", frontendError)
}

// isSensitiveKey 检查是否为敏感键名
func isSensitiveKey(key string) bool {
	sensitiveKeys := []string{"password", "token", "secret", "key", "auth"}
	for _, sensitive := range sensitiveKeys {
		if key == sensitive {
			return true
		}
	}
	return false
}

// WithErrorHandling 错误处理装饰器
func (m *ErrorMiddleware) WithErrorHandling(fn func() error) func() error {
	return func() error {
		defer func() {
			if r := recover(); r != nil {
				var err error
				switch v := r.(type) {
				case error:
					err = v
				case string:
					err = fmt.Errorf("%s", v)
				default:
					err = fmt.Errorf("panic: %v", v)
				}
				m.HandleError(err)
			}
		}()

		if err := fn(); err != nil {
			return m.HandleError(err)
		}

		return nil
	}
}

// ErrorLogger 错误日志记录器
type ErrorLogger struct {
	errors     []ErrorLogEntry
	maxEntries int
}

// ErrorLogEntry 错误日志条目
type ErrorLogEntry struct {
	Error     *AppError `json:"error"`
	Timestamp time.Time `json:"timestamp"`
	UserAgent string    `json:"userAgent,omitempty"`
	Context   string    `json:"context,omitempty"`
}

// NewErrorLogger 创建错误日志记录器
func NewErrorLogger(maxEntries int) *ErrorLogger {
	return &ErrorLogger{
		errors:     make([]ErrorLogEntry, 0, maxEntries),
		maxEntries: maxEntries,
	}
}

// LogError 记录错误
func (l *ErrorLogger) LogError(err *AppError, context string) {
	entry := ErrorLogEntry{
		Error:     err,
		Timestamp: time.Now(),
		Context:   context,
	}

	// 添加到日志列表
	l.errors = append(l.errors, entry)

	// 保持最大条目数限制
	if len(l.errors) > l.maxEntries {
		l.errors = l.errors[1:]
	}
}

// GetRecentErrors 获取最近的错误
func (l *ErrorLogger) GetRecentErrors(limit int) []ErrorLogEntry {
	if limit <= 0 || limit > len(l.errors) {
		limit = len(l.errors)
	}

	result := make([]ErrorLogEntry, limit)
	copy(result, l.errors[len(l.errors)-limit:])
	return result
}

// ClearErrors 清空错误日志
func (l *ErrorLogger) ClearErrors() {
	l.errors = l.errors[:0]
}

// ExportErrors 导出错误日志为JSON
func (l *ErrorLogger) ExportErrors() (string, error) {
	data, err := json.MarshalIndent(l.errors, "", "  ")
	if err != nil {
		return "", NewSystemError(ErrCodeOperationFailed, "导出错误日志失败", err)
	}
	return string(data), nil
}

// ErrorReporter 错误上报器
type ErrorReporter struct {
	endpoint string
	enabled  bool
}

// NewErrorReporter 创建错误上报器
func NewErrorReporter(endpoint string, enabled bool) *ErrorReporter {
	return &ErrorReporter{
		endpoint: endpoint,
		enabled:  enabled,
	}
}

// ReportError 上报错误（异步）
func (r *ErrorReporter) ReportError(err *AppError) {
	if !r.enabled || r.endpoint == "" {
		return
	}

	// 在实际项目中，这里会发送HTTP请求到错误收集服务
	// 为了演示，这里只是打印日志
	go func() {
		defer func() {
			if r := recover(); r != nil {
				// 上报错误时不应该产生新的panic
				fmt.Printf("Error reporting failed: %v\n", r)
			}
		}()

		// 模拟发送错误报告
		fmt.Printf("Reporting error to %s: %s\n", r.endpoint, err.ToJSON())
	}()
}

// ValidationHelper 验证助手
type ValidationHelper struct{}

// ValidateFilePath 验证文件路径
func (v *ValidationHelper) ValidateFilePath(filePath string) *AppError {
	if filePath == "" {
		return NewValidationError(ErrCodeInvalidInput, "文件路径不能为空")
	}

	// 检查路径安全性
	if containsUnsafePath(filePath) {
		return NewValidationError(ErrCodeInvalidPath, "文件路径包含不安全字符")
	}

	return nil
}

// ValidateFileSize 验证文件大小
func (v *ValidationHelper) ValidateFileSize(size, maxSize int64) *AppError {
	if size <= 0 {
		return NewValidationError(ErrCodeInvalidInput, "文件大小无效")
	}

	if size > maxSize {
		return NewFileTooLargeError("", size, maxSize)
	}

	return nil
}

// ValidateImageFormat 验证图像格式
func (v *ValidationHelper) ValidateImageFormat(format string) *AppError {
	supportedFormats := []string{"JPEG", "PNG", "GIF", "BMP", "WEBP"}

	for _, supported := range supportedFormats {
		if format == supported {
			return nil
		}
	}

	return NewInvalidFormatError(format, "JPEG, PNG, GIF, BMP, WEBP")
}

// containsUnsafePath 检查路径是否包含不安全字符
func containsUnsafePath(path string) bool {
	unsafePatterns := []string{"..", "//", "\\\\"}
	for _, pattern := range unsafePatterns {
		if contains(path, pattern) {
			return true
		}
	}
	return false
}

// contains 简单的字符串包含检查
func contains(s, substr string) bool {
	return len(s) >= len(substr) && s[:len(substr)] == substr ||
		len(s) > len(substr) && contains(s[1:], substr)
}

// 全局错误处理器实例
var (
	GlobalErrorMiddleware *ErrorMiddleware
	GlobalErrorLogger     *ErrorLogger
	GlobalErrorReporter   *ErrorReporter
	GlobalValidator       *ValidationHelper
)

// InitializeErrorHandling 初始化错误处理系统
func InitializeErrorHandling(ctx context.Context) {
	GlobalErrorMiddleware = NewErrorMiddleware(ctx)
	GlobalErrorLogger = NewErrorLogger(100)           // 保留最近100个错误
	GlobalErrorReporter = NewErrorReporter("", false) // 默认不启用上报
	GlobalValidator = &ValidationHelper{}
}
