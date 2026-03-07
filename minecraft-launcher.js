// Minecraft CheerpJ 启动器 - 诊断增强版

// DOM 元素引用
const elements = {
    statusText: document.getElementById('status-text'),
    progressFill: document.getElementById('progress-fill'),
    launchBtn: document.getElementById('launch-btn'),
    resetBtn: document.getElementById('reset-btn'),
    diagnoseBtn: document.getElementById('diagnose-btn'),
    gameContainer: document.getElementById('game-container'),
    errorDetail: document.getElementById('error-detail'),
    errorStack: document.getElementById('error-stack'),
    diagWasm: document.getElementById('diag-wasm'),
    diagCheerpj: document.getElementById('diag-cheerpj'),
    diagMirror: document.getElementById('diag-mirror'),
    diagMemory: document.getElementById('diag-memory'),
    localPathInput: document.getElementById('local-path-input')
};

// 镜像源配置
const MIRRORS = {
    jsdelivr: 'https://cdn.jsdelivr.net/npm/@leaningtech/cheerpj@3.2.0/cheerpj.js',
    unpkg: 'https://unpkg.com/@leaningtech/cheerpj@3.2.0/cheerpj.js',
    staticfile: 'https://cdn.staticfile.net/cheerpj/3.2.0/cheerpj.js',
    local: ''  // 本地路径由用户输入
};

// 状态管理
let isRunning = false;
let cheerpjLoaded = false;

/**
 * 更新状态显示
 */
function updateStatus(text, progress = null) {
    elements.statusText.textContent = text;
    if (progress !== null) {
        elements.progressFill.style.width = `${progress}%`;
    }
}

/**
 * 显示错误详情
 */
function showError(message, error = null) {
    elements.errorDetail.style.display = 'block';
    let stack = message;
    if (error) {
        stack += '\n\n' + (error.stack || error.message || JSON.stringify(error));
    }
    elements.errorStack.textContent = stack;
    updateStatus('❌ ' + message, 0);
}

/**
 * 诊断浏览器环境
 */
async function diagnoseEnvironment() {
    updateStatus('正在诊断环境...', 10);
    
    // 1. 检测 WebAssembly
    if (typeof WebAssembly === 'object') {
        elements.diagWasm.textContent = '✅ 支持';
        elements.diagWasm.className = 'diag-value success';
    } else {
        elements.diagWasm.textContent = '❌ 不支持 (请更新浏览器)';
        elements.diagWasm.className = 'diag-value error';
    }
    
    // 2. 检测 CheerpJ 是否已加载
    if (window.cheerpj) {
        elements.diagCheerpj.textContent = '✅ 已加载';
        elements.diagCheerpj.className = 'diag-value success';
        cheerpjLoaded = true;
    } else {
        elements.diagCheerpj.textContent = '⏳ 未加载 (选择镜像后启动)';
        elements.diagCheerpj.className = 'diag-value warning';
    }
    
    // 3. 检测镜像源连接
    const selectedMirror = document.querySelector('input[name="mirror"]:checked').value;
    if (selectedMirror !== 'local') {
        const mirrorUrl = MIRRORS[selectedMirror];
        try {
            const response = await fetch(mirrorUrl, { method: 'HEAD', mode: 'no-cors' });
            elements.diagMirror.textContent = '✅ 可连接';
            elements.diagMirror.className = 'diag-value success';
        } catch (error) {
            elements.diagMirror.textContent = '❌ 连接失败';
            elements.diagMirror.className = 'diag-value error';
        }
    } else {
        elements.diagMirror.textContent = '⏳ 使用本地文件';
        elements.diagMirror.className = 'diag-value warning';
    }
    
    // 4. 检测内存限制
    try {
        const memory = performance.memory;
        if (memory) {
            const limit = Math.round(memory.jsHeapSizeLimit / (1024 * 1024));
            elements.diagMemory.textContent = `${limit}MB`;
            elements.diagMemory.className = 'diag-value success`;
        } else {
            elements.diagMemory.textContent = '未知 (无限制)';
            elements.diagMemory.className = 'diag-value';
        }
    } catch (e) {
        elements.diagMemory.textContent = '未知';
    }
    
    updateStatus('诊断完成', 20);
}

/**
 * 动态加载 CheerpJ 脚本
 */
function loadCheerpJScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            console.log('CheerpJ 脚本加载成功:', src);
            cheerpjLoaded = true;
            resolve();
        };
        script.onerror = () => {
            reject(new Error(`加载失败: ${src}`));
        };
        document.head.appendChild(script);
    });
}

/**
 * 初始化 CheerpJ
 */
async function initCheerpJWithMirror() {
    // 获取选中的镜像
    const selectedMirror = document.querySelector('input[name="mirror"]:checked').value;
    let scriptUrl;
    
    if (selectedMirror === 'local') {
        const localPath = document.querySelector('.local-path input').value;
        if (!localPath) {
            throw new Error('请填写本地 cheerpj.js 路径');
        }
        scriptUrl = localPath;
    } else {
        scriptUrl = MIRRORS[selectedMirror];
    }
    
    updateStatus('正在加载 CheerpJ 核心库...', 30);
    
    try {
        // 如果已经加载，就不重复加载
        if (!window.cheerpj) {
            await loadCheerpJScript(scriptUrl);
        }
        
        // 等待 cheerpj 初始化
        if (!window.cheerpj) {
            throw new Error('CheerpJ 加载成功但未暴露全局变量');
        }
        
        updateStatus('CheerpJ 核心库加载成功', 50);
        
        // 调用初始化
        await cheerpjInit({
            javaVersion: '8',
            initialHeapSize: 512 * 1024 * 1024,
            maxHeapSize: 2 * 1024 * 1024 * 1024
        });
        
        updateStatus('CheerpJ 运行时初始化成功', 70);
        return true;
    } catch (error) {
        console.error('CheerpJ 初始化失败:', error);
        showError('CheerpJ 初始化失败', error);
        return false;
    }
}

/**
 * 启动 Minecraft
 */
async function launchMinecraft() {
    if (isRunning) return;
    
    isRunning = true;
    elements.launchBtn.disabled = true;
    elements.errorDetail.style.display = 'none';
    
    try {
        // 1. 加载并初始化 CheerpJ
        const initOk = await initCheerpJWithMirror();
        if (!initOk) throw new Error('CheerpJ 初始化失败');
        
        // 2. 这里继续你的 Minecraft 启动逻辑...
        updateStatus('准备下载 Minecraft 客户端...', 80);
        
        // 为了测试，先弹个成功的提示
        setTimeout(() => {
            updateStatus('✅ CheerpJ 运行正常！可以继续开发 Minecraft 启动部分', 100);
        }, 1000);
        
    } catch (error) {
        showError('启动失败', error);
        isRunning = false;
        elements.launchBtn.disabled = false;
    }
}

/**
 * 重置环境
 */
function resetEnvironment() {
    updateStatus('环境已重置', 0);
    elements.progressFill.style.width = '0%';
    elements.errorDetail.style.display = 'none';
    isRunning = false;
    elements.launchBtn.disabled = false;
}

// 显示/隐藏本地路径输入
document.querySelectorAll('input[name="mirror"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        if (e.target.value === 'local') {
            elements.localPathInput.style.display = 'block';
        } else {
            elements.localPathInput.style.display = 'none';
        }
    });
});

// 绑定事件
elements.launchBtn.addEventListener('click', launchMinecraft);
elements.resetBtn.addEventListener('click', resetEnvironment);
elements.diagnoseBtn.addEventListener('click', diagnoseEnvironment);

// 页面加载时自动诊断
window.addEventListener('load', () => {
    diagnoseEnvironment();
});
