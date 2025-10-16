import './style.css';
import './app.css';

import logo from './assets/images/logo-universal.png';
import {MergeFiles, SelectImageFile, SelectFile, SelectFolder, SelectSaveLocation, OpenFileLocation, GetImageBase64} from '../wailsjs/go/main/App';
import {EventsOn} from '../wailsjs/runtime/runtime';

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
let currentSavePath = "";

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

// 监听后端进度事件
EventsOn("progress", function(data) {
    updateProgress(data.percent, data.message);
    
    if (data.step === "complete") {
        setTimeout(() => {
            hideProgressModal();
            showSuccessModal(currentSavePath);
        }, 500); // 显示100%一会儿后隐藏
    }
});

// 进度条相关函数
function showProgressModal() {
    progressModal.classList.remove("hidden");
    updateProgress(0, "准备开始...");
}

function hideProgressModal() {
    progressModal.classList.add("hidden");
}

function updateProgress(percent, message) {
    progressText.textContent = message;
    progressBar.style.width = percent + "%";
    progressPercentage.textContent = Math.round(percent) + "%";
}

// 成功模态框相关函数
function showSuccessModal(filePath) {
    const fileName = filePath.split('\\').pop().split('/').pop();
    successMessage.textContent = "图种文件已成功保存！";
    successPath.textContent = filePath;
    successModal.classList.remove("hidden");
}

function hideSuccessModal() {
    successModal.classList.add("hidden");
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
