import './style.css';
import './app.css';

import logo from './assets/images/logo-universal.png';
import {MergeFiles, SelectImageFile, SelectZipFile, SelectSaveLocation} from '../wailsjs/go/main/App';

document.querySelector('#app').innerHTML = `
    <div class="container">
        <img id="logo" class="logo" />
        <h1>图种生成器</h1>
        <div class="form-group">
            <label>封面图片：</label>
            <button id="selectImageBtn" class="file-btn">选择图片</button>
            <div id="imageResult" class="file-result"></div>
        </div>
        <div class="form-group">
            <label>压缩包：</label>
            <button id="selectZipBtn" class="file-btn">选择压缩包</button>
            <div id="zipResult" class="file-result"></div>
        </div>
        <div class="form-group">
            <label for="outputName">输出文件名：</label>
            <input type="text" id="outputName" placeholder="例如: output.jpg" />
        </div>
        <button id="generateBtn" class="btn">生成图种</button>
        <div id="result" class="result"></div>
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
                imageResult.textContent = `已选择: ${fileName}`;
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
                zipResult.textContent = `已选择: ${fileName}`;
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
                generateBtn.disabled = true;
                
                return MergeFiles(selectedImagePath, selectedZipPath, savePath);
            } else {
                showResult("已取消保存", "info");
                return Promise.reject("用户取消");
            }
        })
        .then((result) => {
            showResult(result, "success");
            generateBtn.disabled = false;
        })
        .catch((err) => {
            if (err !== "用户取消") {
                showResult(`生成失败: ${err}`, "error");
            }
            generateBtn.disabled = false;
        });
});

function showResult(message, type) {
    resultDiv.textContent = message;
    resultDiv.className = `result ${type}`;
}
