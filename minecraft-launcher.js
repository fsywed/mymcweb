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
});    elements.statusText.textContent = text;
    if (progress !== null) {
        elements.progressFill.style.width = `${progress}%`;
    }
}

/**
 * 初始化 CheerpJ 运行时环境
 */
async function initCheerpJ() {
    updateStatus('正在初始化 CheerpJ 运行时...', 10);
    
    try {
        // 调用 CheerpJ 的初始化 API
        await cheerpjInit({
            // 启用 Java 8 兼容模式
            javaVersion: '8',
            // 预加载必要的运行时库
            preloadJRE: CONFIG.runtimeLibs,
            // 启用虚拟文件系统
            enableFileSystem: true,
            // 设置初始堆内存大小 (512MB)
            initialHeapSize: 512 * 1024 * 1024,
            // 设置最大堆内存 (2GB)
            maxHeapSize: 2 * 1024 * 1024 * 1024,
            // 挂载虚拟磁盘
            mounts: {
                // 把浏览器的 IndexedDB 挂载为持久化存储
                '/app': new cheerpj.IDBMount('/app'),
                // 把当前 URL 的 /lib 目录挂载为只读
                '/lib': new cheerpj.HTTPMount('/lib', window.location.origin + '/lib')
            }
        });
        
        updateStatus('运行时初始化完成', 30);
        return true;
    } catch (error) {
        console.error('CheerpJ 初始化失败:', error);
        updateStatus('❌ 初始化失败: ' + error.message, 0);
        return false;
    }
}

/**
 * 下载并挂载 Minecraft 客户端 JAR
 */
async function mountMinecraftJar() {
    updateStatus('正在连接镜像源...', 40);
    
    try {
        // 创建虚拟目录
        await cheerpjCreateDirectory(CONFIG.mountPoint);
        
        // 从 BMCLAPI 下载客户端 JAR 并挂载到虚拟文件系统
        updateStatus('正在下载 Minecraft 客户端 (使用镜像加速)...', 50);
        
        // 使用 cheerpjAttachFile 把网络文件挂载到虚拟文件系统
        await cheerpjAttachFile(
            `${CONFIG.mountPoint}/minecraft.jar`,
            CONFIG.jarUrl,
            { mode: 'read' }
        );
        
        updateStatus('客户端文件准备就绪', 70);
        return true;
    } catch (error) {
        console.error('挂载 JAR 失败:', error);
        updateStatus('❌ 下载失败: ' + error.message, 0);
        return false;
    }
}

/**
 * 启动 Minecraft
 */
async function launchMinecraft() {
    if (isRunning) {
        alert('游戏已经在运行中');
        return;
    }
    
    isRunning = true;
    elements.launchBtn.disabled = true;
    
    try {
        // 1. 初始化运行时
        const initOk = await initCheerpJ();
        if (!initOk) throw new Error('初始化失败');
        
        // 2. 挂载游戏文件
        const mountOk = await mountMinecraftJar();
        if (!mountOk) throw new Error('挂载失败');
        
        // 3. 启动 Minecraft
        updateStatus('正在启动游戏...', 80);
        
        // 设置游戏窗口标题
        document.title = 'Minecraft · 网页版';
        
        // 调用 CheerpJ 运行 JAR 包
        // 注意：Minecraft 主类是 net.minecraft.client.main.Main
        const process = await cheerpjRunJar(
            `${CONFIG.mountPoint}/minecraft.jar`,
            ['--username', 'WebPlayer',  // 设置临时用户名
             '--version', CONFIG.mcVersion,
             '--gameDir', '/app/minecraft/game',
             '--assetsDir', '/app/minecraft/assets',
             '--accessToken', 'dummy',
             '--userProperties', '{}']
        );
        
        updateStatus('✅ 游戏运行中', 100);
        
        // 监听进程退出
        process.on('exit', (code) => {
            console.log('Minecraft 进程退出，退出码:', code);
            updateStatus('游戏已退出', 0);
            isRunning = false;
            elements.launchBtn.disabled = false;
            document.title = '我的世界 · 网页版';
        });
        
    } catch (error) {
        console.error('启动失败:', error);
        updateStatus('❌ 启动失败: ' + error.message, 0);
        isRunning = false;
        elements.launchBtn.disabled = false;
    }
}

/**
 * 重置 CheerpJ 环境
 */
async function resetEnvironment() {
    updateStatus('正在重置环境...', 0);
    
    try {
        // 清理虚拟文件系统
        await cheerpjRemoveDirectory('/app/minecraft', { recursive: true });
        
        // 重新创建目录
        await cheerpjCreateDirectory('/app/minecraft');
        
        updateStatus('环境已重置', 0);
    } catch (error) {
        console.error('重置失败:', error);
        updateStatus('❌ 重置失败', 0);
    }
    
    isRunning = false;
    elements.launchBtn.disabled = false;
}

// 绑定事件监听
elements.launchBtn.addEventListener('click', launchMinecraft);
elements.resetBtn.addEventListener('click', resetEnvironment);

// 页面加载时预检查
window.addEventListener('load', () => {
    // 检查浏览器是否支持 WebAssembly
    if (typeof WebAssembly !== 'object') {
        updateStatus('❌ 您的浏览器不支持 WebAssembly，无法运行 CheerpJ', 0);
        elements.launchBtn.disabled = true;
        return;
    }
    
    updateStatus('就绪，点击启动按钮开始', 0);
    console.log('Minecraft 网页启动器已加载');
});

// 错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    updateStatus('发生错误，请查看控制台', 0);
});
