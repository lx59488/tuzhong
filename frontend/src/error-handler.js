/**
 * 前端统一错误处理框架
 */

// 错误类型常量
const ErrorTypes = {
    USER: 'user',
    VALIDATION: 'validation',
    SYSTEM: 'system',
    IO: 'io',
    NETWORK: 'network'
};

// 错误代码常量
const ErrorCodes = {
    // 文件相关错误
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FILE_PERMISSION: 'FILE_PERMISSION',
    FILE_CORRUPTED: 'FILE_CORRUPTED',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FORMAT: 'INVALID_FORMAT',
    INVALID_PATH: 'INVALID_PATH',
    
    // 图像处理错误
    IMAGE_INVALID: 'IMAGE_INVALID',
    IMAGE_UNSUPPORTED: 'IMAGE_UNSUPPORTED',
    IMAGE_CORRUPTED: 'IMAGE_CORRUPTED',
    
    // ZIP处理错误
    ZIP_INVALID: 'ZIP_INVALID',
    ZIP_CORRUPTED: 'ZIP_CORRUPTED',
    ZIP_TOO_LARGE: 'ZIP_TOO_LARGE',
    ZIP_EXTRACT_FAILED: 'ZIP_EXTRACT_FAILED',
    
    // 系统错误
    MEMORY_EXHAUSTED: 'MEMORY_EXHAUSTED',
    DISK_FULL: 'DISK_FULL',
    TIMEOUT: 'TIMEOUT',
    CANCELLED: 'CANCELLED',
    
    // 用户操作错误
    INVALID_INPUT: 'INVALID_INPUT',
    OPERATION_FAILED: 'OPERATION_FAILED',
    UNSUPPORTED_OPERATION: 'UNSUPPORTED_OPERATION'
};

// 错误级别
const ErrorLevels = {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical'
};

/**
 * 应用错误类
 */
class AppError extends Error {
    constructor(code, message, type = ErrorTypes.USER, details = null) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.type = type;
        this.details = details;
        this.timestamp = Date.now();
        this.context = {};
        this.level = this.determineLevel();
    }

    /**
     * 添加上下文信息
     */
    withContext(key, value) {
        this.context[key] = value;
        return this;
    }

    /**
     * 添加详细信息
     */
    withDetails(details) {
        this.details = details;
        return this;
    }

    /**
     * 确定错误级别
     */
    determineLevel() {
        if (this.type === ErrorTypes.SYSTEM) {
            return ErrorLevels.CRITICAL;
        }
        if (this.type === ErrorTypes.IO) {
            return ErrorLevels.ERROR;
        }
        if (this.type === ErrorTypes.VALIDATION) {
            return ErrorLevels.WARNING;
        }
        return ErrorLevels.INFO;
    }

    /**
     * 转换为JSON
     */
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            type: this.type,
            level: this.level,
            details: this.details,
            timestamp: this.timestamp,
            context: this.context,
            stack: this.stack
        };
    }

    /**
     * 获取用户友好的消息
     */
    getUserFriendlyMessage() {
        return ErrorMessages[this.code] || this.message;
    }
}

/**
 * 错误消息映射（支持国际化）
 */
const ErrorMessages = {
    [ErrorCodes.FILE_NOT_FOUND]: '找不到指定的文件',
    [ErrorCodes.FILE_PERMISSION]: '没有文件访问权限',
    [ErrorCodes.FILE_CORRUPTED]: '文件已损坏',
    [ErrorCodes.FILE_TOO_LARGE]: '文件太大',
    [ErrorCodes.INVALID_FORMAT]: '文件格式不支持',
    [ErrorCodes.INVALID_PATH]: '文件路径无效',
    
    [ErrorCodes.IMAGE_INVALID]: '无效的图片文件',
    [ErrorCodes.IMAGE_UNSUPPORTED]: '不支持的图片格式',
    [ErrorCodes.IMAGE_CORRUPTED]: '图片文件已损坏',
    
    [ErrorCodes.ZIP_INVALID]: '无效的压缩文件',
    [ErrorCodes.ZIP_CORRUPTED]: '压缩文件已损坏',
    [ErrorCodes.ZIP_TOO_LARGE]: '压缩文件太大',
    [ErrorCodes.ZIP_EXTRACT_FAILED]: '解压文件失败',
    
    [ErrorCodes.MEMORY_EXHAUSTED]: '内存不足',
    [ErrorCodes.DISK_FULL]: '磁盘空间不足',
    [ErrorCodes.TIMEOUT]: '操作超时',
    [ErrorCodes.CANCELLED]: '操作已取消',
    
    [ErrorCodes.INVALID_INPUT]: '输入无效',
    [ErrorCodes.OPERATION_FAILED]: '操作失败',
    [ErrorCodes.UNSUPPORTED_OPERATION]: '不支持的操作'
};

/**
 * 错误日志记录器
 */
class ErrorLogger {
    constructor(maxEntries = 50) {
        this.errors = [];
        this.maxEntries = maxEntries;
        this.listeners = [];
    }

    /**
     * 记录错误
     */
    logError(error, context = {}) {
        const errorEntry = {
            error: error instanceof AppError ? error.toJSON() : {
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            },
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
                ...context
            }
        };

        this.errors.push(errorEntry);

        // 保持最大条目数限制
        if (this.errors.length > this.maxEntries) {
            this.errors.shift();
        }

        // 存储到本地存储
        this.saveToLocalStorage();

        // 通知监听器
        this.notifyListeners(errorEntry);

        // 在开发模式下打印到控制台
        if (process.env.NODE_ENV === 'development') {
            console.error('Error logged:', errorEntry);
        }
    }

    /**
     * 获取最近的错误
     */
    getRecentErrors(limit = 10) {
        return this.errors.slice(-limit);
    }

    /**
     * 清空错误日志
     */
    clearErrors() {
        this.errors = [];
        this.saveToLocalStorage();
    }

    /**
     * 添加错误监听器
     */
    addListener(listener) {
        this.listeners.push(listener);
    }

    /**
     * 移除错误监听器
     */
    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * 通知监听器
     */
    notifyListeners(errorEntry) {
        this.listeners.forEach(listener => {
            try {
                listener(errorEntry);
            } catch (err) {
                console.error('Error in error listener:', err);
            }
        });
    }

    /**
     * 保存到本地存储
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('errorLogs', JSON.stringify(this.errors));
        } catch (err) {
            console.warn('Failed to save error logs to localStorage:', err);
        }
    }

    /**
     * 从本地存储加载
     */
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('errorLogs');
            if (stored) {
                this.errors = JSON.parse(stored);
            }
        } catch (err) {
            console.warn('Failed to load error logs from localStorage:', err);
            this.errors = [];
        }
    }

    /**
     * 导出错误日志
     */
    exportErrors() {
        return JSON.stringify(this.errors, null, 2);
    }
}

/**
 * 错误显示器
 */
class ErrorDisplayer {
    constructor() {
        this.container = null;
        this.currentToasts = [];
        this.maxToasts = 5;
        this.defaultDuration = 5000;
        this.init();
    }

    /**
     * 初始化错误显示容器
     */
    init() {
        this.container = document.createElement('div');
        this.container.id = 'error-toast-container';
        this.container.className = 'error-toast-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);

        // 添加CSS样式
        this.addStyles();
    }

    /**
     * 添加CSS样式
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .error-toast {
                background: #fff;
                border-left: 4px solid #e74c3c;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                padding: 16px;
                animation: slideInRight 0.3s ease-out;
                position: relative;
                max-width: 100%;
                word-wrap: break-word;
            }
            
            .error-toast.warning {
                border-left-color: #f39c12;
            }
            
            .error-toast.info {
                border-left-color: #3498db;
            }
            
            .error-toast.critical {
                border-left-color: #8e44ad;
                background: #fdebf7;
            }
            
            .error-toast-header {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .error-toast-message {
                font-size: 13px;
                color: #666;
                line-height: 1.4;
            }
            
            .error-toast-details {
                font-size: 12px;
                color: #999;
                margin-top: 8px;
                font-family: monospace;
                background: #f8f8f8;
                padding: 8px;
                border-radius: 3px;
                max-height: 100px;
                overflow-y: auto;
            }
            
            .error-toast-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #999;
                padding: 0;
                margin-left: 10px;
            }
            
            .error-toast-close:hover {
                color: #666;
            }
            
            .error-toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: #e74c3c;
                transition: width linear;
            }
            
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 显示错误
     */
    showError(error, options = {}) {
        const {
            duration = this.defaultDuration,
            showDetails = false,
            persistent = false
        } = options;

        // 如果已达到最大数量，移除最旧的toast
        if (this.currentToasts.length >= this.maxToasts) {
            this.removeToast(this.currentToasts[0]);
        }

        const toast = this.createToast(error, { duration, showDetails, persistent });
        this.container.appendChild(toast);
        this.currentToasts.push(toast);

        // 如果不是持久显示，设置自动关闭
        if (!persistent && duration > 0) {
            setTimeout(() => {
                this.removeToast(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * 创建toast元素
     */
    createToast(error, options) {
        const toast = document.createElement('div');
        toast.className = `error-toast ${error.level || 'error'}`;

        const header = document.createElement('div');
        header.className = 'error-toast-header';
        header.innerHTML = `
            <span>${error.code || 'ERROR'}</span>
            <button class="error-toast-close">&times;</button>
        `;

        const message = document.createElement('div');
        message.className = 'error-toast-message';
        message.textContent = error.getUserFriendlyMessage ? 
            error.getUserFriendlyMessage() : error.message;

        toast.appendChild(header);
        toast.appendChild(message);

        // 添加详细信息（如果需要）
        if (options.showDetails && error.details) {
            const details = document.createElement('div');
            details.className = 'error-toast-details';
            details.textContent = error.details;
            toast.appendChild(details);
        }

        // 添加进度条（如果不是持久显示）
        if (!options.persistent && options.duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'error-toast-progress';
            progress.style.width = '100%';
            toast.appendChild(progress);

            // 动画进度条
            setTimeout(() => {
                progress.style.transition = `width ${options.duration}ms linear`;
                progress.style.width = '0%';
            }, 10);
        }

        // 添加关闭按钮事件
        const closeBtn = header.querySelector('.error-toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        return toast;
    }

    /**
     * 移除toast
     */
    removeToast(toast) {
        if (!toast || !toast.parentNode) return;

        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            const index = this.currentToasts.indexOf(toast);
            if (index > -1) {
                this.currentToasts.splice(index, 1);
            }
        }, 300);
    }

    /**
     * 清空所有toast
     */
    clearAll() {
        this.currentToasts.forEach(toast => {
            this.removeToast(toast);
        });
    }
}

/**
 * 错误处理管理器
 */
class ErrorManager {
    constructor() {
        this.logger = new ErrorLogger();
        this.displayer = new ErrorDisplayer();
        this.handlers = new Map();
        this.globalHandler = null;
        
        this.init();
    }

    /**
     * 初始化
     */
    init() {
        // 加载本地存储的错误日志
        this.logger.loadFromLocalStorage();

        // 监听全局错误
        this.setupGlobalErrorHandling();

        // 监听后端错误事件
        this.setupBackendErrorHandling();
    }

    /**
     * 设置全局错误处理
     */
    setupGlobalErrorHandling() {
        // 捕获JavaScript错误
        window.addEventListener('error', (event) => {
            // 临时禁用，用于调试OPERATION_FAILED问题
            console.error('JavaScript error:', event.message, 'at', event.filename + ':' + event.lineno);
            console.trace('Error trace:');
            
            // 阻止默认处理，避免触发弹窗
            event.preventDefault();
            
            // const error = new AppError(
            //     ErrorCodes.OPERATION_FAILED,
            //     event.message,
            //     ErrorTypes.SYSTEM
            // ).withContext('filename', event.filename)
            //  .withContext('lineno', event.lineno)
            //  .withContext('colno', event.colno);

            // this.handleError(error);
        });

        // 捕获Promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            // 临时禁用，用于调试OPERATION_FAILED问题
            console.error('Unhandled promise rejection:', event.reason);
            console.trace('Promise rejection trace:');
            
            // 阻止默认处理，避免触发弹窗
            event.preventDefault();
            
            // const error = new AppError(
            //     ErrorCodes.OPERATION_FAILED,
            //     event.reason?.message || 'Unhandled promise rejection',
            //     ErrorTypes.SYSTEM
            // ).withDetails(event.reason?.stack);

            // this.handleError(error);
        });
    }

    /**
     * 设置后端错误处理
     */
    setupBackendErrorHandling() {
        // 监听来自后端的错误事件
        if (window.runtime && window.runtime.EventsOn) {
            window.runtime.EventsOn('error', (errorData) => {
                const error = new AppError(
                    errorData.code,
                    errorData.message,
                    errorData.type
                );

                if (errorData.details) {
                    error.withDetails(errorData.details);
                }

                if (errorData.context) {
                    Object.keys(errorData.context).forEach(key => {
                        error.withContext(key, errorData.context[key]);
                    });
                }

                this.handleError(error, { fromBackend: true });
            });
        }
    }

    /**
     * 处理错误
     */
    handleError(error, options = {}) {
        // 记录错误
        this.logger.logError(error, options);

        // 检查是否有特定处理器
        const handler = this.handlers.get(error.code);
        if (handler) {
            try {
                handler(error, options);
                return;
            } catch (err) {
                console.error('Error in custom error handler:', err);
            }
        }

        // 使用全局处理器
        if (this.globalHandler) {
            try {
                this.globalHandler(error, options);
                return;
            } catch (err) {
                console.error('Error in global error handler:', err);
            }
        }

        // 默认处理：显示错误toast
        this.displayer.showError(error, {
            showDetails: process.env.NODE_ENV === 'development',
            duration: this.getDisplayDuration(error)
        });
    }

    /**
     * 获取显示持续时间
     */
    getDisplayDuration(error) {
        switch (error.level) {
            case ErrorLevels.CRITICAL:
                return 0; // 持久显示
            case ErrorLevels.ERROR:
                return 8000;
            case ErrorLevels.WARNING:
                return 5000;
            default:
                return 3000;
        }
    }

    /**
     * 注册错误处理器
     */
    registerHandler(errorCode, handler) {
        this.handlers.set(errorCode, handler);
    }

    /**
     * 取消注册错误处理器
     */
    unregisterHandler(errorCode) {
        this.handlers.delete(errorCode);
    }

    /**
     * 设置全局错误处理器
     */
    setGlobalHandler(handler) {
        this.globalHandler = handler;
    }

    /**
     * 创建错误
     */
    createError(code, message, type = ErrorTypes.USER) {
        return new AppError(code, message, type);
    }

    /**
     * 获取错误统计
     */
    getErrorStats() {
        const errors = this.logger.getRecentErrors(100);
        const stats = {
            total: errors.length,
            byType: {},
            byCode: {},
            recent: errors.slice(-10)
        };

        errors.forEach(entry => {
            const error = entry.error;
            stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
            stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
        });

        return stats;
    }
}

// 创建全局实例
const errorManager = new ErrorManager();

// 导出API
window.ErrorManager = errorManager;
window.AppError = AppError;
window.ErrorCodes = ErrorCodes;
window.ErrorTypes = ErrorTypes;
window.ErrorLevels = ErrorLevels;

// 提供便捷方法
window.handleError = (error, options) => errorManager.handleError(error, options);
window.createError = (code, message, type) => errorManager.createError(code, message, type);