package backend

import (
	"archive/zip"
	"bytes"
	"compress/gzip"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/binary"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"golang.org/x/crypto/pbkdf2"
)

// 数据格式类型定义
type DataFormatType int

const (
	FormatZIP          DataFormatType = iota
	FormatRAW                         // 原始文件
	FormatGZIP                        // GZIP压缩
	FormatEncryptedZIP                // 加密ZIP
	FormatTar                         // TAR归档
	FormatCustom                      // 自定义格式
)

// 数据格式信息
type DataFormatInfo struct {
	Type        DataFormatType `json:"type"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	IsEncrypted bool           `json:"isEncrypted"`
	Files       []string       `json:"files"`
	Size        int64          `json:"size"`
}

// 扩展的图种信息结构体
type ExtendedTuzhongInfo struct {
	*TuzhongInfo
	DataFormat   *DataFormatInfo `json:"dataFormat"`
	RequireAuth  bool            `json:"requireAuth"`
	AuthHint     string          `json:"authHint,omitempty"`
	Capabilities []string        `json:"capabilities"`
}

// 数据格式检测器接口
type DataFormatDetector interface {
	Detect(data []byte) (*DataFormatInfo, error)
	Extract(data []byte, outputDir string, password ...string) error
	Analyze(data []byte) ([]string, error)
}

// ZIP格式检测器
type ZIPDetector struct {
	generator *Generator
}

func (z *ZIPDetector) Detect(data []byte) (*DataFormatInfo, error) {
	if len(data) < 4 {
		return nil, fmt.Errorf("数据太小")
	}

	// 检查ZIP文件头 (PK)
	if data[0] == 0x50 && data[1] == 0x4B {
		return &DataFormatInfo{
			Type:        FormatZIP,
			Name:        "ZIP",
			Description: "标准ZIP压缩格式",
			IsEncrypted: z.isEncryptedZIP(data),
			Size:        int64(len(data)),
		}, nil
	}
	return nil, fmt.Errorf("不是ZIP格式")
}

func (z *ZIPDetector) isEncryptedZIP(data []byte) bool {
	// 检查ZIP文件是否加密
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return false
	}

	for _, file := range reader.File {
		// 检查文件头中的加密标志位
		if file.Flags&0x1 != 0 {
			return true
		}
	}
	return false
}

func (z *ZIPDetector) Extract(data []byte, outputDir string, password ...string) error {
	if z.isEncryptedZIP(data) && len(password) == 0 {
		return fmt.Errorf("加密的ZIP文件需要密码")
	}
	// 使用现有的ZIP提取逻辑
	return z.generator.extractZipData(data, outputDir)
}

func (z *ZIPDetector) Analyze(data []byte) ([]string, error) {
	return z.generator.analyzeZipData(data)
}

// 原始文件检测器
type RawDetector struct{}

func (r *RawDetector) Detect(data []byte) (*DataFormatInfo, error) {
	// 检测文件类型
	fileType := r.detectFileType(data)

	return &DataFormatInfo{
		Type:        FormatRAW,
		Name:        "RAW",
		Description: fmt.Sprintf("原始文件 (%s)", fileType),
		IsEncrypted: false,
		Files:       []string{"hidden_file" + r.getExtension(fileType)},
		Size:        int64(len(data)),
	}, nil
}

func (r *RawDetector) detectFileType(data []byte) string {
	if len(data) < 4 {
		return "unknown"
	}

	// 常见文件类型检测
	signatures := map[string][]byte{
		"pdf": {0x25, 0x50, 0x44, 0x46},                         // %PDF
		"exe": {0x4D, 0x5A},                                     // MZ
		"mp4": {0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70}, // ftyp
		"mp3": {0xFF, 0xFB},                                     // MP3
		"doc": {0xD0, 0xCF, 0x11, 0xE0},                         // Microsoft Office
		"txt": {},                                               // 默认文本
	}

	for fileType, signature := range signatures {
		if len(signature) == 0 {
			continue
		}
		if len(data) >= len(signature) && bytes.Equal(data[:len(signature)], signature) {
			return fileType
		}
	}
	return "binary"
}

func (r *RawDetector) getExtension(fileType string) string {
	extensions := map[string]string{
		"pdf":    ".pdf",
		"exe":    ".exe",
		"mp4":    ".mp4",
		"mp3":    ".mp3",
		"doc":    ".doc",
		"txt":    ".txt",
		"binary": ".bin",
	}
	if ext, ok := extensions[fileType]; ok {
		return ext
	}
	return ".bin"
}

func (r *RawDetector) Extract(data []byte, outputDir string, password ...string) error {
	fileType := r.detectFileType(data)
	fileName := "extracted_file" + r.getExtension(fileType)
	outputPath := filepath.Join(outputDir, fileName)

	return writeFile(outputPath, data)
}

func (r *RawDetector) Analyze(data []byte) ([]string, error) {
	fileType := r.detectFileType(data)
	fileName := "hidden_file" + r.getExtension(fileType)
	return []string{fileName}, nil
}

// GZIP格式检测器
type GZIPDetector struct{}

func (g *GZIPDetector) Detect(data []byte) (*DataFormatInfo, error) {
	if len(data) < 10 {
		return nil, fmt.Errorf("数据太小")
	}

	// GZIP魔数检查 (1F 8B)
	if data[0] == 0x1F && data[1] == 0x8B {
		return &DataFormatInfo{
			Type:        FormatGZIP,
			Name:        "GZIP",
			Description: "GZIP压缩格式",
			IsEncrypted: false,
			Size:        int64(len(data)),
		}, nil
	}
	return nil, fmt.Errorf("不是GZIP格式")
}

func (g *GZIPDetector) Extract(data []byte, outputDir string, password ...string) error {
	reader, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return fmt.Errorf("GZIP解压失败: %v", err)
	}
	defer reader.Close()

	// 读取解压后的数据
	decompressed, err := io.ReadAll(reader)
	if err != nil {
		return fmt.Errorf("读取GZIP数据失败: %v", err)
	}

	// 保存解压后的文件
	fileName := "extracted_file"
	if reader.Name != "" {
		fileName = reader.Name
	}
	outputPath := filepath.Join(outputDir, fileName)

	return writeFile(outputPath, decompressed)
}

func (g *GZIPDetector) Analyze(data []byte) ([]string, error) {
	reader, err := gzip.NewReader(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("GZIP解析失败: %v", err)
	}
	defer reader.Close()

	fileName := "compressed_file"
	if reader.Name != "" {
		fileName = reader.Name
	}
	return []string{fileName}, nil
}

// 加密ZIP检测器
type EncryptedZIPDetector struct {
	zipDetector *ZIPDetector
}

func (e *EncryptedZIPDetector) Detect(data []byte) (*DataFormatInfo, error) {
	// 先检查是否是ZIP
	zipInfo, err := e.zipDetector.Detect(data)
	if err != nil {
		return nil, err
	}

	if !zipInfo.IsEncrypted {
		return nil, fmt.Errorf("不是加密的ZIP文件")
	}

	return &DataFormatInfo{
		Type:        FormatEncryptedZIP,
		Name:        "Encrypted ZIP",
		Description: "加密保护的ZIP文件",
		IsEncrypted: true,
		Size:        int64(len(data)),
	}, nil
}

func (e *EncryptedZIPDetector) Extract(data []byte, outputDir string, password ...string) error {
	if len(password) == 0 {
		return fmt.Errorf("加密文件需要密码")
	}

	// 这里需要使用支持密码的ZIP解压库
	// 由于Go标准库不支持加密ZIP，需要第三方库如 github.com/alexmullins/zip
	return fmt.Errorf("加密ZIP提取功能需要额外的依赖库")
}

func (e *EncryptedZIPDetector) Analyze(data []byte) ([]string, error) {
	// 对于加密ZIP，只能获取文件名，不能获取内容
	reader, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return nil, fmt.Errorf("无法解析ZIP数据: %v", err)
	}

	var files []string
	for _, file := range reader.File {
		files = append(files, file.Name+" (加密)")
	}
	return files, nil
}

// 自定义加密格式检测器
type CustomEncryptedDetector struct{}

// 自定义加密格式头部结构
type CustomHeader struct {
	Magic     [4]byte // "CRYPT" 的前4个字节
	Version   uint32
	Algorithm uint32   // 加密算法标识
	KeySize   uint32   // 密钥长度
	IVSize    uint32   // IV长度
	DataSize  uint64   // 加密数据长度
	CheckSum  [32]byte // SHA256校验和
}

func (c *CustomEncryptedDetector) Detect(data []byte) (*DataFormatInfo, error) {
	if len(data) < 64 { // CustomHeader 最小长度
		return nil, fmt.Errorf("数据太小")
	}

	// 检查自定义魔数 "CRYP"
	if string(data[0:4]) == "CRYP" {
		return &DataFormatInfo{
			Type:        FormatCustom,
			Name:        "Custom Encrypted",
			Description: "自定义加密格式",
			IsEncrypted: true,
			Size:        int64(len(data)),
		}, nil
	}
	return nil, fmt.Errorf("不是自定义加密格式")
}

func (c *CustomEncryptedDetector) Extract(data []byte, outputDir string, password ...string) error {
	if len(password) == 0 {
		return fmt.Errorf("加密文件需要密码")
	}

	// 解析头部
	header, err := c.parseHeader(data)
	if err != nil {
		return fmt.Errorf("解析头部失败: %v", err)
	}

	// 提取IV和加密数据
	headerSize := 64
	iv := data[headerSize : headerSize+int(header.IVSize)]
	encryptedData := data[headerSize+int(header.IVSize) : headerSize+int(header.IVSize)+int(header.DataSize)]

	// 生成密钥
	key := pbkdf2.Key([]byte(password[0]), iv, 10000, int(header.KeySize), sha256.New)

	// AES解密
	block, err := aes.NewCipher(key)
	if err != nil {
		return fmt.Errorf("创建密码块失败: %v", err)
	}

	// CBC模式解密
	mode := cipher.NewCBCDecrypter(block, iv)
	decrypted := make([]byte, len(encryptedData))
	mode.CryptBlocks(decrypted, encryptedData)

	// 去除填充
	decrypted = c.removePKCS7Padding(decrypted)

	// 保存解密后的文件
	outputPath := filepath.Join(outputDir, "decrypted_file")
	return writeFile(outputPath, decrypted)
}

func (c *CustomEncryptedDetector) parseHeader(data []byte) (*CustomHeader, error) {
	if len(data) < 64 {
		return nil, fmt.Errorf("数据太小，无法解析头部")
	}

	header := &CustomHeader{}
	buf := bytes.NewReader(data)

	if err := binary.Read(buf, binary.LittleEndian, header); err != nil {
		return nil, fmt.Errorf("读取头部失败: %v", err)
	}

	return header, nil
}

func (c *CustomEncryptedDetector) removePKCS7Padding(data []byte) []byte {
	if len(data) == 0 {
		return data
	}

	padding := data[len(data)-1]
	if int(padding) > len(data) {
		return data
	}

	return data[:len(data)-int(padding)]
}

func (c *CustomEncryptedDetector) Analyze(data []byte) ([]string, error) {
	return []string{"encrypted_content (需要密码解锁)"}, nil
}

// 多格式检测管理器
type FormatDetectionManager struct {
	detectors []DataFormatDetector
}

func NewFormatDetectionManager(generator *Generator) *FormatDetectionManager {
	return &FormatDetectionManager{
		detectors: []DataFormatDetector{
			&ZIPDetector{generator: generator},
			&EncryptedZIPDetector{zipDetector: &ZIPDetector{generator: generator}},
			&GZIPDetector{},
			&CustomEncryptedDetector{},
			&RawDetector{}, // 最后检测原始文件
		},
	}
}

func (m *FormatDetectionManager) DetectFormat(data []byte) (*DataFormatInfo, DataFormatDetector, error) {
	for _, detector := range m.detectors {
		if info, err := detector.Detect(data); err == nil {
			return info, detector, nil
		}
	}
	return nil, nil, fmt.Errorf("无法识别数据格式")
}

// 辅助函数
func writeFile(path string, data []byte) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(data)
	return err
}

// 生成随机IV
func generateIV(size int) ([]byte, error) {
	iv := make([]byte, size)
	if _, err := rand.Read(iv); err != nil {
		return nil, err
	}
	return iv, nil
}

// PKCS7填充
func addPKCS7Padding(data []byte, blockSize int) []byte {
	padding := blockSize - (len(data) % blockSize)
	padText := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(data, padText...)
}
