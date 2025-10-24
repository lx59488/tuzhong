// import './style.css';
import './app.css';
import './tabs.css';
import './performance.js'; // 导入性能优化工具

import logo from './assets/images/logo-universal.png';
import {MergeFiles, SelectImageFile, SelectFolder, SelectSaveLocation, OpenFileLocation, GetImageBase64, GetTuzhongImageBase64, SelectTuzhongFile, AnalyzeTuzhong, ExtractFromTuzhong, ExtractFromTuzhongWithInfo, SelectExtractLocation, SelectFile, GetConfig, UpdateFileSizeLimits, DisableFileSizeCheck, EnableFileSizeCheck, RemoveAllSizeLimits, SetMaxImageSize, SetMaxZipSize, SetMaxGeneralFileSize, SetUnlimitedImageSize, SetImageSizeLimit1GB, SetImageSizeLimit2GB, SetImageSizeLimit5GB} from '../wailsjs/go/main/App';
import {EventsOn, OnFileDrop, WindowSetDarkTheme, WindowSetLightTheme} from '../wailsjs/runtime/runtime';

// 临时解决方案：在控制台提供快速修复命令
window.fixImageSizeLimit = async () => {
    try {
        console.log('正在禁用文件大小检查...');
        await DisableFileSizeCheck();
        console.log('✅ 文件大小检查已禁用，现在可以处理任意大小的图片');
        return '文件大小检查已禁用';
    } catch (error) {
        console.error('❌ 禁用文件大小检查失败:', error);
        return '禁用失败: ' + error;
    }
};

window.setImageLimit1GB = async () => {
    try {
        await SetImageSizeLimit1GB();
        console.log('✅ 图片大小限制已设置为1GB');
        return '图片大小限制已设置为1GB';
    } catch (error) {
        console.error('❌ 设置失败:', error);
        return '设置失败: ' + error;
    }
};

window.setImageLimit2GB = async () => {
    try {
        await SetImageSizeLimit2GB();
        console.log('✅ 图片大小限制已设置为2GB');
        return '图片大小限制已设置为2GB';
    } catch (error) {
        console.error('❌ 设置失败:', error);
        return '设置失败: ' + error;
    }
};

window.checkCurrentConfig = async () => {
    try {
        const config = await GetConfig();
        console.log('当前配置:', config);
        console.log(`图片大小限制: ${config.fileSizeLimits.maxImageSize / (1024*1024)} MB`);
        console.log(`大小检查启用: ${config.fileSizeLimits.enableSizeCheck}`);
        return config;
    } catch (error) {
        console.error('❌ 获取配置失败:', error);
        return null;
    }
};

// 初始化错误处理
window.addEventListener('DOMContentLoaded', () => {
    // 注册特定错误处理器
    if (window.ErrorManager) {
        // 文件处理错误的专门处理
        window.ErrorManager.registerHandler(window.ErrorCodes.FILE_NOT_FOUND, (error) => {
            window.ErrorManager.displayer.showError(error, {
                duration: 5000,
                showDetails: false
            });
        });

        // 文件过大错误的专门处理
        window.ErrorManager.registerHandler(window.ErrorCodes.FILE_TOO_LARGE, (error) => {
            window.ErrorManager.displayer.showError(error, {
                duration: 8000,
                showDetails: true
            });
        });

        // ZIP文件错误的专门处理
        window.ErrorManager.registerHandler(window.ErrorCodes.ZIP_INVALID, (error) => {
            window.ErrorManager.displayer.showError(error, {
                duration: 6000,
                showDetails: true
            });
        });
    }
});

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
            <div class="header-main">
                <div class="logo-container">
                    <img id="logo" class="logo" />
                    <div class="logo-glow"></div>
                </div>
                <h1 class="title">
                    <span class="title-text">图种生成器</span>
                    <span class="title-subtitle">Image Seed Generator</span>
                </h1>
            </div>
            <button id="themeToggle" class="theme-toggle-btn" aria-label="切换主题">
                <svg class="theme-icon theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/>
                    <line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/>
                    <line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
                <svg class="theme-icon theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z"/>
                </svg>
                <span class="theme-toggle-text">浅色模式</span>
            </button>
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
                <button id="settingsTab" class="tab-btn">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>设置</span>
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
                    <div class="file-input-container drop-target" data-drop-target="image">
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
                    <div class="file-input-container drop-target" data-drop-target="target">
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
                        <div class="file-input-container drop-target" data-drop-target="tuzhong">
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
            
            <!-- 设置面板 -->
            <div id="settingsPanel" class="tab-panel">
                <div class="settings-section">
                    <h2 class="settings-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        文件大小限制设置
                    </h2>
                    
                    <div class="settings-form">
                        <!-- 启用/禁用文件大小检查 -->
                        <div class="form-group">
                            <div class="setting-item">
                                <div class="setting-label">
                                    <label for="enableSizeCheck">启用文件大小检查</label>
                                    <p class="setting-description">禁用后将不限制文件大小（谨慎使用）</p>
                                </div>
                                <div class="setting-control">
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="enableSizeCheck" checked>
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 图片文件大小限制 -->
                        <div class="form-group" id="imageSizeGroup">
                            <div class="setting-item">
                                <div class="setting-label">
                                    <label for="maxImageSize">最大图片文件大小</label>
                                    <p class="setting-description">单个图片文件的最大允许大小</p>
                                </div>
                                <div class="setting-control">
                                    <div class="size-input-group">
                                        <input type="number" id="maxImageSize" value="200" min="1" max="10240">
                                        <select id="imageSizeUnit">
                                            <option value="MB" selected>MB</option>
                                            <option value="GB">GB</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- ZIP文件大小限制 -->
                        <div class="form-group" id="zipSizeGroup">
                            <div class="setting-item">
                                <div class="setting-label">
                                    <label for="maxZipSize">最大ZIP文件大小</label>
                                    <p class="setting-description">压缩文件的最大允许大小</p>
                                </div>
                                <div class="setting-control">
                                    <div class="size-input-group">
                                        <input type="number" id="maxZipSize" value="2" min="1" max="100">
                                        <select id="zipSizeUnit">
                                            <option value="GB" selected>GB</option>
                                            <option value="MB">MB</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 一般文件大小限制 -->
                        <div class="form-group" id="generalFileSizeGroup">
                            <div class="setting-item">
                                <div class="setting-label">
                                    <label for="maxGeneralFileSize">最大一般文件大小</label>
                                    <p class="setting-description">其他文件的最大允许大小</p>
                                </div>
                                <div class="setting-control">
                                    <div class="size-input-group">
                                        <input type="number" id="maxGeneralFileSize" value="10" min="1" max="100">
                                        <select id="generalFileSizeUnit">
                                            <option value="GB" selected>GB</option>
                                            <option value="MB">MB</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 快速设置按钮 -->
                        <div class="form-group">
                            <div class="quick-settings">
                                <h4>快速设置</h4>
                                <div class="quick-buttons">
                                    <button id="removeAllLimitsBtn" class="quick-btn danger">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                        </svg>
                                        移除所有限制
                                    </button>
                                    <button id="setConservativeLimitsBtn" class="quick-btn">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M9 12l2 2 4-4"/>
                                            <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                            <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                        </svg>
                                        保守设置
                                    </button>
                                    <button id="setLiberalLimitsBtn" class="quick-btn">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"/>
                                        </svg>
                                        宽松设置
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 性能监控部分 -->
                        <div class="form-group">
                            <div class="settings-section">
                                <h4>性能监控</h4>
                                <div id="performanceMonitor" class="performance-monitor">
                                    <div class="performance-stats">
                                        <div class="stat-item">
                                            <label>内存使用率:</label>
                                            <span id="memoryUsage" class="stat-value">--</span>
                                        </div>
                                        <div class="stat-item">
                                            <label>会话时长:</label>
                                            <span id="sessionDuration" class="stat-value">--</span>
                                        </div>
                                        <div class="stat-item">
                                            <label>操作数量:</label>
                                            <span id="operationCount" class="stat-value">--</span>
                                        </div>
                                        <div class="stat-item">
                                            <label>平均操作时间:</label>
                                            <span id="avgOperationTime" class="stat-value">--</span>
                                        </div>
                                    </div>
                                    <div class="performance-actions">
                                        <button id="refreshPerformanceBtn" class="quick-btn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <polyline points="1,4 1,10 7,10"/>
                                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                                            </svg>
                                            刷新数据
                                        </button>
                                        <button id="clearPerformanceBtn" class="quick-btn danger">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <polyline points="3,6 5,6 21,6"/>
                                                <path d="M19,6v14a2,2 0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                                            </svg>
                                            清除数据
                                        </button>
                                        <button id="exportPerformanceBtn" class="quick-btn">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                <polyline points="7,10 12,15 17,10"/>
                                                <line x1="12" y1="15" x2="12" y2="3"/>
                                            </svg>
                                            导出报告
                                        </button>
                                    </div>
                                    <div id="memoryWarning" class="memory-warning hidden">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                            <line x1="12" y1="9" x2="12" y2="13"/>
                                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                                        </svg>
                                        <span>内存使用率过高，建议优化</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 保存按钮 -->
                        <div class="form-group">
                            <div class="action-section">
                                <button id="saveSettingsBtn" class="generate-btn">
                                    <span class="btn-text">保存设置</span>
                                    <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                    </svg>
                                    <div class="btn-loading">
                                        <div class="spinner"></div>
                                    </div>
                                </button>
                                <button id="resetSettingsBtn" class="generate-btn secondary">
                                    <span class="btn-text">重置为默认</span>
                                    <svg class="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <polyline points="1,4 1,10 7,10"/>
                                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                                    </svg>
                                    <div class="btn-loading">
                                        <div class="spinner"></div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
                <div class="progress-stage" id="progressStage">准备开始...</div>
                <div class="progress-steps" id="progressStepsCreate">
                    <div class="progress-step active" data-step="start">
                        <div class="step-circle">1</div>
                        <span class="step-label">准备</span>
                    </div>
                    <div class="progress-step" data-step="compress">
                        <div class="step-circle">2</div>
                        <span class="step-label">压缩</span>
                    </div>
                    <div class="progress-step" data-step="merge">
                        <div class="step-circle">3</div>
                        <span class="step-label">合并</span>
                    </div>
                    <div class="progress-step" data-step="complete">
                        <div class="step-circle">4</div>
                        <span class="step-label">完成</span>
                    </div>
                </div>
                <div class="progress-steps hidden" id="progressStepsExtract">
                    <div class="progress-step active" data-step="start">
                        <div class="step-circle">1</div>
                        <span class="step-label">准备</span>
                    </div>
                    <div class="progress-step" data-step="analyze">
                        <div class="step-circle">2</div>
                        <span class="step-label">解析</span>
                    </div>
                    <div class="progress-step" data-step="extract">
                        <div class="step-circle">3</div>
                        <span class="step-label">提取</span>
                    </div>
                    <div class="progress-step" data-step="complete">
                        <div class="step-circle">4</div>
                        <span class="step-label">完成</span>
                    </div>
                </div>
                <div class="progress-detail" id="progressDetail"></div>
                <div class="progress-info">
                    <div class="progress-info-item">
                        <span class="info-label">文件大小:</span>
                        <span class="info-value" id="fileSize">计算中...</span>
                    </div>
                    <div class="progress-info-item">
                        <span class="info-label">处理速度:</span>
                        <span class="info-value" id="processSpeed">--</span>
                    </div>
                    <div class="progress-info-item">
                        <span class="info-label">剩余时间:</span>
                        <span class="info-value" id="remainingTime">计算中...</span>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar">
                        <div class="progress-bar-glow"></div>
                    </div>
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
let themeToggleBtn = document.getElementById("themeToggle");

// 解析功能相关元素
let selectTuzhongBtn = document.getElementById("selectTuzhongBtn");
let analyzeBtn = document.getElementById("analyzeBtn");
let extractBtn = document.getElementById("extractBtn");
let tuzhongResult = document.getElementById("tuzhongResult");
let tuzhongInfo = document.getElementById("tuzhongInfo");
let extractResultDiv = document.getElementById("extractResult");

// 标签页相关元素
let createTab = document.getElementById("createTab");
let extractTab = document.getElementById("extractTab");
let createPanel = document.getElementById("createPanel");
let extractPanel = document.getElementById("extractPanel");

// 进度条相关元素
let progressModal = document.getElementById("progressModal");
let progressStage = document.getElementById("progressStage");
let progressDetail = document.getElementById("progressDetail");
let progressBar = document.getElementById("progressBar");
let progressPercentage = document.getElementById("progressPercentage");
let cancelProgressBtn = document.getElementById("cancelProgressBtn");
let progressStepsCreate = document.getElementById("progressStepsCreate");
let progressStepsExtract = document.getElementById("progressStepsExtract");
let progressHeaderTitle = progressModal ? progressModal.querySelector('.progress-header h3') : null;

// 成功模态框相关元素
let successModal = document.getElementById("successModal");
let successMessage = document.getElementById("successMessage");
let successPath = document.getElementById("successPath");
let openLocationBtn = document.getElementById("openLocationBtn");
let closeSuccessBtn = document.getElementById("closeSuccessBtn");
let successTitle = successModal ? successModal.querySelector('.success-header h3') : null;

let selectedImagePath = "";
let selectedTargetPath = "";
let selectedTuzhongPath = "";
let currentSavePath = "";
let currentTuzhongInfo = null;

const THEME_STORAGE_KEY = "tuzhong-theme";
let currentTheme = "theme-dark";
const ACCEPTED_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];
const progressSequences = {
    create: ["start", "compress", "merge", "complete"],
    extract: ["start", "analyze", "extract", "complete"],
};
const PROGRESS_MESSAGES = {
    start: "准备开始...",
    compress: "正在压缩文件...",
    merge: "正在生成图种...",
    analyze: "正在解析图种结构...",
    extract: "正在提取隐藏文件...",
    complete: "操作完成！",
};
let currentProgressMode = "create";
const progressStepContainers = {
    create: progressStepsCreate,
    extract: progressStepsExtract,
};

// 标签页切换功能
createTab.addEventListener('click', function() {
    switchTab('create');
});

extractTab.addEventListener('click', function() {
    switchTab('extract');
});

// 设置标签页事件
document.getElementById('settingsTab').addEventListener('click', function() {
    switchTab('settings');
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
    } else if (tabName === 'settings') {
        document.getElementById('settingsTab').classList.add('active');
        document.getElementById('settingsPanel').classList.add('active');
        loadCurrentSettings(); // 加载当前设置
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
                handleImageSelection(filePath);
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
                setTargetSelection(filePath, "file");
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
                setTargetSelection(folderPath, "folder");
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
                handleTuzhongSelection(filePath);
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
    
    // 确保隐藏任何遗留的进度条
    hideProgressModal();
    
    setAnalyzeButtonLoading(true);
    showExtractResult("", "");
    
    try {
        // 使用请求队列管理分析操作
        requestQueue.add(() => AnalyzeTuzhong(selectedTuzhongPath), 1) // 高优先级
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
                // 捕获所有错误，避免触发全局错误处理
                console.error("图种分析错误:", err);
                const errorMessage = err.message || err.toString() || "未知错误";
                showExtractResult("分析失败: " + errorMessage, "error");
                tuzhongInfo.classList.add("hidden");
                extractBtn.disabled = true;
                extractBtn.classList.add("secondary");
            })
            .finally(() => {
                setAnalyzeButtonLoading(false);
            });
    } catch (error) {
        // 捕获同步错误
        console.error("分析操作同步错误:", error);
        showExtractResult("分析失败: " + (error.message || error), "error");
        setAnalyzeButtonLoading(false);
    }
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
                showProgressModal("extract");
                
                console.log("开始提取操作，文件路径:", selectedTuzhongPath, "输出路径:", extractPath);
                console.log("使用已分析的图种信息:", currentTuzhongInfo);
                
                // 使用请求队列管理提取操作 - 使用优化版本避免重复分析
                return requestQueue.add(() => {
                    console.log("请求队列：开始执行ExtractFromTuzhongWithInfo");
                    if (currentTuzhongInfo && currentTuzhongInfo.imageSize) {
                        // 使用优化版本，传递已分析的图片大小
                        return ExtractFromTuzhongWithInfo(selectedTuzhongPath, extractPath, currentTuzhongInfo.imageSize);
                    } else {
                        // 如果没有分析信息，使用原版本
                        console.warn("警告：没有找到分析信息，使用原版本可能较慢");
                        return ExtractFromTuzhong(selectedTuzhongPath, extractPath);
                    }
                }, 2) // 高优先级
                    .then(() => {
                        console.log("ExtractFromTuzhongWithInfo执行完成");
                        currentSavePath = extractPath;
                    })
                    .catch((error) => {
                        console.error("ExtractFromTuzhongWithInfo执行失败:", error);
                        throw error;
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
    
    try {
        if (!selectedImagePath) {
            throw window.createError(window.ErrorCodes.INVALID_INPUT, "请选择封面图片", window.ErrorTypes.VALIDATION);
        }
        
        if (!selectedTargetPath) {
            throw window.createError(window.ErrorCodes.INVALID_INPUT, "请选择要隐藏的文件或文件夹", window.ErrorTypes.VALIDATION);
        }
        
        if (!outputName) {
            throw window.createError(window.ErrorCodes.INVALID_INPUT, "请输入输出文件名", window.ErrorTypes.VALIDATION);
        }
        
        // 让用户选择保存位置
        SelectSaveLocation()
            .then((savePath) => {
                if (savePath) {
                    currentSavePath = savePath;
                    
                    // 显示进度条模态框
                    showProgressModal("create");
                    
                    // 使用请求队列管理合并操作
                    return requestQueue.add(() => MergeFiles(selectedImagePath, selectedTargetPath, savePath), 2); // 高优先级
                } else {
                    const error = window.createError(window.ErrorCodes.CANCELLED, "已取消保存", window.ErrorTypes.USER);
                    window.handleError(error);
                    return Promise.reject("用户取消");
                }
            })
            .then((result) => {
                // 不在这里处理成功，因为进度事件会处理
            })
            .catch((err) => {
                if (err !== "用户取消") {
                    // 记录错误但不触发全局错误弹窗
                    // 错误处理应该由operationError事件监听器处理
                    console.error("生成操作失败:", err);
                    
                    // 如果没有事件处理错误，则显示默认错误
                    setTimeout(() => {
                        hideProgressModal();
                        showResult(`生成失败: ${err.message || err}`, "error");
                    }, 100);
                }
            });
    } catch (error) {
        console.error("生成操作同步错误:", error);
        showResult("生成失败: " + (error.message || error), "error");
    }
});

function handleImageSelection(filePath) {
    if (!filePath) {
        return;
    }
    
    try {
        if (!isSupportedImage(filePath)) {
            throw window.createError(
                window.ErrorCodes.IMAGE_UNSUPPORTED, 
                "请选择有效的图片文件（支持 PNG/JPG/GIF/BMP/WEBP）", 
                window.ErrorTypes.VALIDATION
            ).withContext('filePath', filePath);
        }
        setImageSelection(filePath);
    } catch (error) {
        window.handleError(error);
    }
}

// 创建防抖版本的文件选择函数
const debouncedImageSelection = window.performanceUtils.debounce(setImageSelectionInternal, 300, 'imageSelection');
const debouncedTargetSelection = window.performanceUtils.debounce(setTargetSelectionInternal, 300, 'targetSelection');
const debouncedTuzhongSelection = window.performanceUtils.debounce(setTuzhongSelectionInternal, 300, 'tuzhongSelection');

// 创建全局请求队列
const requestQueue = window.performanceUtils.createRequestQueue(2); // 最多2个并发请求

function setImageSelection(filePath) {
    debouncedImageSelection(filePath);
}

function setImageSelectionInternal(filePath) {
    const operationIndex = window.performanceUtils.startOperation('setImageSelection');
    
    selectedImagePath = filePath;
    const fileNameSpan = imageResult.querySelector('.file-name');
    fileNameSpan.textContent = `已选择: ${extractFileName(filePath)}`;
    imageResult.className = "file-result success";
    showMiniPreview(filePath);
    showResult("", "");
    
    window.performanceUtils.endOperation(operationIndex);
}

function handleTuzhongSelection(filePath) {
    if (!filePath) {
        return;
    }
    if (!isSupportedImage(filePath)) {
        showExtractResult("请选择有效的图片文件", "error");
        return;
    }
    setTuzhongSelection(filePath);
}

function setTuzhongSelection(filePath) {
    debouncedTuzhongSelection(filePath);
}

function setTuzhongSelectionInternal(filePath) {
    const operationIndex = window.performanceUtils.startOperation('setTuzhongSelection');
    
    selectedTuzhongPath = filePath;
    const fileNameSpan = tuzhongResult.querySelector('.file-name');
    fileNameSpan.textContent = `已选择: ${extractFileName(filePath)}`;
    tuzhongResult.className = "file-result success";
    currentTuzhongInfo = null;
    
    // 移除图种预览功能，直接隐藏预览容器
    hideTuzhongMiniPreview();
    
    tuzhongInfo.classList.add("hidden");
    extractBtn.disabled = true;
    extractBtn.classList.add("secondary");
    showExtractResult("", "");
    
    window.performanceUtils.endOperation(operationIndex);
}

function setTargetSelection(path, type = "auto") {
    debouncedTargetSelection(path, type);
}

function setTargetSelectionInternal(path, type = "auto") {
    if (!path) {
        return;
    }
    
    const operationIndex = window.performanceUtils.startOperation('setTargetSelection');
    
    selectedTargetPath = path;
    const fileNameSpan = targetResult.querySelector('.file-name');
    const fileName = extractFileName(path);
    let prefix = "已选择:";
    if (type === "file") {
        prefix = "已选择文件:";
    } else if (type === "folder") {
        prefix = "已选择文件夹:";
    }
    fileNameSpan.textContent = `${prefix} ${fileName}`;
    targetResult.className = "file-result success";
    showResult("", "");
    
    window.performanceUtils.endOperation(operationIndex);
}

function extractFileName(filePath) {
    const normalized = filePath.replace(/\\/g, '/');
    const segments = normalized.split('/');
    return segments.pop() || filePath;
}

function isSupportedImage(filePath) {
    const lower = filePath.toLowerCase();
    return ACCEPTED_IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

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
    
    // 获取图片的 base64 数据（使用请求队列管理）
    requestQueue.add(
        () => GetImageBase64(imagePath),
        3  // 预览操作优先级为3（低优先级）
    ).then((base64Data) => {
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

// 清除图种选择
function clearTuzhongSelection() {
    selectedTuzhongPath = "";
    currentTuzhongInfo = null;
    
    const fileNameSpan = tuzhongResult.querySelector('.file-name');
    fileNameSpan.textContent = "";
    tuzhongResult.className = "file-result";
    tuzhongInfo.classList.add("hidden");
    extractBtn.disabled = true;
    extractBtn.classList.add("secondary");
    showExtractResult("", "");
}

// 显示图种信息
function updateTuzhongInfo(info) {
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
let progressUpdateDelay = 80; // 节流间隔，保证动画流畅

// 监听后端进度事件
EventsOn("progress", function(data) {
    // 节流进度更新，减少UI跳动
    const now = Date.now();
    if (data.step === "complete" || now - lastProgressUpdate >= progressUpdateDelay) {
        // 传递额外信息给updateProgress函数
        const additionalInfo = {
            totalSize: data.totalSize || null,
            currentSize: data.currentSize || null,
            speed: data.speed || null
        };
        
        updateProgress(data.percent, data.message, data.step, additionalInfo);
        lastProgressUpdate = now;
    }
    
    if (data.step === "complete") {
        setTimeout(() => {
            hideProgressModal();
            const displayPath = currentSavePath || "（未知路径）";
            const summaryMessage = currentProgressMode === "create"
                ? `图种生成完成！文件已保存到: ${displayPath}`
                : `提取完成！文件已保存到: ${displayPath}`;
            if (currentProgressMode === "create") {
                showResult(summaryMessage, "success");
            } else {
                showExtractResult(summaryMessage, "success");
            }
            showSuccessModal(currentSavePath, currentProgressMode);
        }, 500); // 显示100%一会儿后隐藏
    }
});

// 监听后端操作错误事件
EventsOn("operationError", function(data) {
    console.error("操作失败:", data);
    hideProgressModal();
    const errorMessage = data.message || data.error || "操作失败";
    
    if (currentProgressMode === "create") {
        showResult(`生成失败: ${errorMessage}`, "error");
    } else {
        showExtractResult(`提取失败: ${errorMessage}`, "error");
    }
});

// 进度条相关函数 - 防止布局跳动
function showProgressModal(mode = "create") {
    currentProgressMode = progressSequences[mode] ? mode : "create";
    
    // 重置进度信息
    resetProgressInfo();
    
    if (progressHeaderTitle) {
        progressHeaderTitle.textContent = currentProgressMode === "create" ? "生成图种" : "提取文件";
    }
    Object.entries(progressStepContainers).forEach(([key, container]) => {
        if (!container) {
            return;
        }
        if (key === currentProgressMode) {
            container.classList.remove("hidden");
        } else {
            container.classList.add("hidden");
        }
    });
    resetProgressSteps();
    // 使用 requestAnimationFrame 确保平滑显示
    requestAnimationFrame(() => {
        progressModal.style.display = 'flex'; // 先设置display
        // 在下一帧移除hidden类，确保动画效果
        requestAnimationFrame(() => {
            progressModal.classList.remove("hidden");
        });
    });
    updateProgress(0, PROGRESS_MESSAGES.start, "start");
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

// 进度追踪变量
let progressStartTime = 0;
let processedBytes = 0;
let totalBytes = 0;
let lastUpdateTime = 0;
let lastProcessedBytes = 0;

// 创建节流版本的进度更新函数
const throttledUpdateProgress = window.performanceUtils.throttle(updateProgressInternal, 16, 'progress'); // 60fps

function updateProgress(percent, message, step, additionalInfo = {}) {
    // 记录性能操作
    const operationIndex = window.performanceUtils.startOperation(`updateProgress-${step}`);
    
    // 使用节流版本
    throttledUpdateProgress(percent, message, step, additionalInfo, operationIndex);
}

function updateProgressInternal(percent, message, step, additionalInfo, operationIndex) {
    // 使用 requestAnimationFrame 优化动画性能
    requestAnimationFrame(() => {
        const currentTime = Date.now();
        
        // 更新基本进度信息
        if (progressStage) {
            const stageText = PROGRESS_MESSAGES[step] || message || PROGRESS_MESSAGES.start;
            progressStage.textContent = stageText;
        }
        
        if (progressDetail) {
            const stageText = PROGRESS_MESSAGES[step];
            if (message && message !== stageText) {
                progressDetail.textContent = message;
            } else {
                progressDetail.textContent = "";
            }
        }
        
        // 平滑进度条动画
        const currentWidth = parseFloat(progressBar.style.width) || 0;
        if (Math.abs(percent - currentWidth) > 0.1) {
            progressBar.style.width = percent + "%";
        }
        progressPercentage.textContent = Math.round(percent) + "%";
        
        // 更新详细信息
        updateProgressInfo(percent, additionalInfo, currentTime);
        
        highlightProgressStep(step);
        
        // 结束性能计时
        if (operationIndex !== undefined) {
            window.performanceUtils.endOperation(operationIndex);
        }
    });
}

function updateProgressInfo(percent, additionalInfo, currentTime) {
    const fileSizeEl = document.getElementById('fileSize');
    const processSpeedEl = document.getElementById('processSpeed');
    const remainingTimeEl = document.getElementById('remainingTime');
    
    if (!fileSizeEl || !processSpeedEl || !remainingTimeEl) return;
    
    // 更新文件大小信息
    if (additionalInfo.totalSize) {
        totalBytes = additionalInfo.totalSize;
        fileSizeEl.textContent = formatFileSize(totalBytes);
    } else if (additionalInfo.currentSize) {
        fileSizeEl.textContent = formatFileSize(additionalInfo.currentSize);
    }
    
    // 计算处理速度和剩余时间
    if (progressStartTime === 0) {
        progressStartTime = currentTime;
        lastUpdateTime = currentTime;
        lastProcessedBytes = 0;
    }
    
    const elapsedTime = (currentTime - progressStartTime) / 1000; // 秒
    const timeSinceLastUpdate = (currentTime - lastUpdateTime) / 1000;
    
    if (totalBytes > 0 && elapsedTime > 0.5) {
        processedBytes = Math.floor((percent / 100) * totalBytes);
        
        // 计算处理速度（使用滑动窗口平均）
        if (timeSinceLastUpdate >= 1) { // 每秒更新一次速度
            const bytesDelta = processedBytes - lastProcessedBytes;
            const speed = bytesDelta / timeSinceLastUpdate;
            
            if (speed > 0) {
                processSpeedEl.textContent = formatFileSize(speed) + '/s';
                
                // 计算剩余时间
                const remainingBytes = totalBytes - processedBytes;
                const remainingSeconds = remainingBytes / speed;
                
                if (remainingSeconds > 0 && remainingSeconds < 3600) { // 小于1小时才显示
                    remainingTimeEl.textContent = formatTime(remainingSeconds);
                } else {
                    remainingTimeEl.textContent = '--';
                }
            }
            
            lastUpdateTime = currentTime;
            lastProcessedBytes = processedBytes;
        }
    } else {
        if (percent >= 99) {
            processSpeedEl.textContent = '完成';
            remainingTimeEl.textContent = '00:00';
        }
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function resetProgressInfo() {
    progressStartTime = 0;
    processedBytes = 0;
    totalBytes = 0;
    lastUpdateTime = 0;
    lastProcessedBytes = 0;
    
    const fileSizeEl = document.getElementById('fileSize');
    const processSpeedEl = document.getElementById('processSpeed');
    const remainingTimeEl = document.getElementById('remainingTime');
    
    if (fileSizeEl) fileSizeEl.textContent = '计算中...';
    if (processSpeedEl) processSpeedEl.textContent = '--';
    if (remainingTimeEl) remainingTimeEl.textContent = '计算中...';
}

function resetProgressSteps() {
    document.querySelectorAll('.progress-step').forEach(stepEl => {
        stepEl.classList.remove('active', 'completed');
    });
    const activeContainer = progressStepContainers[currentProgressMode];
    const sequence = progressSequences[currentProgressMode] || [];
    if (activeContainer && sequence.length > 0) {
        const firstStep = activeContainer.querySelector(`.progress-step[data-step="${sequence[0]}"]`);
        if (firstStep) {
            firstStep.classList.add('active');
        }
    }
    if (progressDetail) {
        progressDetail.textContent = "";
    }
}

function highlightProgressStep(step) {
    const activeContainer = progressStepContainers[currentProgressMode];
    if (!activeContainer) {
        return;
    }
    const sequence = progressSequences[currentProgressMode] || [];
    if (!step || sequence.indexOf(step) === -1) {
        return;
    }
    const stepIndex = sequence.indexOf(step);
    sequence.forEach((name, index) => {
        const element = activeContainer.querySelector(`.progress-step[data-step="${name}"]`);
        if (!element) {
            return;
        }
        if (index < stepIndex) {
            element.classList.add('completed');
            element.classList.remove('active');
        } else if (index === stepIndex) {
            element.classList.add('active');
            element.classList.remove('completed');
        } else {
            element.classList.remove('active', 'completed');
        }
    });
}

function initTheme() {
    // 检测系统主题偏好
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    
    // 确定初始主题
    let initialTheme;
    if (storedTheme) {
        initialTheme = storedTheme;
    } else {
        initialTheme = mediaQuery.matches ? 'theme-dark' : 'theme-light';
    }
    
    // 应用初始主题
    applyTheme(initialTheme, { persist: false });
    
    // 监听系统主题变化
    mediaQuery.addListener((e) => {
        // 只有在没有用户自定义偏好时才跟随系统主题
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
            const systemTheme = e.matches ? 'theme-dark' : 'theme-light';
            applyTheme(systemTheme, { persist: false });
        }
    });
    
    // 设置主题切换按钮事件
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            // 添加点击动画
            themeToggleBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                themeToggleBtn.style.transform = '';
            }, 150);
            
            const nextTheme = currentTheme === 'theme-dark' ? 'theme-light' : 'theme-dark';
            applyTheme(nextTheme);
        });
        
        // 添加键盘支持
        themeToggleBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                themeToggleBtn.click();
            }
        });
    }
}

function applyTheme(theme, options = {}) {
    const finalTheme = theme === 'theme-light' ? 'theme-light' : 'theme-dark';
    
    // 如果主题没有变化，直接返回
    if (currentTheme === finalTheme) {
        return;
    }
    
    // 添加过渡动画类
    document.body.classList.add('theme-transitioning');
    
    currentTheme = finalTheme;
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(finalTheme);
    
    updateThemeToggleUI(finalTheme);
    
    // 保存主题偏好
    if (options.persist !== false) {
        localStorage.setItem(THEME_STORAGE_KEY, finalTheme);
    }
    
    // 同步Wails窗口主题
    try {
        if (finalTheme === 'theme-dark' && typeof WindowSetDarkTheme === 'function') {
            WindowSetDarkTheme();
        } else if (finalTheme === 'theme-light' && typeof WindowSetLightTheme === 'function') {
            WindowSetLightTheme();
        }
    } catch (err) {
        console.warn('同步系统主题失败:', err);
    }
    
    // 移除过渡动画类
    setTimeout(() => {
        document.body.classList.remove('theme-transitioning');
    }, 300);
    
    // 触发主题切换事件
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: finalTheme }
    }));
}

function updateThemeToggleUI(theme) {
    if (!themeToggleBtn) {
        return;
    }
    
    // 更新属性
    themeToggleBtn.setAttribute('data-theme', theme);
    themeToggleBtn.setAttribute('aria-pressed', theme === 'theme-light' ? 'true' : 'false');
    
    // 更新文本
    const textEl = themeToggleBtn.querySelector('.theme-toggle-text');
    if (textEl) {
        const newText = theme === 'theme-dark' ? '浅色模式' : '深色模式';
        
        // 平滑文本过渡
        textEl.style.opacity = '0';
        setTimeout(() => {
            textEl.textContent = newText;
            textEl.style.opacity = '1';
        }, 150);
    }
    
    // 添加图标旋转动画
    const icons = themeToggleBtn.querySelectorAll('.theme-icon');
    icons.forEach(icon => {
        icon.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            icon.style.transform = '';
        }, 300);
    });
}

function setupFileDropHandling() {
    const dropTargets = document.querySelectorAll('[data-drop-target]');
    dropTargets.forEach(target => {
        target.style.setProperty('--wails-drop-target', 'drop');
        // 添加原生拖放事件监听用于视觉反馈
        setupDropZoneVisualFeedback(target);
    });
    
    if (typeof OnFileDrop !== 'function') {
        console.warn('当前环境未启用文件拖放功能');
        return;
    }
    
    try {
        OnFileDrop((x, y, paths) => {
            // 清除所有拖放状态
            clearDropTargetStates();
            
            if (!paths || paths.length === 0) {
                showDropMessage('没有检测到有效文件', 'error');
                return;
            }
            
            const element = document.elementFromPoint(x, y);
            if (!element) {
                return;
            }
            
            const dropTarget = element.closest('[data-drop-target]');
            if (!dropTarget) {
                showDropMessage('请将文件拖放到正确的区域', 'warning');
                return;
            }
            
            const dropType = dropTarget.getAttribute('data-drop-target');
            
            // 处理多文件拖放
            if (paths.length > 1 && dropType !== 'target') {
                showDropMessage(`检测到${paths.length}个文件，将处理第一个文件`, 'info');
            }
            
            const primaryPath = paths[0];
            
            // 验证文件类型并处理
            if (dropType === 'image') {
                if (validateImageFile(primaryPath)) {
                    handleImageSelection(primaryPath);
                    showDropMessage('图片文件添加成功', 'success');
                } else {
                    showDropMessage('请拖放有效的图片文件 (jpg, jpeg, png, gif, bmp, webp)', 'error');
                }
            } else if (dropType === 'target') {
                // 对于目标文件，支持多种类型
                setTargetSelection(primaryPath);
                const fileName = primaryPath.split('\\').pop() || primaryPath.split('/').pop();
                showDropMessage(`文件 "${fileName}" 添加成功`, 'success');
            } else if (dropType === 'tuzhong') {
                if (validateTuzhongFile(primaryPath)) {
                    handleTuzhongSelection(primaryPath);
                    showDropMessage('图种文件添加成功', 'success');
                } else {
                    showDropMessage('请拖放有效的图种文件', 'error');
                }
            }
        }, true);
    } catch (error) {
        console.error('初始化拖放事件失败:', error);
        showDropMessage('文件拖放功能初始化失败', 'error');
    }
}

// 设置拖放区域的视觉反馈
function setupDropZoneVisualFeedback(target) {
    let dragCounter = 0;
    
    // 拖拽进入
    target.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        target.classList.add('drag-over');
        
        const dropType = target.getAttribute('data-drop-target');
        showDropHint(dropType);
    });
    
    // 拖拽离开
    target.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            target.classList.remove('drag-over');
            hideDropHint();
        }
    });
    
    // 拖拽经过
    target.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    // 文件放下
    target.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        target.classList.remove('drag-over');
        hideDropHint();
    });
}

// 验证图片文件
function validateImageFile(filePath) {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
    return imageExtensions.test(filePath);
}

// 验证图种文件
function validateTuzhongFile(filePath) {
    const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp)$/i;
    return imageExtensions.test(filePath);
}

// 显示拖放提示
function showDropHint(dropType) {
    const hints = {
        'image': '拖放图片文件作为封面',
        'target': '拖放要隐藏的文件或文件夹',
        'tuzhong': '拖放图种文件进行解析'
    };
    
    const hint = hints[dropType] || '拖放文件到此区域';
    showDropMessage(hint, 'info', true);
}

// 隐藏拖放提示
function hideDropHint() {
    const messageEl = document.querySelector('.drop-message.persistent');
    if (messageEl) {
        messageEl.remove();
    }
}

// 显示拖放消息
function showDropMessage(message, type = 'info', persistent = false) {
    // 移除现有消息
    const existingMessage = document.querySelector('.drop-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const messageEl = document.createElement('div');
    messageEl.className = `drop-message drop-message-${type} ${persistent ? 'persistent' : ''}`;
    messageEl.textContent = message;
    
    // 添加样式
    Object.assign(messageEl.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        fontSize: '14px',
        zIndex: '10000',
        maxWidth: '300px',
        wordWrap: 'break-word',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        backdropFilter: 'blur(10px)'
    });
    
    // 设置背景色
    const colors = {
        success: 'rgba(34, 197, 94, 0.9)',
        error: 'rgba(239, 68, 68, 0.9)',
        warning: 'rgba(245, 158, 11, 0.9)',
        info: 'rgba(59, 130, 246, 0.9)'
    };
    messageEl.style.background = colors[type] || colors.info;
    
    document.body.appendChild(messageEl);
    
    // 动画显示
    requestAnimationFrame(() => {
        messageEl.style.transform = 'translateX(0)';
    });
    
    // 自动隐藏（除非是持续显示）
    if (!persistent) {
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.remove();
                    }
                }, 300);
            }
        }, 3000);
    }
}

// 清除所有拖放目标状态
function clearDropTargetStates() {
    const dropTargets = document.querySelectorAll('[data-drop-target]');
    dropTargets.forEach(target => {
        target.classList.remove('drag-over', 'wails-drop-target-active');
    });
}

// 成功模态框相关函数 - 防止布局跳动
function showSuccessModal(filePath, mode = "create") {
    const normalizedPath = filePath || "";
    const isCreateMode = mode === "create";
    const hasPath = Boolean(normalizedPath);
    const titleText = isCreateMode ? "生成成功" : "提取完成";
    const messageText = isCreateMode ? "图种文件已成功保存！" : "隐藏文件已成功提取！";
    successMessage.textContent = messageText;
    if (successPath) {
        successPath.textContent = hasPath ? normalizedPath : "路径不可用";
        successPath.classList.toggle('hidden', !hasPath);
    }
    if (successTitle) {
        successTitle.textContent = titleText;
    }
    if (openLocationBtn) {
        openLocationBtn.textContent = isCreateMode ? "打开位置" : "打开提取文件夹";
        openLocationBtn.disabled = !hasPath;
        openLocationBtn.classList.toggle('disabled', !hasPath);
    }
    
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
    if (currentProgressMode === "create") {
        showResult("用户取消了操作", "info");
    } else {
        showExtractResult("用户取消了操作", "info");
    }
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
    } else {
        return;
    }
    hideSuccessModal();
});

initTheme();
setupFileDropHandling();

// ===== 设置管理功能 =====

// 加载当前设置
async function loadCurrentSettings() {
    try {
        const config = await GetConfig();
        const limits = config.fileSizeLimits;
        
        // 更新开关状态
        document.getElementById('enableSizeCheck').checked = limits.enableSizeCheck;
        
        // 更新输入值
        updateSizeInput('maxImageSize', 'imageSizeUnit', limits.maxImageSize);
        updateSizeInput('maxZipSize', 'zipSizeUnit', limits.maxZipSize);
        updateSizeInput('maxGeneralFileSize', 'generalFileSizeUnit', limits.maxGeneralFile);
        
        // 更新输入框禁用状态
        toggleSizeInputs(limits.enableSizeCheck);
        
    } catch (error) {
        console.error('加载设置失败:', error);
        showErrorMessage('加载设置失败: ' + error.message);
    }
}

// 将字节转换为合适的单位显示
function updateSizeInput(inputId, unitId, sizeInBytes) {
    const input = document.getElementById(inputId);
    const unit = document.getElementById(unitId);
    
    if (sizeInBytes === 0) {
        input.value = 0;
        unit.value = 'MB';
        return;
    }
    
    const sizeInMB = sizeInBytes / (1024 * 1024);
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
    
    if (sizeInGB >= 1) {
        input.value = Math.round(sizeInGB * 100) / 100;
        unit.value = 'GB';
    } else {
        input.value = Math.round(sizeInMB * 100) / 100;
        unit.value = 'MB';
    }
}

// 将输入值转换为字节
function getSizeInBytes(inputId, unitId) {
    const value = parseFloat(document.getElementById(inputId).value);
    const unit = document.getElementById(unitId).value;
    
    if (isNaN(value) || value <= 0) {
        return 0;
    }
    
    if (unit === 'GB') {
        return Math.round(value * 1024 * 1024 * 1024);
    } else {
        return Math.round(value * 1024 * 1024);
    }
}

// 切换大小输入框的启用状态
function toggleSizeInputs(enabled) {
    const groups = ['imageSizeGroup', 'zipSizeGroup', 'generalFileSizeGroup'];
    groups.forEach(groupId => {
        const group = document.getElementById(groupId);
        const inputs = group.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.disabled = !enabled;
        });
        if (enabled) {
            group.classList.remove('disabled');
        } else {
            group.classList.add('disabled');
        }
    });
}

// 设置事件监听器
document.getElementById('enableSizeCheck').addEventListener('change', function() {
    toggleSizeInputs(this.checked);
});

// 保存设置
document.getElementById('saveSettingsBtn').addEventListener('click', async function() {
    const btn = this;
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    
    try {
        // 显示加载状态
        btn.disabled = true;
        btnText.style.opacity = '0';
        btnLoading.style.display = 'flex';
        
        const enableSizeCheck = document.getElementById('enableSizeCheck').checked;
        
        if (enableSizeCheck) {
            // 启用大小检查，更新具体限制
            const limits = {
                maxImageSize: getSizeInBytes('maxImageSize', 'imageSizeUnit'),
                maxZipSize: getSizeInBytes('maxZipSize', 'zipSizeUnit'),
                maxGeneralFile: getSizeInBytes('maxGeneralFileSize', 'generalFileSizeUnit'),
                enableSizeCheck: true
            };
            
            await UpdateFileSizeLimits(limits);
        } else {
            // 禁用大小检查
            await DisableFileSizeCheck();
        }
        
        showSuccessMessage('设置已保存');
        
    } catch (error) {
        console.error('保存设置失败:', error);
        showErrorMessage('保存设置失败: ' + error.message);
    } finally {
        // 恢复按钮状态
        btn.disabled = false;
        btnText.style.opacity = '1';
        btnLoading.style.display = 'none';
    }
});

// 重置设置
document.getElementById('resetSettingsBtn').addEventListener('click', async function() {
    const btn = this;
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    
    try {
        // 显示加载状态
        btn.disabled = true;
        btnText.style.opacity = '0';
        btnLoading.style.display = 'flex';
        
        // 重置为默认值
        const defaultLimits = {
            maxImageSize: 200 * 1024 * 1024,      // 200MB
            maxZipSize: 2 * 1024 * 1024 * 1024,   // 2GB
            maxGeneralFile: 10 * 1024 * 1024 * 1024, // 10GB
            enableSizeCheck: true
        };
        
        await UpdateFileSizeLimits(defaultLimits);
        await loadCurrentSettings(); // 重新加载设置到界面
        
        showSuccessMessage('设置已重置为默认值');
        
    } catch (error) {
        console.error('重置设置失败:', error);
        showErrorMessage('重置设置失败: ' + error.message);
    } finally {
        // 恢复按钮状态
        btn.disabled = false;
        btnText.style.opacity = '1';
        btnLoading.style.display = 'none';
    }
});

// 快速设置按钮
document.getElementById('removeAllLimitsBtn').addEventListener('click', async function() {
    if (!confirm('确定要移除所有文件大小限制吗？这将允许处理任意大小的文件，可能会影响性能。')) {
        return;
    }
    
    try {
        await RemoveAllSizeLimits();
        await loadCurrentSettings();
        showSuccessMessage('已移除所有文件大小限制');
    } catch (error) {
        console.error('移除限制失败:', error);
        showErrorMessage('移除限制失败: ' + error.message);
    }
});

document.getElementById('setConservativeLimitsBtn').addEventListener('click', async function() {
    const conservativeLimits = {
        maxImageSize: 20 * 1024 * 1024,        // 20MB
        maxZipSize: 500 * 1024 * 1024,         // 500MB
        maxGeneralFile: 1 * 1024 * 1024 * 1024, // 1GB
        enableSizeCheck: true
    };
    
    try {
        await UpdateFileSizeLimits(conservativeLimits);
        await loadCurrentSettings();
        showSuccessMessage('已应用保守设置');
    } catch (error) {
        console.error('应用保守设置失败:', error);
        showErrorMessage('应用保守设置失败: ' + error.message);
    }
});

document.getElementById('setLiberalLimitsBtn').addEventListener('click', async function() {
    const liberalLimits = {
        maxImageSize: 1 * 1024 * 1024 * 1024,   // 1GB
        maxZipSize: 20 * 1024 * 1024 * 1024,    // 20GB
        maxGeneralFile: 50 * 1024 * 1024 * 1024, // 50GB
        enableSizeCheck: true
    };
    
    try {
        await UpdateFileSizeLimits(liberalLimits);
        await loadCurrentSettings();
        showSuccessMessage('已应用宽松设置');
    } catch (error) {
        console.error('应用宽松设置失败:', error);
        showErrorMessage('应用宽松设置失败: ' + error.message);
    }
});

// 消息显示函数
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

// ===== 性能监控功能 =====

// 初始化性能监控
function initPerformanceMonitoring() {
    // 定期更新性能数据
    setInterval(updatePerformanceDisplay, 2000);
    
    // 监听内存警告事件
    window.addEventListener('memoryWarning', handleMemoryWarning);
    
    // 绑定性能监控按钮事件
    setupPerformanceButtons();
    
    // 初始化显示
    updatePerformanceDisplay();
}

// 更新性能数据显示
function updatePerformanceDisplay() {
    if (!window.performanceUtils) return;
    
    const report = window.performanceUtils.getPerformanceReport();
    const memoryUsageEl = document.getElementById('memoryUsage');
    const sessionDurationEl = document.getElementById('sessionDuration');
    const operationCountEl = document.getElementById('operationCount');
    const avgOperationTimeEl = document.getElementById('avgOperationTime');
    
    if (memoryUsageEl && report.currentMemory) {
        memoryUsageEl.textContent = `${report.currentMemory.usagePercentage}%`;
        memoryUsageEl.style.color = getMemoryColor(parseFloat(report.currentMemory.usagePercentage));
    }
    
    if (sessionDurationEl) {
        const minutes = Math.floor(report.sessionDuration / 60000);
        const seconds = Math.floor((report.sessionDuration % 60000) / 1000);
        sessionDurationEl.textContent = `${minutes}分${seconds}秒`;
    }
    
    if (operationCountEl) {
        operationCountEl.textContent = report.totalOperations.toString();
    }
    
    if (avgOperationTimeEl) {
        avgOperationTimeEl.textContent = `${report.averageOperationTime.toFixed(1)}ms`;
        avgOperationTimeEl.style.color = getPerformanceColor(report.averageOperationTime);
    }
}

// 根据内存使用率获取颜色
function getMemoryColor(percentage) {
    if (percentage < 50) return '#10b981'; // 绿色
    if (percentage < 80) return '#f59e0b'; // 黄色
    return '#ef4444'; // 红色
}

// 根据操作时间获取颜色
function getPerformanceColor(time) {
    if (time < 100) return '#10b981'; // 绿色
    if (time < 500) return '#f59e0b'; // 黄色
    return '#ef4444'; // 红色
}

// 处理内存警告
function handleMemoryWarning(event) {
    const warningEl = document.getElementById('memoryWarning');
    if (warningEl) {
        warningEl.classList.remove('hidden');
        
        // 5秒后自动隐藏
        setTimeout(() => {
            warningEl.classList.add('hidden');
        }, 5000);
    }
    
    console.warn('内存使用率过高:', event.detail);
    showErrorMessage('内存使用率过高，建议关闭不需要的预览或刷新页面');
}

// 设置性能监控按钮事件
function setupPerformanceButtons() {
    // 刷新按钮
    const refreshBtn = document.getElementById('refreshPerformanceBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', updatePerformanceDisplay);
    }
    
    // 清除数据按钮
    const clearBtn = document.getElementById('clearPerformanceBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (window.performanceUtils) {
                window.performanceUtils.performanceMetrics.operations = [];
                window.performanceUtils.performanceMetrics.memoryUsage = [];
                updatePerformanceDisplay();
                showSuccessMessage('性能数据已清除');
            }
        });
    }
    
    // 导出报告按钮
    const exportBtn = document.getElementById('exportPerformanceBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportPerformanceReport);
    }
}

// 导出性能报告
function exportPerformanceReport() {
    if (!window.performanceUtils) {
        showErrorMessage('性能工具未初始化');
        return;
    }
    
    const report = window.performanceUtils.getPerformanceReport();
    const reportData = {
        timestamp: new Date().toISOString(),
        sessionDuration: report.sessionDuration,
        totalOperations: report.totalOperations,
        averageOperationTime: report.averageOperationTime,
        slowOperations: report.slowOperations,
        currentMemory: report.currentMemory,
        memoryHistory: report.memoryHistory
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showSuccessMessage('性能报告已导出');
}

// 在DOM加载完成后初始化性能监控
document.addEventListener('DOMContentLoaded', () => {
    // 确保性能工具已加载
    if (window.performanceUtils) {
        initPerformanceMonitoring();
    } else {
        // 如果性能工具还没加载，等待一下再初始化
        setTimeout(() => {
            if (window.performanceUtils) {
                initPerformanceMonitoring();
            }
        }, 500);
    }
});
