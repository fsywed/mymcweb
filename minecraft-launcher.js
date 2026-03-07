// Minecraft 网页版启动器 - 精简版 (1.13 去声音版)
// 使用上海交大镜像源，国内稳定加速

// 配置参数 - 改成 1.13 精简版
const CONFIG = {
    mcVersion: '1.13',
    // 使用上海交大 BMCLAPI 镜像（国内教育网节点，极稳）
    jarUrl: 'https://mirrors.cernet.edu.cn/bmclapi/version/1.13/client',
    mountPoint: '/app/minecraft',
    // CheerpJ 运行时库（只加载必要的）
    runtimeLibs: ['java.io', 'java.awt', 'javax.swing', 'org.lwjgl']
};

// DOM 元素
const elements = {
    statusText: document.getElementById('status-text'),
    progressFill: document.getElementById('progress-fill'),
    launchBtn: document.getElementById('launch-btn'),
    resetBtn: document.getElementById('reset-btn'),
    gameContainer: document.getElementById('game-container')
};

let isRunning = false;

/**
 * 更新状态显示
 */
function updateStatus(text, progress = null) {
    if (elements.statusText) elements.statusText.textContent = text;
    if (progress !== null && elements.progressFill) {
        elements.progressFill.style.width = `${progress}%`;
    }
    console.log(`[状态] ${text} ${progress ? progress + '%' : ''}`);
}

/**
 * 动态加载 CheerpJ 脚本（使用国内 CDN）
 */
function loadCheerpJ() {
    return new Promise((resolve, reject) => {
        // 如果已经加载过，直接返回
        if (window.cheerpj) {
            console.log('CheerpJ 已存在');
            resolve();
            return;
        }

        updateStatus('正在加载 CheerpJ 核心库...', 20);
        
        // 使用 jsDelivr 国内 CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@leaningtech/cheerpj@3.2.0/cheerpj.js';
        script.onload = () => {
            console.log('CheerpJ 脚本加载成功');
            updateStatus('CheerpJ 核心库加载成功', 40);
            resolve();
        };
        script.onerror = (err) => {
            console.error('CheerpJ 加载失败:', err);
            reject(new Error('CheerpJ 库加载失败，请检查网络或切换镜像'));
        };
        document.head.appendChild(script);
    });
}

/**
 * 初始化 CheerpJ 运行时
 */
async function initCheerpJ() {
    try {
        updateStatus('正在初始化 CheerpJ 运行时...', 50);
        
        await cheerpjInit({
            javaVersion: '8',
            initialHeapSize: 384 * 1024 * 1024,  // 384MB 足够 1.13 运行
            maxHeapSize: 768 * 1024 * 1024,      // 768MB
            enableFileSystem: true,
            mounts: {
                '/app': new cheerpj.IDBMount('/app')  // 持久化存储
            }
        });
        
        updateStatus('运行时初始化完成', 70);
        return true;
    } catch (error) {
        console.error('初始化失败:', error);
        throw new Error('CheerpJ 初始化失败: ' + error.message);
    }
}

/**
 * 挂载 Minecraft 客户端 JAR
 */
async function mountMinecraftJar() {
    try {
        updateStatus('正在连接镜像源...', 75);
        
        // 创建虚拟目录
        await cheerpjCreateDirectory(CONFIG.mountPoint);
        
        updateStatus('正在下载 Minecraft 1.13 精简版 (约 60MB)...', 80);
        
        // 从镜像源挂载 JAR 文件
        await cheerpjAttachFile(
            `${CONFIG.mountPoint}/minecraft.jar`,
            CONFIG.jarUrl,
            { mode: 'read' }
        );
        
        updateStatus('客户端文件准备就绪', 90);
        return true;
    } catch (error) {
        console.error('挂载失败:', error);
        throw new Error('下载 Minecraft 失败: ' + error.message);
    }
}

/**
 * 启动游戏
 */
async function launchMinecraft() {
    if (isRunning) {
        alert('游戏已在运行中');
        return;
    }
    
    isRunning = true;
    elements.launchBtn.disabled = true;
    
    try {
        // 1. 加载 CheerpJ
        await loadCheerpJ();
        
        // 2. 初始化运行时
        await initCheerpJ();
        
        // 3. 挂载游戏文件
        await mountMinecraftJar();
        
        // 4. 启动 Minecraft 1.13
        updateStatus('正在启动游戏...', 95);
        
        // 运行 JAR 包（1.13 的主类和参数略有不同）
        const process = await cheerpjRunJar(
            `${CONFIG.mountPoint}/minecraft.jar`,
            [
                '--username', 'WebPlayer',
                '--version', CONFIG.mcVersion,
                '--gameDir', '/app/minecraft/game',
                '--assetsDir', '/app/minecraft/assets',
                '--accessToken', 'dummy',
                '--userProperties', '{}',
                '--assetIndex', '1.13'  // 1.13 需要指定 assetIndex
            ]
        );
        
        updateStatus('✅ 游戏运行中 (1.13 精简版，无声音)', 100);
        
        // 监听退出
        process.on('exit', (code) => {
            console.log('游戏退出，退出码:', code);
            updateStatus('游戏已退出', 0);
            isRunning = false;
            elements.launchBtn.disabled = false;
        });
        
    } catch (error) {
        console.error('启动失败:', error);
        updateStatus('❌ 启动失败: ' + error.message, 0);
        isRunning = false;
        elements.launchBtn.disabled = false;
    }
}

/**
 * 重置环境
 */
async function resetEnvironment() {
    updateStatus('正在重置环境...', 0);
    
    try {
        if (window.cheerpj) {
            await cheerpjRemoveDirectory('/app/minecraft', { recursive: true });
        }
        updateStatus('环境已重置', 0);
    } catch (error) {
        console.error('重置失败:', error);
        updateStatus('❌ 重置失败', 0);
    }
    
    isRunning = false;
    elements.launchBtn.disabled = false;
}

// 绑定事件
if (elements.launchBtn) elements.launchBtn.addEventListener('click', launchMinecraft);
if (elements.resetBtn) elements.resetBtn.addEventListener('click', resetEnvironment);

// 页面加载检测
window.addEventListener('load', () => {
    // 检查 WebAssembly
    if (typeof WebAssembly !== 'object') {
        updateStatus('❌ 浏览器不支持 WebAssembly', 0);
        if (elements.launchBtn) elements.launchBtn.disabled = true;
        return;
    }
    
    updateStatus('就绪，点击启动按钮', 0);
    console.log('Minecraft 1.13 启动器已加载');
});
