// 性能监控面板增强版
class EnhancedPerformanceMonitor {
    constructor() {
        this.charts = {};
        this.benchmarks = {
            memoryThreshold: 80,      // 内存警告阈值
            operationThreshold: 1000, // 慢操作阈值(ms)
            cpuThreshold: 80         // CPU使用率阈值
        };
        this.observers = [];
        this.initAdvancedMonitoring();
    }

    // 初始化高级监控
    initAdvancedMonitoring() {
        this.initRenderPerformanceObserver();
        this.initNetworkMonitoring();
        this.initCPUMonitoring();
        this.createPerformanceCharts();
    }

    // 渲染性能观察器
    initRenderPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            // 观察页面渲染性能
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        console.log('首次内容绘制:', entry.startTime, 'ms');
                        this.updateMetric('fcp', entry.startTime);
                    }
                    if (entry.name === 'largest-contentful-paint') {
                        console.log('最大内容绘制:', entry.startTime, 'ms');
                        this.updateMetric('lcp', entry.startTime);
                    }
                }
            });
            
            try {
                paintObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
                this.observers.push(paintObserver);
            } catch (e) {
                console.warn('Paint observer not supported');
            }

            // 观察布局偏移
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                if (clsValue > 0) {
                    console.log('累积布局偏移:', clsValue);
                    this.updateMetric('cls', clsValue);
                }
            });

            try {
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.push(clsObserver);
            } catch (e) {
                console.warn('Layout shift observer not supported');
            }
        }
    }

    // 网络性能监控
    initNetworkMonitoring() {
        if ('PerformanceObserver' in window) {
            const resourceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 1000) { // 资源加载超过1秒
                        console.warn('慢资源加载:', entry.name, entry.duration, 'ms');
                        this.logSlowResource(entry);
                    }
                }
            });

            try {
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.push(resourceObserver);
            } catch (e) {
                console.warn('Resource observer not supported');
            }
        }
    }

    // CPU使用率监控（估算）
    initCPUMonitoring() {
        let lastTime = performance.now();
        let lastUsage = 0;

        const measureCPU = () => {
            const currentTime = performance.now();
            const deltaTime = currentTime - lastTime;
            
            // 执行一个标准计算任务来估算CPU使用情况
            const startCalc = performance.now();
            let sum = 0;
            for (let i = 0; i < 100000; i++) {
                sum += Math.sqrt(i);
            }
            const calcTime = performance.now() - startCalc;
            
            // 估算CPU使用率（基于计算时间）
            const estimatedCPU = Math.min((calcTime / 16) * 100, 100); // 基于16ms帧时间
            
            this.updateMetric('cpu', estimatedCPU);
            lastTime = currentTime;
            
            setTimeout(measureCPU, 5000); // 每5秒测量一次
        };

        measureCPU();
    }

    // 创建性能图表
    createPerformanceCharts() {
        this.charts.memory = this.createMiniChart('memoryChart', 'Memory Usage');
        this.charts.operations = this.createMiniChart('operationsChart', 'Operations');
        this.charts.cpu = this.createMiniChart('cpuChart', 'CPU Usage');
    }

    // 创建迷你图表
    createMiniChart(containerId, title) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 60;
        canvas.style.cssText = 'width: 100%; height: 60px; border-radius: 4px;';
        
        container.innerHTML = '';
        container.appendChild(canvas);

        return {
            canvas,
            ctx: canvas.getContext('2d'),
            data: [],
            maxPoints: 50,
            title
        };
    }

    // 更新指标
    updateMetric(type, value) {
        const chart = this.charts[type];
        if (!chart) return;

        chart.data.push(value);
        if (chart.data.length > chart.maxPoints) {
            chart.data.shift();
        }

        this.drawChart(chart);
    }

    // 绘制图表
    drawChart(chart) {
        const { ctx, canvas, data, title } = chart;
        const width = canvas.width;
        const height = canvas.height;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        if (data.length < 2) return;

        // 计算数据范围
        const max = Math.max(...data);
        const min = Math.min(...data);
        const range = max - min || 1;

        // 绘制网格线
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // 绘制数据线
        ctx.strokeStyle = this.getChartColor(data[data.length - 1], title);
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((value, index) => {
            const x = (width / (data.length - 1)) * index;
            const y = height - ((value - min) / range) * height;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // 绘制填充区域
        ctx.fillStyle = ctx.strokeStyle.replace('1)', '0.1)');
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
    }

    // 获取图表颜色
    getChartColor(value, type) {
        switch (type) {
            case 'Memory Usage':
                if (value < 50) return 'rgba(16, 185, 129, 1)';
                if (value < 80) return 'rgba(245, 158, 11, 1)';
                return 'rgba(239, 68, 68, 1)';
            case 'CPU Usage':
                if (value < 50) return 'rgba(59, 130, 246, 1)';
                if (value < 80) return 'rgba(245, 158, 11, 1)';
                return 'rgba(239, 68, 68, 1)';
            default:
                return 'rgba(99, 102, 241, 1)';
        }
    }

    // 记录慢资源
    logSlowResource(entry) {
        const slowResources = JSON.parse(localStorage.getItem('slowResources') || '[]');
        slowResources.push({
            name: entry.name,
            duration: entry.duration,
            timestamp: Date.now(),
            type: entry.initiatorType
        });

        // 保持最近50个记录
        if (slowResources.length > 50) {
            slowResources.splice(0, slowResources.length - 50);
        }

        localStorage.setItem('slowResources', JSON.stringify(slowResources));
    }

    // 获取性能评分
    getPerformanceScore() {
        const report = window.performanceUtils?.getPerformanceReport();
        if (!report) return 0;

        let score = 100;

        // 内存使用评分 (40%)
        if (report.currentMemory) {
            const memoryPenalty = Math.max(0, parseFloat(report.currentMemory.usagePercentage) - 70) * 2;
            score -= memoryPenalty * 0.4;
        }

        // 操作时间评分 (40%)
        const avgTime = report.averageOperationTime;
        if (avgTime > 100) {
            const timePenalty = Math.min(50, (avgTime - 100) / 20);
            score -= timePenalty * 0.4;
        }

        // 慢操作评分 (20%)
        const slowOpsRatio = report.slowOperations.length / (report.totalOperations || 1);
        score -= slowOpsRatio * 100 * 0.2;

        return Math.max(0, Math.round(score));
    }

    // 生成优化建议
    getOptimizationSuggestions() {
        const suggestions = [];
        const report = window.performanceUtils?.getPerformanceReport();
        
        if (!report) return suggestions;

        // 内存优化建议
        if (report.currentMemory && parseFloat(report.currentMemory.usagePercentage) > 70) {
            suggestions.push({
                type: 'memory',
                severity: 'high',
                title: '内存使用率过高',
                description: '当前内存使用率超过70%，建议清理缓存或关闭不必要的功能',
                actions: ['清理图片预览缓存', '关闭不需要的标签页', '重启应用释放内存']
            });
        }

        // 性能优化建议
        if (report.averageOperationTime > 500) {
            suggestions.push({
                type: 'performance',
                severity: 'medium',
                title: '操作响应较慢',
                description: '平均操作时间超过500ms，建议优化操作流程',
                actions: ['减少文件处理并发数', '使用更小的文件块大小', '检查磁盘空间']
            });
        }

        // 慢操作建议
        if (report.slowOperations.length > 5) {
            suggestions.push({
                type: 'operations',
                severity: 'medium',
                title: '存在较多慢操作',
                description: '检测到多个耗时操作，可能影响用户体验',
                actions: ['优化大文件处理流程', '增加进度反馈', '考虑分批处理']
            });
        }

        return suggestions;
    }

    // 清理观察器
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// 导出
window.EnhancedPerformanceMonitor = EnhancedPerformanceMonitor;