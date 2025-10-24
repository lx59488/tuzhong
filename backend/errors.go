package backend

import (
	"encoding/json"
	"fmt"
	"runtime"
	"time"
)

// 错误类型常量
const (
	// 用户错误类型
	ErrorTypeUser       = "user"       // 用户操作错误
	ErrorTypeValidation = "validation" // 输入验证错误
	ErrorTypeSystem     = "system"     // 系统错误
	ErrorTypeIO         = "io"         // 文件I/O错误
	ErrorTypeNetwork    = "network"    // 网络错误
)

// 错误代码常量
const (
	// 文件相关错误
	ErrCodeFileNotFound   = "FILE_NOT_FOUND"
	ErrCodeFilePermission = "FILE_PERMISSION"
	ErrCodeFileCorrupted  = "FILE_CORRUPTED"
	ErrCodeFileTooLarge   = "FILE_TOO_LARGE"
	ErrCodeInvalidFormat  = "INVALID_FORMAT"
	ErrCodeInvalidPath    = "INVALID_PATH"

	// 图像处理错误
	ErrCodeImageInvalid     = "IMAGE_INVALID"
	ErrCodeImageUnsupported = "IMAGE_UNSUPPORTED"
	ErrCodeImageCorrupted   = "IMAGE_CORRUPTED"

	// ZIP处理错误
	ErrCodeZipInvalid       = "ZIP_INVALID"
	ErrCodeZipCorrupted     = "ZIP_CORRUPTED"
	ErrCodeZipTooLarge      = "ZIP_TOO_LARGE"
	ErrCodeZipExtractFailed = "ZIP_EXTRACT_FAILED"

	// 系统错误
	ErrCodeMemoryExhausted = "MEMORY_EXHAUSTED"
	ErrCodeDiskFull        = "DISK_FULL"
	ErrCodeTimeout         = "TIMEOUT"
	ErrCodeCancelled       = "CANCELLED"

	// 用户操作错误
	ErrCodeInvalidInput    = "INVALID_INPUT"
	ErrCodeOperationFailed = "OPERATION_FAILED"
	ErrCodeUnsupportedOp   = "UNSUPPORTED_OPERATION"
)

// AppError 统一错误结构
type AppError struct {
	Code      string                 `json:"code"`              // 错误代码
	Message   string                 `json:"message"`           // 用户友好的错误消息
	Details   string                 `json:"details,omitempty"` // 详细错误信息
	Type      string                 `json:"type"`              // 错误类型
	Timestamp time.Time              `json:"timestamp"`         // 错误发生时间
	Context   map[string]interface{} `json:"context,omitempty"` // 错误上下文
	Stack     string                 `json:"stack,omitempty"`   // 调用栈（仅开发模式）
	Inner     error                  `json:"-"`                 // 内部错误（不序列化）
}

// Error 实现error接口
func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s: %s", e.Code, e.Type, e.Message)
}

// ToJSON 转换为JSON格式
func (e *AppError) ToJSON() string {
	data, _ := json.Marshal(e)
	return string(data)
}

// WithContext 添加上下文信息
func (e *AppError) WithContext(key string, value interface{}) *AppError {
	if e.Context == nil {
		e.Context = make(map[string]interface{})
	}
	e.Context[key] = value
	return e
}

// WithDetails 添加详细信息
func (e *AppError) WithDetails(details string) *AppError {
	e.Details = details
	return e
}

// 错误构造函数

// NewUserError 创建用户错误
func NewUserError(code, message string) *AppError {
	return &AppError{
		Code:      code,
		Message:   message,
		Type:      ErrorTypeUser,
		Timestamp: time.Now(),
	}
}

// NewValidationError 创建验证错误
func NewValidationError(code, message string) *AppError {
	return &AppError{
		Code:      code,
		Message:   message,
		Type:      ErrorTypeValidation,
		Timestamp: time.Now(),
	}
}

// NewSystemError 创建系统错误
func NewSystemError(code, message string, inner error) *AppError {
	err := &AppError{
		Code:      code,
		Message:   message,
		Type:      ErrorTypeSystem,
		Timestamp: time.Now(),
		Inner:     inner,
	}

	if inner != nil {
		err.Details = inner.Error()
	}

	// 在开发模式下添加调用栈
	if isDevelopmentMode() {
		err.Stack = getStackTrace()
	}

	return err
}

// NewIOError 创建IO错误
func NewIOError(code, message string, inner error) *AppError {
	err := &AppError{
		Code:      code,
		Message:   message,
		Type:      ErrorTypeIO,
		Timestamp: time.Now(),
		Inner:     inner,
	}

	if inner != nil {
		err.Details = inner.Error()
	}

	return err
}

// WrapError 包装现有错误
func WrapError(err error, code, message string) *AppError {
	if err == nil {
		return nil
	}

	// 如果已经是AppError，直接返回
	if appErr, ok := err.(*AppError); ok {
		return appErr
	}

	return &AppError{
		Code:      code,
		Message:   message,
		Type:      ErrorTypeSystem,
		Details:   err.Error(),
		Timestamp: time.Now(),
		Inner:     err,
	}
}

// 特定错误构造函数

// NewFileNotFoundError 文件未找到错误
func NewFileNotFoundError(filePath string) *AppError {
	return NewIOError(ErrCodeFileNotFound, "文件不存在", nil).
		WithContext("filePath", filePath)
}

// NewFilePermissionError 文件权限错误
func NewFilePermissionError(filePath string) *AppError {
	return NewIOError(ErrCodeFilePermission, "文件权限不足", nil).
		WithContext("filePath", filePath)
}

// NewFileTooLargeError 文件过大错误
func NewFileTooLargeError(filePath string, size, maxSize int64) *AppError {
	return NewValidationError(ErrCodeFileTooLarge,
		fmt.Sprintf("文件太大 (%.2f MB)，最大允许 %.2f MB",
			float64(size)/(1024*1024),
			float64(maxSize)/(1024*1024))).
		WithContext("filePath", filePath).
		WithContext("fileSize", size).
		WithContext("maxSize", maxSize)
}

// NewInvalidFormatError 格式无效错误
func NewInvalidFormatError(format, expectedFormat string) *AppError {
	return NewValidationError(ErrCodeInvalidFormat,
		fmt.Sprintf("不支持的文件格式 %s，期望格式：%s", format, expectedFormat)).
		WithContext("actualFormat", format).
		WithContext("expectedFormat", expectedFormat)
}

// NewImageError 图像处理错误
func NewImageError(code, message string) *AppError {
	return NewUserError(code, message)
}

// NewZipError ZIP处理错误
func NewZipError(code, message string, inner error) *AppError {
	return NewIOError(code, message, inner)
}

// 工具函数

// isDevelopmentMode 检查是否为开发模式
func isDevelopmentMode() bool {
	// 可以通过环境变量或编译标签控制
	// 这里简单返回false，生产环境不显示调用栈
	return false
}

// getStackTrace 获取调用栈
func getStackTrace() string {
	buf := make([]byte, 1024*4)
	n := runtime.Stack(buf, false)
	return string(buf[:n])
}

// ErrorHandler 错误处理器接口
type ErrorHandler interface {
	HandleError(err *AppError)
}

// DefaultErrorHandler 默认错误处理器
type DefaultErrorHandler struct {
	// 可以添加日志记录等功能
}

// HandleError 处理错误
func (h *DefaultErrorHandler) HandleError(err *AppError) {
	// 这里可以添加日志记录、错误上报等逻辑
	fmt.Printf("Error occurred: %s\n", err.ToJSON())
}

// 错误恢复函数

// RecoverWithError 从panic中恢复并转换为AppError
func RecoverWithError() *AppError {
	if r := recover(); r != nil {
		var message string
		switch v := r.(type) {
		case string:
			message = v
		case error:
			message = v.Error()
		default:
			message = fmt.Sprintf("Unknown panic: %v", v)
		}

		return NewSystemError(ErrCodeOperationFailed,
			"操作过程中发生未知错误",
			fmt.Errorf("%s", message)).
			WithDetails(getStackTrace())
	}
	return nil
}

// SafeExecute 安全执行函数
func SafeExecute(fn func() error) *AppError {
	defer func() {
		if err := RecoverWithError(); err != nil {
			// 可以在这里记录panic错误
		}
	}()

	if err := fn(); err != nil {
		if appErr, ok := err.(*AppError); ok {
			return appErr
		}
		return WrapError(err, ErrCodeOperationFailed, "操作执行失败")
	}

	return nil
}

// NewConfigError 创建配置错误
func NewConfigError(code, message string) *AppError {
	return &AppError{
		Code:      code,
		Message:   message,
		Type:      "CONFIG_ERROR",
		Timestamp: time.Now(),
	}
}
