// 前端性能优化工具库
class PerformanceUtils {
    constructor() {
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
        this.memoryMonitor = null;
        this.performanceMetrics = {
            startTime: performance.now(),
            operations: [],
            memoryUsage: []
        };
        
        this.initMemoryMonitoring();
    }

    // 防抖函数
    debounce(func, delay, key = 'default') {
        return (...args) => {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }
            
            const timer = setTimeout(() => {
                func.apply(this, args);
                this.debounceTimers.delete(key);
            }, delay);
            
            this.debounceTimers.set(key, timer);
        };
    }

    // 节流函数
    throttle(func, delay, key = 'default') {
        return (...args) => {
            if (!this.throttleTimers.has(key)) {
                func.apply(this, args);
                this.throttleTimers.set(key, true);
                
                setTimeout(() => {
                    this.throttleTimers.delete(key);
                }, delay);
            }
        };
    }

    // 内存监控
    initMemoryMonitoring() {
        if ('memory' in performance) {
            this.memoryMonitor = setInterval(() => {
                const memInfo = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                };
                
                this.performanceMetrics.memoryUsage.push(memInfo);
                
                // 保持最近100个记录
                if (this.performanceMetrics.memoryUsage.length > 100) {
                    this.performanceMetrics.memoryUsage.shift();
                }
                
                // 内存使用率超过80%时发出警告
                const usageRatio = memInfo.used / memInfo.total;
                if (usageRatio > 0.8) {
                    console.warn('内存使用率过高:', (usageRatio * 100).toFixed(2) + '%');
                    this.emitMemoryWarning(memInfo);
                }
            }, 5000); // 每5秒检查一次
        }
    }

    // 发出内存警告事件
    emitMemoryWarning(memInfo) {
        const event = new CustomEvent('memoryWarning', {
            detail: {
                usage: memInfo,
                recommendations: this.getMemoryOptimizationTips()
            }
        });
        window.dispatchEvent(event);
    }

    // 内存优化建议
    getMemoryOptimizationTips() {
        return [
            '关闭不需要的预览窗口',
            '清理临时文件缓存',
            '减少同时处理的文件数量',
            '刷新页面释放内存'
        ];
    }

    // 性能计时器
    startOperation(operationName) {
        const operation = {
            name: operationName,
            startTime: performance.now(),
            endTime: null,
            duration: null
        };
        
        this.performanceMetrics.operations.push(operation);
        return this.performanceMetrics.operations.length - 1;
    }

    // 结束性能计时
    endOperation(operationIndex) {
        if (operationIndex >= 0 && operationIndex < this.performanceMetrics.operations.length) {
            const operation = this.performanceMetrics.operations[operationIndex];
            operation.endTime = performance.now();
            operation.duration = operation.endTime - operation.startTime;
            
            console.log(`操作 ${operation.name} 耗时: ${operation.duration.toFixed(2)}ms`);
            
            // 操作超过1秒时发出警告
            if (operation.duration > 1000) {
                console.warn(`慢操作检测: ${operation.name} 耗时 ${operation.duration.toFixed(2)}ms`);
            }
            
            return operation;
        }
    }

    // 获取性能报告
    getPerformanceReport() {
        const totalTime = performance.now() - this.performanceMetrics.startTime;
        const completedOperations = this.performanceMetrics.operations.filter(op => op.duration !== null);
        
        const avgOperationTime = completedOperations.length > 0 
            ? completedOperations.reduce((sum, op) => sum + op.duration, 0) / completedOperations.length 
            : 0;
            
        const slowOperations = completedOperations.filter(op => op.duration > 1000);
        
        const currentMemory = this.getCurrentMemoryUsage();
        
        return {
            sessionDuration: totalTime,
            totalOperations: completedOperations.length,
            averageOperationTime: avgOperationTime,
            slowOperations: slowOperations,
            currentMemory: currentMemory,
            memoryHistory: this.performanceMetrics.memoryUsage.slice(-10) // 最近10个记录
        };
    }

    // 获取当前内存使用情况
    getCurrentMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize * 100).toFixed(2)
            };
        }
        return null;
    }

    // 虚拟化列表
    createVirtualList(container, items, itemHeight, renderItem, bufferSize = 5) {
        return new VirtualList(container, items, itemHeight, renderItem, bufferSize);
    }

    // 请求队列管理
    createRequestQueue(maxConcurrent = 3) {
        return new RequestQueue(maxConcurrent);
    }

    // 清理资源
    cleanup() {
        // 清理防抖定时器
        this.debounceTimers.forEach(timer => clearTimeout(timer));
        this.debounceTimers.clear();
        
        // 清理节流定时器
        this.throttleTimers.clear();
        
        // 清理内存监控
        if (this.memoryMonitor) {
            clearInterval(this.memoryMonitor);
            this.memoryMonitor = null;
        }
        
        console.log('性能工具已清理');
    }
}

// 虚拟化列表类
class VirtualList {
    constructor(container, items, itemHeight, renderItem, bufferSize = 5) {
        this.container = container;
        this.items = items;
        this.itemHeight = itemHeight;
        this.renderItem = renderItem;
        this.bufferSize = bufferSize;
        
        this.scrollTop = 0;
        this.containerHeight = container.clientHeight;
        this.visibleStart = 0;
        this.visibleEnd = 0;
        
        this.init();
    }

    init() {
        // 创建滚动容器
        this.scrollContainer = document.createElement('div');
        this.scrollContainer.style.height = `${this.items.length * this.itemHeight}px`;
        this.scrollContainer.style.position = 'relative';
        
        // 创建可见项容器
        this.visibleContainer = document.createElement('div');
        this.visibleContainer.style.position = 'absolute';
        this.visibleContainer.style.top = '0';
        this.visibleContainer.style.width = '100%';
        
        this.scrollContainer.appendChild(this.visibleContainer);
        this.container.appendChild(this.scrollContainer);
        
        // 监听滚动事件
        this.container.addEventListener('scroll', this.handleScroll.bind(this));
        
        this.updateVisibleItems();
    }

    handleScroll() {
        this.scrollTop = this.container.scrollTop;
        this.updateVisibleItems();
    }

    updateVisibleItems() {
        const containerHeight = this.container.clientHeight;
        
        // 计算可见范围
        this.visibleStart = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
        this.visibleEnd = Math.min(
            this.items.length - 1,
            Math.ceil((this.scrollTop + containerHeight) / this.itemHeight) + this.bufferSize
        );
        
        // 清空容器
        this.visibleContainer.innerHTML = '';
        
        // 渲染可见项
        for (let i = this.visibleStart; i <= this.visibleEnd; i++) {
            const item = this.items[i];
            const itemElement = this.renderItem(item, i);
            itemElement.style.position = 'absolute';
            itemElement.style.top = `${i * this.itemHeight}px`;
            itemElement.style.height = `${this.itemHeight}px`;
            this.visibleContainer.appendChild(itemElement);
        }
    }

    updateItems(newItems) {
        this.items = newItems;
        this.scrollContainer.style.height = `${this.items.length * this.itemHeight}px`;
        this.updateVisibleItems();
    }
}

// 请求队列管理类
class RequestQueue {
    constructor(maxConcurrent = 3) {
        this.maxConcurrent = maxConcurrent;
        this.currentRequests = 0;
        this.queue = [];
    }

    // 添加请求到队列
    add(requestFn, priority = 0) {
        return new Promise((resolve, reject) => {
            const request = {
                fn: requestFn,
                resolve,
                reject,
                priority,
                timestamp: Date.now()
            };
            
            // 按优先级插入队列
            const insertIndex = this.queue.findIndex(item => item.priority < priority);
            if (insertIndex === -1) {
                this.queue.push(request);
            } else {
                this.queue.splice(insertIndex, 0, request);
            }
            
            this.processNext();
        });
    }

    // 处理下一个请求
    async processNext() {
        console.log(`请求队列状态: 当前请求=${this.currentRequests}, 最大并发=${this.maxConcurrent}, 队列长度=${this.queue.length}`);
        
        if (this.currentRequests >= this.maxConcurrent || this.queue.length === 0) {
            console.log("跳过处理: 达到最大并发或队列为空");
            return;
        }

        const request = this.queue.shift();
        this.currentRequests++;
        
        console.log(`开始处理请求, 优先级=${request.priority}, 当前活跃请求=${this.currentRequests}`);

        try {
            const result = await request.fn();
            console.log("请求执行成功");
            request.resolve(result);
        } catch (error) {
            console.error("请求执行失败:", error);
            request.reject(error);
        } finally {
            this.currentRequests--;
            console.log(`请求完成，当前活跃请求=${this.currentRequests}`);
            this.processNext();
        }
    }

    // 清空队列
    clear() {
        this.queue.forEach(request => {
            request.reject(new Error('Request queue cleared'));
        });
        this.queue = [];
    }

    // 获取队列状态
    getStatus() {
        return {
            queueSize: this.queue.length,
            currentRequests: this.currentRequests,
            maxConcurrent: this.maxConcurrent
        };
    }
}

// 导出全局实例
window.PerformanceUtils = PerformanceUtils;
window.performanceUtils = new PerformanceUtils();

// 在页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (window.performanceUtils) {
        window.performanceUtils.cleanup();
    }
});

export { PerformanceUtils, VirtualList, RequestQueue };