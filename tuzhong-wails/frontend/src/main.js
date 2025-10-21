// import './style.css';
import './app.css';
import './tabs.css';

import logo from './assets/images/logo-universal.png';
import {MergeFiles, SelectImageFile, SelectFile, SelectFolder, SelectSaveLocation, OpenFileLocation, GetImageBase64, SelectTuzhongFile, AnalyzeTuzhong, ExtractFromTuzhong, SelectExtractLocation} from '../wailsjs/go/main/App';
import {EventsOn} from '../wailsjs/runtime/runtime';

// 防止页面重排导致窗口标题栏跳动
/*
document.addEventListener('DOMContentLoaded', function() {
    // 设置固定的viewport，防止内容变化影响窗口
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);
    }
    
    // 防止页面滚动导致的重排
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
});
*/
document.querySelector('#app').innerHTML = `
    <div class="background-animation"></div>
    <div class="container">
        <div class="header">
            <div class="logo-container">
                <img id="logo" class="logo" />
                <div class="logo-glow"></div>
            </div>
            <h1 class="title">
                <span class="title-text">图种生成器</span>
                <span class="title-subtitle">Image Seed Generator</span>
            </h1>
        </div>
        
        <div class="main-content">
            <!-- 标签页导航 -->
            <div class="tab-navigation">
                <button id="createTab" class="tab-btn active">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    <span>生成图种</span>
                </button>
                <button id="extractTab" class="tab-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17,8 12,3 7,8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span>解析图种</span>
                </button>
            </div>

            <!-- 生成图种面板 -->
            <div id="createPanel" class="tab-panel active">
            <div class="upload-section">
                <div class="form-group">
                    <div class="input-label">
                        <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                        </svg>
                        <span>封面图片</span>
                    </div>
                    <div class="file-input-container">
                        <button id="selectImageBtn" class="file-btn">
                            <div class="btn-content">
                                <div class="btn-left">
                                    <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7,10 12,15 17,10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    <span>选择图片文件</span>
                                </div>
                                <div class="btn-preview">
                                    <div id="miniPreviewContainer" class="mini-preview-container hidden">
                                        <img id="miniPreviewImage" class="mini-preview-image" src="" alt="预览"/>
                                        <div class="mini-preview-loading">
                                            <div class="mini-loading-spinner"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                        <div id="imageResult" class="file-result">
                            <span class="file-name"></span>
                            <button class="clear-btn" onclick="clearImageSelection()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="input-label">
                        <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <span>要隐藏的文件/文件夹</span>
                    </div>
                    <div class="file-input-container">
                        <div class="button-group">
                            <button id="selectFileBtn" class="file-btn half-width">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                </svg>
                                <span>选择文件</span>
                            </button>
                            <button id="selectFolderBtn" class="file-btn half-width">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                </svg>
                                <span>选择文件夹</span>
                            </button>
                        </div>
                        <div id="targetResult" class="file-result">
                            <span class="file-name"></span>
                            <button class="clear-btn" onclick="clearTargetSelection()">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="input-label">
                        <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14,2 14,8 20,8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10,9 9,9 8,9"/>
                        </svg>
                        <span>输出文件名</span>
                    </div>
                    <div class="input-container">
                        <input type="text" id="outputName" placeholder="请输入输出文件名，例如: my_image.jpg" />
                        <div class="input-border"></div>
                    </div>
                </div>
            </div>
            
            <div class="action-section">
                <button id="generateBtn" class="generate-btn">
                    <span class="btn-text">生成图种</span>
                    <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12,5 19,12 12,19"/>
                    </svg>
                    <div class="btn-loading">
                        <div class="spinner"></div>
                    </div>
                </button>
            </div>
            
            <div id="result" class="result"></div>
            </div>
            
            <!-- 解析图种面板 -->
            <div id="extractPanel" class="tab-panel">
                <div class="upload-section">
                    <div class="form-group">
                        <div class="input-label">
                            <svg class="label-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21,15 16,10 5,21"/>
                            </svg>
                            <span>选择图种文件</span>
                        </div>
                        <div class="file-input-container">
                            <button id="selectTuzhongBtn" class="file-btn">
                                <div class="btn-content">
                                    <div class="btn-left">
                                        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="7,10 12,15 17,10"/>
                                            <line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                        <span>选择图种文件</span>
                                    </div>
                                    <div class="btn-preview">
                                        <div id="tuzhongMiniPreviewContainer" class="mini-preview-container hidden">
                                            <img id="tuzhongMiniPreviewImage" class="mini-preview-image" src="" alt="预览"/>
                                            <div class="mini-preview-loading">
                                                <div class="mini-loading-spinner"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </button>
                            <div id="tuzhongResult" class="file-result">
                                <span class="file-name"></span>
                                <button class="clear-btn" onclick="clearTuzhongSelection()">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 图种信息显示 -->
                    <div id="tuzhongInfo" class="tuzhong-info hidden">
                        <div class="info-header">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                            </svg>
                            <span>图种信息</span>
                        </div>
                        <div class="info-content">
                            <div class="info-item">
                                <span class="info-label">文件大小:</span>
                                <span id="totalSizeInfo">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">图片大小:</span>
                                <span id="imageSizeInfo">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">隐藏数据:</span>
                                <span id="hiddenSizeInfo">--</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">图片格式:</span>
                                <span id="imageFormatInfo">--</span>
                            </div>
                            <div class="info-item files-list">
                                <span class="info-label">隐藏文件:</span>
                                <div id="hiddenFilesList" class="files-container">--</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="action-section">
                    <button id="analyzeBtn" class="generate-btn">
                        <span class="btn-text">分析图种</span>
                        <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M12 1v6M12 17v6"/>
                        </svg>
                        <div class="btn-loading">
                            <div class="spinner"></div>
                        </div>
                    </button>
                    
                    <button id="extractBtn" class="generate-btn secondary" disabled>
                        <span class="btn-text">提取文件</span>
                        <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17,8 12,3 7,8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <div class="btn-loading">
                            <div class="spinner"></div>
                        </div>
                    </button>
                </div>
                
                <div id="extractResult" class="result"></div>
            </div>
        </div>
    </div>
    
    <!-- 进度条模态框 -->
    <div id="progressModal" class="modal hidden">
        <div class="modal-content">
            <div class="progress-header">
                <h3>生成图种</h3>
            </div>
            <div class="progress-body">
                <div class="progress-text" id="progressText">准备开始...</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar"></div>
                    <div class="progress-percentage" id="progressPercentage">0%</div>
                </div>
            </div>
            <div class="progress-footer">
                <button id="cancelProgressBtn" class="cancel-btn">取消</button>
            </div>
        </div>
    </div>
    
    <!-- 成功模态框 -->
    <div id="successModal" class="modal hidden">
        <div class="modal-content">
            <div class="success-header">
                <svg class="success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 11l3 3L22 4"/>
                </svg>
                <h3>生成成功</h3>
            </div>
            <div class="success-body">
                <p id="successMessage">图种文件已成功保存！</p>
                <p class="success-path" id="successPath"></p>
            </div>
            <div class="success-footer">
                <button id="openLocationBtn" class="primary-btn">打开位置</button>
                <button id="closeSuccessBtn" class="secondary-btn">关闭</button>
            </div>
        </div>
    </div>
`;

document.getElementById('logo').src = logo;

// 生成功能相关元素
let selectImageBtn = document.getElementById("selectImageBtn");
let selectFileBtn = document.getElementById("selectFileBtn");
let selectFolderBtn = document.getElementById("selectFolderBtn");
let outputInput = document.getElementById("outputName");
let generateBtn = document.getElementById("generateBtn");
let resultDiv = document.getElementById("result");
let imageResult = document.getElementById("imageResult");
let targetResult = document.getElementById("targetResult");
let miniPreviewContainer = document.getElementById("miniPreviewContainer");
let miniPreviewImage = document.getElementById("miniPreviewImage");
let miniPreviewLoading = document.querySelector(".mini-preview-loading");

// 解析功能相关元素
let selectTuzhongBtn = document.getElementById("selectTuzhongBtn");
let analyzeBtn = document.getElementById("analyzeBtn");
let extractBtn = document.getElementById("extractBtn");
let tuzhongResult = document.getElementById("tuzhongResult");
let tuzhongInfo = document.getElementById("tuzhongInfo");
let extractResultDiv = document.getElementById("extractResult");
let tuzhongMiniPreviewContainer = document.getElementById("tuzhongMiniPreviewContainer");
let tuzhongMiniPreviewImage = document.getElementById("tuzhongMiniPreviewImage");
let tuzhongMiniPreviewLoading = document.querySelector("#tuzhongMiniPreviewContainer .mini-preview-loading");

// 标签页相关元素
let createTab = document.getElementById("createTab");
let extractTab = document.getElementById("extractTab");
let createPanel = document.getElementById("createPanel");
let extractPanel = document.getElementById("extractPanel");

// 进度条相关元素
let progressModal = document.getElementById("progressModal");
let progressText = document.getElementById("progressText");
let progressBar = document.getElementById("progressBar");
let progressPercentage = document.getElementById("progressPercentage");
let cancelProgressBtn = document.getElementById("cancelProgressBtn");

// 成功模态框相关元素
let successModal = document.getElementById("successModal");
let successMessage = document.getElementById("successMessage");
let successPath = document.getElementById("successPath");
let openLocationBtn = document.getElementById("openLocationBtn");
let closeSuccessBtn = document.getElementById("closeSuccessBtn");

let selectedImagePath = "";
let selectedTargetPath = "";
let selectedTuzhongPath = "";
let currentSavePath = "";
let currentTuzhongInfo = null;

// 标签页切换功能
createTab.addEventListener('click', function() {
    switchTab('create');
});

extractTab.addEventListener('click', function() {
    switchTab('extract');
});

function switchTab(tabName) {
    // 移除所有活动状态
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    // 激活选中的标签
    if (tabName === 'create') {
        createTab.classList.add('active');
        createPanel.classList.add('active');
    } else if (tabName === 'extract') {
        extractTab.classList.add('active');
        extractPanel.classList.add('active');
    }
    
    // 清除结果信息
    showResult("", "");
    showExtractResult("", "");
}

// 处理图片文件选择
selectImageBtn.addEventListener('click', function() {
    SelectImageFile()
        .then((filePath) => {
            if (filePath) {
                console.log("选择的图片路径:", filePath);
                selectedImagePath = filePath;
                const fileName = filePath.split('\\').pop().split('/').pop();
                const fileNameSpan = imageResult.querySelector('.file-name');
                fileNameSpan.textContent = `已选择: ${fileName}`;
                imageResult.className = "file-result success";
                
                // 显示小图预览
                showMiniPreview(filePath);
            }
        })
        .catch((err) => {
            console.error("选择图片失败:", err);
            showResult("选择图片失败: " + err, "error");
        });
});

// 处理文件选择
selectFileBtn.addEventListener('click', function() {
    SelectFile()
        .then((filePath) => {
            if (filePath) {
                selectedTargetPath = filePath;
                const fileName = filePath.split('\\').pop().split('/').pop();
                const fileNameSpan = targetResult.querySelector('.file-name');
                fileNameSpan.textContent = `已选择文件: ${fileName}`;
                targetResult.className = "file-result success";
            }
        })
        .catch((err) => {
            console.error("选择文件失败:", err);
        });
});

// 处理文件夹选择
selectFolderBtn.addEventListener('click', function() {
    SelectFolder()
        .then((folderPath) => {
            if (folderPath) {
                selectedTargetPath = folderPath;
                const folderName = folderPath.split('\\').pop().split('/').pop();
                const fileNameSpan = targetResult.querySelector('.file-name');
                fileNameSpan.textContent = `已选择文件夹: ${folderName}`;
                targetResult.className = "file-result success";
            }
        })
        .catch((err) => {
            console.error("选择文件夹失败:", err);
        });
});

// 处理图种文件选择
selectTuzhongBtn.addEventListener('click', function() {
    SelectTuzhongFile()
        .then((filePath) => {
            if (filePath) {
                console.log("选择的图种文件路径:", filePath);
                selectedTuzhongPath = filePath;
                const fileName = filePath.split('\\').pop().split('/').pop();
                const fileNameSpan = tuzhongResult.querySelector('.file-name');
                fileNameSpan.textContent = `已选择: ${fileName}`;
                tuzhongResult.className = "file-result success";
                
                // 显示图种预览
                showTuzhongMiniPreview(filePath);
                
                // 重置信息显示
                tuzhongInfo.classList.add("hidden");
                extractBtn.disabled = true;
                extractBtn.classList.add("secondary");
            }
        })
        .catch((err) => {
            console.error("选择图种文件失败:", err);
            showExtractResult("选择图种文件失败: " + err, "error");
        });
});

// 处理图种分析
analyzeBtn.addEventListener('click', function() {
    if (!selectedTuzhongPath) {
        showExtractResult("请先选择图种文件", "error");
        return;
    }
    
    setAnalyzeButtonLoading(true);
    showExtractResult("", "");
    
    AnalyzeTuzhong(selectedTuzhongPath)
        .then(info => {
            currentTuzhongInfo = info;
            if (info && info.isValid) {
                updateTuzhongInfo(info);
                tuzhongInfo.classList.remove("hidden");
                extractBtn.disabled = false;
                extractBtn.classList.remove("secondary");
            } else {
                // 如果后端返回 isValid: false，说明不是有效的图种
                showExtractResult(info.errorMessage || "解析失败：这不是一个有效的图种文件。", "error");
                tuzhongInfo.classList.add("hidden");
                extractBtn.disabled = true;
                extractBtn.classList.add("secondary");
            }
        })
        .catch(err => {
            // 捕获其他意外错误
            showExtractResult("分析失败: " + err, "error");
            tuzhongInfo.classList.add("hidden");
            extractBtn.disabled = true;
            extractBtn.classList.add("secondary");
        })
        .finally(() => {
            setAnalyzeButtonLoading(false);
        });
});

// 处理提取按钮点击
extractBtn.addEventListener('click', function() {
    if (!selectedTuzhongPath || !currentTuzhongInfo || !currentTuzhongInfo.isValid) {
        showExtractResult("请先分析图种文件", "error");
        return;
    }
    
    // 从图种文件路径中提取源文件名作为默认文件夹名
    const tuzhongFileName = selectedTuzhongPath.split('\\').pop().split('/').pop();
    const baseName = tuzhongFileName.substring(0, tuzhongFileName.lastIndexOf('.')) || tuzhongFileName;
    const suggestedFolderName = baseName + '_extracted';
    
    // 让用户选择提取位置，使用源文件名作为建议的文件夹名
    SelectExtractLocation(suggestedFolderName)
        .then((extractPath) => {
            if (extractPath) {
                // 显示进度条模态框
                showProgressModal();
                
                return ExtractFromTuzhong(selectedTuzhongPath, extractPath)
                    .then(() => {
                        currentSavePath = extractPath;
                    });
            } else {
                showExtractResult("已取消提取", "info");
                return Promise.reject("用户取消");
            }
        })
        .catch((err) => {
            if (err !== "用户取消") {
                hideProgressModal();
                showExtractResult(`提取失败: ${err}`, "error");
            }
        });
});

// 处理生成按钮点击事件
generateBtn.addEventListener('click', function() {
    const outputName = outputInput.value.trim();
    
    if (!selectedImagePath) {
        showResult("请选择封面图片", "error");
        return;
    }
    
    if (!selectedTargetPath) {
        showResult("请选择要隐藏的文件或文件夹", "error");
        return;
    }
    
    if (!outputName) {
        showResult("请输入输出文件名", "error");
        return;
    }
    
    // 让用户选择保存位置
    SelectSaveLocation(outputName)
        .then((savePath) => {
            if (savePath) {
                currentSavePath = savePath;
                
                // 显示进度条模态框
                showProgressModal();
                
                return MergeFiles(selectedImagePath, selectedTargetPath, savePath);
            } else {
                showResult("已取消保存", "info");
                return Promise.reject("用户取消");
            }
        })
        .then((result) => {
            // 不在这里处理成功，因为进度事件会处理
        })
        .catch((err) => {
            if (err !== "用户取消") {
                hideProgressModal();
                showResult(`生成失败: ${err}`, "error");
            }
        });
});

function setButtonLoading(loading) {
    if (loading) {
        generateBtn.classList.add('loading');
        generateBtn.disabled = true;
    } else {
        generateBtn.classList.remove('loading');
        generateBtn.disabled = false;
    }
}

function showResult(message, type) {
    resultDiv.textContent = message;
    resultDiv.className = `result ${type}`;
    
    // 如果是错误信息，添加点击清除功能
    if (type === "error" && message) {
        resultDiv.style.cursor = "pointer";
        resultDiv.title = "点击清除错误信息";
        resultDiv.onclick = function() {
            showResult("", "");
            resultDiv.onclick = null;
            resultDiv.style.cursor = "default";
            resultDiv.title = "";
        };
        
        // 5秒后自动清除错误信息
        setTimeout(() => {
            if (resultDiv.className.includes("error")) {
                showResult("", "");
                resultDiv.onclick = null;
                resultDiv.style.cursor = "default";
                resultDiv.title = "";
            }
        }, 5000);
    } else {
        resultDiv.style.cursor = "default";
        resultDiv.title = "";
        resultDiv.onclick = null;
    }
}

// 清除图片选择
function clearImageSelection() {
    selectedImagePath = "";
    const fileNameSpan = imageResult.querySelector('.file-name');
    fileNameSpan.textContent = "";
    imageResult.className = "file-result";
    hideMiniPreview();
    // 确保清除所有错误信息
    showResult("", "");
}

// 清除目标文件/文件夹选择
function clearTargetSelection() {
    selectedTargetPath = "";
    const fileNameSpan = targetResult.querySelector('.file-name');
    fileNameSpan.textContent = "";
    targetResult.className = "file-result";
    showResult("", "");
}

// 显示小图预览
function showMiniPreview(imagePath) {
    console.log("开始加载图片预览:", imagePath);
    
    // 清除之前可能存在的错误信息
    showResult("", "");
    
    // 显示预览容器和加载状态
    miniPreviewContainer.classList.remove("hidden");
    miniPreviewLoading.style.display = "block";
    miniPreviewImage.style.display = "none";
    
    // 清除之前的事件监听器，避免重复触发
    miniPreviewImage.onload = null;
    miniPreviewImage.onerror = null;
    
    // 获取图片的 base64 数据
    GetImageBase64(imagePath)
        .then((base64Data) => {
            console.log("成功获取图片base64数据，长度:", base64Data.length);
            
            // 设置事件监听器
            miniPreviewImage.onload = function() {
                console.log("图片加载成功");
                miniPreviewLoading.style.display = "none";
                miniPreviewImage.style.display = "block";
                // 清除可能的错误信息
                showResult("", "");
            };
            
            miniPreviewImage.onerror = function() {
                console.error("图片渲染失败，可能的原因：base64格式错误或浏览器不支持该格式");
                miniPreviewLoading.style.display = "none";
                showPreviewError("图片显示失败");
            };
            
            // 设置图片源
            miniPreviewImage.src = base64Data;
        })
        .catch((err) => {
            console.error("获取图片预览失败:", err);
            miniPreviewLoading.style.display = "none";
            showPreviewError("预览失败: " + err);
        });
}

// 显示预览错误信息
function showPreviewError(message) {
    miniPreviewContainer.innerHTML = `
        <div class="preview-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
        </div>
    `;
    
    // 不在结果区域显示错误信息，只在控制台记录
    console.warn("预览错误:", message);
    
    // 3秒后隐藏预览容器
    setTimeout(() => {
        hideMiniPreview();
    }, 3000);
}

// 隐藏小图预览
function hideMiniPreview() {
    miniPreviewContainer.classList.add("hidden");
    
    // 重置容器内容，移除可能的错误状态
    miniPreviewContainer.innerHTML = `
        <img id="miniPreviewImage" class="mini-preview-image" src="" alt="预览"/>
        <div class="mini-preview-loading">
            <div class="mini-loading-spinner"></div>
        </div>
    `;
    
    // 重新获取元素引用
    miniPreviewImage = document.getElementById("miniPreviewImage");
    miniPreviewLoading = document.querySelector(".mini-preview-loading");
    
    // 清除结果区域的错误信息
    showResult("", "");
}

// 将函数添加到全局作用域，以便HTML onclick可以调用
window.clearImageSelection = clearImageSelection;
window.clearTargetSelection = clearTargetSelection;
window.clearTuzhongSelection = clearTuzhongSelection;

// 显示图种预览
function showTuzhongMiniPreview(imagePath) {
    console.log("开始加载图种预览:", imagePath);
    
    // 显示预览容器和加载状态
    tuzhongMiniPreviewContainer.classList.remove("hidden");
    tuzhongMiniPreviewLoading.style.display = "block";
    tuzhongMiniPreviewImage.style.display = "none";
    
    // 清除之前的事件监听器
    tuzhongMiniPreviewImage.onload = null;
    tuzhongMiniPreviewImage.onerror = null;
    
    // 获取图片的 base64 数据
    GetImageBase64(imagePath)
        .then((base64Data) => {
            console.log("成功获取图种base64数据，长度:", base64Data.length);
            
            // 设置事件监听器
            tuzhongMiniPreviewImage.onload = function() {
                console.log("图种预览加载成功");
                tuzhongMiniPreviewLoading.style.display = "none";
                tuzhongMiniPreviewImage.style.display = "block";
            };
            
            tuzhongMiniPreviewImage.onerror = function() {
                console.error("图种预览渲染失败");
                tuzhongMiniPreviewLoading.style.display = "none";
                showTuzhongPreviewError("预览失败");
            };
            
            // 设置图片源
            tuzhongMiniPreviewImage.src = base64Data;
        })
        .catch((err) => {
            console.error("获取图种预览失败:", err);
            tuzhongMiniPreviewLoading.style.display = "none";
            showTuzhongPreviewError("预览失败: " + err);
        });
}

// 显示图种预览错误
function showTuzhongPreviewError(message) {
    tuzhongMiniPreviewContainer.innerHTML = `
        <div class="preview-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
        </div>
    `;
    console.warn("图种预览错误:", message);
    setTimeout(() => {
        hideTuzhongMiniPreview();
    }, 3000);
}

// 隐藏图种预览
function hideTuzhongMiniPreview() {
    tuzhongMiniPreviewContainer.classList.add("hidden");
    tuzhongMiniPreviewContainer.innerHTML = `
        <img id="tuzhongMiniPreviewImage" class="mini-preview-image" src="" alt="预览"/>
        <div class="mini-preview-loading">
            <div class="mini-loading-spinner"></div>
        </div>
    `;
    tuzhongMiniPreviewImage = document.getElementById("tuzhongMiniPreviewImage");
    tuzhongMiniPreviewLoading = document.querySelector("#tuzhongMiniPreviewContainer .mini-preview-loading");
}

// 清除图种选择
function clearTuzhongSelection() {
    selectedTuzhongPath = "";
    const fileNameSpan = tuzhongResult.querySelector('.file-name');
    fileNameSpan.textContent = "";
    tuzhongResult.className = "file-result";
    hideTuzhongMiniPreview();
    tuzhongInfo.classList.add("hidden");
    extractBtn.disabled = true;
    extractBtn.classList.add("secondary");
    showExtractResult("", "");
}

// 显示图种信息
function displayTuzhongInfo(info) {
    if (!info.isValid) {
        tuzhongInfo.classList.add("hidden");
        return;
    }
    
    // 显示基本信息
    document.getElementById("totalSizeInfo").textContent = formatFileSize(info.totalSize);
    document.getElementById("imageSizeInfo").textContent = formatFileSize(info.imageSize);
    document.getElementById("hiddenSizeInfo").textContent = formatFileSize(info.hiddenSize);
    document.getElementById("imageFormatInfo").textContent = info.imageFormat;
    
    // 显示文件列表 - 优化DOM操作减少重绘
    const filesList = document.getElementById("hiddenFilesList");
    if (info.hiddenFiles && info.hiddenFiles.length > 0) {
        // 使用DocumentFragment减少重排
        const fragment = document.createDocumentFragment();
        filesList.innerHTML = '';
        
        info.hiddenFiles.forEach(fileName => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <span>${fileName}</span>
            `;
            fragment.appendChild(fileItem);
        });
        
        // 一次性添加所有元素，减少重排
        filesList.appendChild(fragment);
    } else {
        filesList.innerHTML = '<span class="no-files">没有找到文件</span>';
    }
    
    tuzhongInfo.classList.remove("hidden");
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 设置分析按钮加载状态
function setAnalyzeButtonLoading(loading) {
    if (loading) {
        analyzeBtn.classList.add('loading');
        analyzeBtn.disabled = true;
    } else {
        analyzeBtn.classList.remove('loading');
        analyzeBtn.disabled = false;
    }
}

// 显示提取结果
function showExtractResult(message, type) {
    extractResultDiv.textContent = message;
    extractResultDiv.className = `result ${type}`;
    
    if (type === "error" && message) {
        extractResultDiv.style.cursor = "pointer";
        extractResultDiv.title = "点击清除错误信息";
        extractResultDiv.onclick = function() {
            showExtractResult("", "");
            extractResultDiv.onclick = null;
            extractResultDiv.style.cursor = "default";
            extractResultDiv.title = "";
        };
        
        setTimeout(() => {
            if (extractResultDiv.className.includes("error")) {
                showExtractResult("", "");
                extractResultDiv.onclick = null;
                extractResultDiv.style.cursor = "default";
                extractResultDiv.title = "";
            }
        }, 5000);
    } else {
        extractResultDiv.style.cursor = "default";
        extractResultDiv.title = "";
        extractResultDiv.onclick = null;
    }
}

// 进度更新节流变量
let lastProgressUpdate = 0;
let progressUpdateDelay = 100; // 100ms 节流

// 监听后端进度事件
EventsOn("progress", function(data) {
    // 节流进度更新，减少UI跳动
    const now = Date.now();
    if (data.step === "complete" || now - lastProgressUpdate >= progressUpdateDelay) {
        updateProgress(data.percent, data.message);
        lastProgressUpdate = now;
    }
    
    if (data.step === "complete") {
        setTimeout(() => {
            hideProgressModal();
            showSuccessModal(currentSavePath);
        }, 500); // 显示100%一会儿后隐藏
    }
});

// 进度条相关函数 - 防止布局跳动
function showProgressModal() {
    // 使用 requestAnimationFrame 确保平滑显示
    requestAnimationFrame(() => {
        progressModal.style.display = 'flex'; // 先设置display
        // 在下一帧移除hidden类，确保动画效果
        requestAnimationFrame(() => {
            progressModal.classList.remove("hidden");
        });
    });
    updateProgress(0, "准备开始...");
    lastProgressUpdate = 0; // 重置节流计时器
}

function hideProgressModal() {
    // 先添加hidden类触发动画
    progressModal.classList.add("hidden");
    // 等待动画完成后设置display: none
    setTimeout(() => {
        if (progressModal.classList.contains("hidden")) {
            progressModal.style.display = 'none';
        }
    }, 300); // 等待CSS过渡完成
}

function updateProgress(percent, message) {
    // 使用 requestAnimationFrame 优化动画性能
    requestAnimationFrame(() => {
        progressText.textContent = message;
        progressBar.style.width = percent + "%";
        progressPercentage.textContent = Math.round(percent) + "%";
    });
}

// 成功模态框相关函数 - 防止布局跳动
function showSuccessModal(filePath) {
    const fileName = filePath.split('\\').pop().split('/').pop();
    successMessage.textContent = "图种文件已成功保存！";
    successPath.textContent = filePath;
    
    // 使用 requestAnimationFrame 确保平滑显示
    requestAnimationFrame(() => {
        successModal.style.display = 'flex'; // 先设置display
        // 在下一帧移除hidden类，确保动画效果
        requestAnimationFrame(() => {
            successModal.classList.remove("hidden");
        });
    });
}

function hideSuccessModal() {
    // 先添加hidden类触发动画
    successModal.classList.add("hidden");
    // 等待动画完成后设置display: none
    setTimeout(() => {
        if (successModal.classList.contains("hidden")) {
            successModal.style.display = 'none';
        }
    }, 300); // 等待CSS过渡完成
}

// 模态框事件处理
cancelProgressBtn.addEventListener('click', function() {
    hideProgressModal();
    showResult("用户取消了操作", "info");
});

closeSuccessBtn.addEventListener('click', function() {
    hideSuccessModal();
});

openLocationBtn.addEventListener('click', function() {
    if (currentSavePath) {
        OpenFileLocation(currentSavePath)
            .catch((err) => {
                console.error("打开文件位置失败:", err);
            });
    }
    hideSuccessModal();
});
