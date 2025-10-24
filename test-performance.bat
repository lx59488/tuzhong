@echo off
echo ===========================================
echo      测试增强性能监控系统
echo ===========================================
echo.

echo 1. 编译应用程序...
call build.bat
if errorlevel 1 (
    echo ❌ 编译失败！
    pause
    exit /b 1
)

echo.
echo 2. 启动应用程序进行性能监控测试...
echo    - 请在应用中打开性能监控面板
echo    - 观察实时性能图表和指标
echo    - 检查优化建议功能
echo    - 测试不同的文件处理操作
echo.

start "" "build\bin\tuzhong.exe"

echo.
echo 3. 性能监控功能说明：
echo    ✅ 实时内存使用监控
echo    ✅ CPU 使用率估算
echo    ✅ 性能评分系统
echo    ✅ 优化建议提示
echo    ✅ 图表可视化显示
echo    ✅ 性能数据导出
echo.
echo 应用程序已启动，请检查性能监控功能是否正常工作...
echo 按任意键退出测试脚本
pause > nul