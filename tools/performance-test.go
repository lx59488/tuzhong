package main

import (
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

// 性能测试工具
func main() {
	fmt.Println("=== 图中图 性能测试工具 ===")
	fmt.Println()

	// 显示系统信息
	showSystemInfo()

	// 创建测试数据
	testDataDir := "test_performance_data"
	createTestData(testDataDir)

	// 运行性能测试
	runPerformanceTest(testDataDir)

	// 清理测试数据
	cleanupTestData(testDataDir)
}

func showSystemInfo() {
	fmt.Printf("操作系统: %s\n", runtime.GOOS)
	fmt.Printf("架构: %s\n", runtime.GOARCH)
	fmt.Printf("Go 版本: %s\n", runtime.Version())
	fmt.Printf("CPU 核心数: %d\n", runtime.NumCPU())

	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	fmt.Printf("当前内存使用: %.2f MB\n", float64(m.Alloc)/1024/1024)
	fmt.Println()
}

func createTestData(dir string) {
	fmt.Println("📁 创建测试数据...")

	os.MkdirAll(dir, 0755)

	// 创建不同大小的测试图片文件
	sizes := []struct {
		name string
		size int
	}{
		{"small.jpg", 1024 * 100},      // 100KB
		{"medium.jpg", 1024 * 1024},    // 1MB
		{"large.jpg", 1024 * 1024 * 5}, // 5MB
	}

	for _, s := range sizes {
		data := make([]byte, s.size)
		for i := range data {
			data[i] = byte(i % 256)
		}

		// 添加简单的JPEG文件头
		if len(data) > 10 {
			data[0] = 0xFF
			data[1] = 0xD8
			data[len(data)-2] = 0xFF
			data[len(data)-1] = 0xD9
		}

		filename := filepath.Join(dir, s.name)
		err := ioutil.WriteFile(filename, data, 0644)
		if err != nil {
			fmt.Printf("❌ 创建文件失败: %v\n", err)
		} else {
			fmt.Printf("✅ 创建测试文件: %s (%d bytes)\n", s.name, s.size)
		}
	}
	fmt.Println()
}

func runPerformanceTest(dir string) {
	fmt.Println("🔄 运行性能测试...")

	files, err := ioutil.ReadDir(dir)
	if err != nil {
		fmt.Printf("❌ 读取目录失败: %v\n", err)
		return
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		filename := filepath.Join(dir, file.Name())
		fmt.Printf("测试文件: %s\n", file.Name())

		// 测试文件读取性能
		start := time.Now()
		data, err := ioutil.ReadFile(filename)
		readTime := time.Since(start)

		if err != nil {
			fmt.Printf("  ❌ 读取失败: %v\n", err)
			continue
		}

		fmt.Printf("  📊 文件大小: %.2f MB\n", float64(len(data))/1024/1024)
		fmt.Printf("  ⏱️  读取时间: %v\n", readTime)
		fmt.Printf("  🚀 读取速度: %.2f MB/s\n", float64(len(data))/1024/1024/readTime.Seconds())

		// 模拟图像处理操作
		start = time.Now()
		processImage(data)
		processTime := time.Since(start)
		fmt.Printf("  🔧 处理时间: %v\n", processTime)

		// 显示内存使用情况
		var m runtime.MemStats
		runtime.ReadMemStats(&m)
		fmt.Printf("  💾 内存使用: %.2f MB\n", float64(m.Alloc)/1024/1024)
		fmt.Println()

		// 强制垃圾回收
		runtime.GC()
	}
}

func processImage(data []byte) {
	// 模拟图像处理：简单的数据处理
	processed := make([]byte, len(data))
	for i, b := range data {
		processed[i] = b ^ 0x55 // 简单的位操作
	}

	// 模拟内存密集型操作
	temp := make([][]byte, 10)
	for i := range temp {
		temp[i] = make([]byte, len(data)/10)
		copy(temp[i], processed[i*len(data)/10:(i+1)*len(data)/10])
	}
}

func cleanupTestData(dir string) {
	fmt.Println("🧹 清理测试数据...")
	err := os.RemoveAll(dir)
	if err != nil {
		fmt.Printf("❌ 清理失败: %v\n", err)
	} else {
		fmt.Println("✅ 测试数据已清理")
	}
}
