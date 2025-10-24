// 扩展的前端功能：支持多格式和加密

// 添加密码输入模态框
const passwordModalHTML = `
<div id="passwordModal" class="password-modal hidden">
    <div class="password-modal-content">
        <div class="password-header">
            <h3>🔐 检测到加密内容</h3>
            <button class="password-close-btn" onclick="hidePasswordModal()">×</button>
        </div>
        <div class="password-body">
            <p>此图种包含加密保护的数据，请输入密码继续：</p>
            <div class="password-input-container">
                <input type="password" id="passwordInput" placeholder="请输入密码" />
                <button type="button" onclick="togglePasswordVisibility()" class="password-toggle">
                    <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </button>
            </div>
            <div class="password-hint" id="passwordHint"></div>
        </div>
        <div class="password-footer">
            <button class="password-cancel-btn" onclick="hidePasswordModal()">取消</button>
            <button class="password-confirm-btn" onclick="confirmPassword()">确定</button>
        </div>
    </div>
</div>`;

// 添加密码模态框样式
const passwordModalCSS = `
.password-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.password-modal.show {
    opacity: 1;
}

.password-modal-content {
    background: var(--card-bg);
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 1px solid var(--border-color);
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.password-modal.show .password-modal-content {
    transform: scale(1);
}

.password-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px 16px;
    border-bottom: 1px solid var(--border-color);
}

.password-header h3 {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
}

.password-close-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s ease;
}

.password-close-btn:hover {
    background: var(--hover-bg);
    color: var(--text-primary);
}

.password-body {
    padding: 24px;
}

.password-body p {
    margin: 0 0 16px 0;
    color: var(--text-secondary);
    line-height: 1.5;
}

.password-input-container {
    position: relative;
    display: flex;
    align-items: center;
}

.password-input-container input {
    width: 100%;
    padding: 12px 16px;
    padding-right: 50px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    background: var(--input-bg);
    color: var(--text-primary);
    font-size: 14px;
    transition: border-color 0.2s ease;
}

.password-input-container input:focus {
    outline: none;
    border-color: var(--primary-color);
}

.password-toggle {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: color 0.2s ease;
}

.password-toggle:hover {
    color: var(--text-primary);
}

.eye-icon {
    width: 18px;
    height: 18px;
}

.password-hint {
    margin-top: 12px;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
}

.password-footer {
    display: flex;
    gap: 12px;
    padding: 16px 24px 24px;
    justify-content: flex-end;
}

.password-cancel-btn,
.password-confirm-btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
}

.password-cancel-btn {
    background: var(--button-secondary-bg);
    color: var(--text-primary);
}

.password-cancel-btn:hover {
    background: var(--button-secondary-hover);
}

.password-confirm-btn {
    background: var(--primary-color);
    color: white;
}

.password-confirm-btn:hover {
    background: var(--primary-hover);
}

.password-confirm-btn:disabled {
    background: var(--button-disabled);
    cursor: not-allowed;
}`;

// 密码模态框管理
let currentPasswordCallback = null;

function showPasswordModal(hint = "", callback = null) {
    // 如果模态框不存在，创建它
    if (!document.getElementById('passwordModal')) {
        document.body.insertAdjacentHTML('beforeend', passwordModalHTML);
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = passwordModalCSS;
        document.head.appendChild(style);
    }
    
    const modal = document.getElementById('passwordModal');
    const hintElement = document.getElementById('passwordHint');
    const input = document.getElementById('passwordInput');
    
    // 设置提示信息
    if (hint) {
        hintElement.textContent = hint;
        hintElement.style.display = 'block';
    } else {
        hintElement.style.display = 'none';
    }
    
    // 保存回调函数
    currentPasswordCallback = callback;
    
    // 清空输入框
    input.value = '';
    
    // 显示模态框
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('show');
        input.focus();
    }, 10);
    
    // 添加键盘事件
    input.addEventListener('keypress', handlePasswordKeyPress);
}

function hidePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    currentPasswordCallback = null;
}

function handlePasswordKeyPress(event) {
    if (event.key === 'Enter') {
        confirmPassword();
    } else if (event.key === 'Escape') {
        hidePasswordModal();
    }
}

function togglePasswordVisibility() {
    const input = document.getElementById('passwordInput');
    const icon = document.querySelector('.password-toggle .eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
            <line x1="1" y1="1" x2="23" y2="23"/>
        `;
    } else {
        input.type = 'password';
        icon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }
}

function confirmPassword() {
    const input = document.getElementById('passwordInput');
    const password = input.value.trim();
    
    if (!password) {
        showErrorMessage('请输入密码');
        input.focus();
        return;
    }
    
    if (currentPasswordCallback) {
        currentPasswordCallback(password);
    }
    
    hidePasswordModal();
}

// 扩展分析函数以支持加密检测
async function analyzeWithEncryptionSupport(tuzhongPath) {
    try {
        // 首先尝试扩展分析
        const extendedInfo = await AnalyzeTuzhongExtended(tuzhongPath);
        
        if (extendedInfo.requireAuth) {
            // 显示加密提示
            showPasswordModal(
                extendedInfo.authHint || "检测到加密内容，需要密码才能访问",
                (password) => {
                    // 用户输入密码后的处理
                    performEncryptedExtraction(tuzhongPath, password);
                }
            );
            return extendedInfo;
        }
        
        return extendedInfo;
    } catch (error) {
        // 回退到普通分析
        return await AnalyzeTuzhong(tuzhongPath);
    }
}

async function performEncryptedExtraction(tuzhongPath, password) {
    try {
        showProgressModal("extract");
        
        const outputPath = await SelectExtractLocation();
        if (!outputPath) {
            hideProgressModal();
            return;
        }
        
        // 使用带密码的提取方法
        await ExtractFromTuzhongWithPassword(tuzhongPath, outputPath, password);
        
        hideProgressModal();
        showSuccessMessage('加密内容提取成功！');
        
    } catch (error) {
        hideProgressModal();
        if (error.message.includes('密码') || error.message.includes('password')) {
            showErrorMessage('密码错误，请重试');
            // 重新显示密码输入框
            showPasswordModal("密码错误，请重新输入", (newPassword) => {
                performEncryptedExtraction(tuzhongPath, newPassword);
            });
        } else {
            showErrorMessage('提取失败: ' + error.message);
        }
    }
}

// 格式信息显示
function displayFormatInfo(formatInfo) {
    const infoContainer = document.createElement('div');
    infoContainer.className = 'format-info';
    infoContainer.innerHTML = `
        <div class="format-header">
            <span class="format-type">${formatInfo.name}</span>
            ${formatInfo.isEncrypted ? '<span class="encrypted-badge">🔐 加密</span>' : ''}
        </div>
        <div class="format-description">${formatInfo.description}</div>
        <div class="format-size">数据大小: ${formatFileSize(formatInfo.size)}</div>
    `;
    
    return infoContainer;
}

// 导出函数供全局使用
window.encryptionSupport = {
    showPasswordModal,
    hidePasswordModal,
    analyzeWithEncryptionSupport,
    performEncryptedExtraction,
    displayFormatInfo
};