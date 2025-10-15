import './style.css';
import './app.css';

import logo from './assets/images/logo-universal.png';
import {MergeFiles, SelectImageFile, SelectZipFile, SelectSaveLocation} from '../wailsjs/go/main/App';

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
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            <span>选择图片文件</span>
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
                            <path d="M12.5 2C17 2 20.5 5.5 20.5 10v5.5l-3-3h-5C8 12.5 4.5 9 4.5 4.5S8 2 12.5 2z"/>
                            <path d="M8 21l4-7 4 7H8z"/>
                        </svg>
                        <span>压缩包文件</span>
                    </div>
                    <div class="file-input-container">
                        <button id="selectZipBtn" class="file-btn">
                            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7,10 12,15 17,10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            <span>选择压缩包</span>
                        </button>
                        <div id="zipResult" class="file-result">
                            <span class="file-name"></span>
                            <button class="clear-btn" onclick="clearZipSelection()">
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
`;

document.getElementById('logo').src = logo;

let selectImageBtn = document.getElementById("selectImageBtn");
let selectZipBtn = document.getElementById("selectZipBtn");
let outputInput = document.getElementById("outputName");
let generateBtn = document.getElementById("generateBtn");
let resultDiv = document.getElementById("result");
let imageResult = document.getElementById("imageResult");
let zipResult = document.getElementById("zipResult");

let selectedImagePath = "";
let selectedZipPath = "";

// 处理图片文件选择
selectImageBtn.addEventListener('click', function() {
    SelectImageFile()
        .then((filePath) => {
            if (filePath) {
                selectedImagePath = filePath;
                const fileName = filePath.split('\\').pop().split('/').pop();
                const fileNameSpan = imageResult.querySelector('.file-name');
                fileNameSpan.textContent = `已选择: ${fileName}`;
                imageResult.className = "file-result success";
            }
        })
        .catch((err) => {
            console.error("选择图片失败:", err);
        });
});

// 处理压缩包文件选择
selectZipBtn.addEventListener('click', function() {
    SelectZipFile()
        .then((filePath) => {
            if (filePath) {
                selectedZipPath = filePath;
                const fileName = filePath.split('\\').pop().split('/').pop();
                const fileNameSpan = zipResult.querySelector('.file-name');
                fileNameSpan.textContent = `已选择: ${fileName}`;
                zipResult.className = "file-result success";
            }
        })
        .catch((err) => {
            console.error("选择压缩包失败:", err);
        });
});

// 处理生成按钮点击事件
generateBtn.addEventListener('click', function() {
    const outputName = outputInput.value.trim();
    
    if (!selectedImagePath) {
        showResult("请选择封面图片", "error");
        return;
    }
    
    if (!selectedZipPath) {
        showResult("请选择压缩包", "error");
        return;
    }
    
    if (!outputName) {
        showResult("请输入输出文件名", "error");
        return;
    }
    
    showResult("请选择保存位置...", "info");
    
    // 让用户选择保存位置
    SelectSaveLocation(outputName)
        .then((savePath) => {
            if (savePath) {
                showResult("正在生成图种...", "info");
                setButtonLoading(true);
                
                return MergeFiles(selectedImagePath, selectedZipPath, savePath);
            } else {
                showResult("已取消保存", "info");
                return Promise.reject("用户取消");
            }
        })
        .then((result) => {
            showResult(result, "success");
            setButtonLoading(false);
        })
        .catch((err) => {
            if (err !== "用户取消") {
                showResult(`生成失败: ${err}`, "error");
            }
            setButtonLoading(false);
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
}

// 清除图片选择
function clearImageSelection() {
    selectedImagePath = "";
    const fileNameSpan = imageResult.querySelector('.file-name');
    fileNameSpan.textContent = "";
    imageResult.className = "file-result";
    showResult("", "");
}

// 清除压缩包选择
function clearZipSelection() {
    selectedZipPath = "";
    const fileNameSpan = zipResult.querySelector('.file-name');
    fileNameSpan.textContent = "";
    zipResult.className = "file-result";
    showResult("", "");
}

// 将函数添加到全局作用域，以便HTML onclick可以调用
window.clearImageSelection = clearImageSelection;
window.clearZipSelection = clearZipSelection;
