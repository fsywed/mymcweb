// Minecraft CheerpJ 启动器核心逻辑

// 配置参数
const CONFIG = {
    // 使用 BMCLAPI 镜像源加速下载（感谢 @bangbang93）
    mcVersion: '1.8.9',
    jarUrl: `https://bmclapi2.bangbang93.com/version/${this.mcVersion}/client`,
    // 虚拟文件系统挂载点
    mountPoint: '/app/minecraft',
    // 需要预加载的 CheerpJ 运行时库
    runtimeLibs: [
        'java.io',
        'java.awt',
        'javax.swing',
        'org.lwjgl'  // Minecraft 依赖的 LWJGL 库
    ]
};

// DOM 元素引用
const elements = {
    statusText: document.getElementById('status-text'),
    progressFill: document.getElementById('progress-fill'),
    launchBtn: document.getElementById('launch-btn'),
    resetBtn: document.getElementById('reset-btn'),
    gameContainer: document.getElementById('game-container')
};

// 状态管理
let isRunning = false;

/**
 * 更新状态显示
 * @param {string} text 状态文本
 * @param {number} progress 进度百分比 (0-100)
 */
function updateStatus(text, progress = null) {
    elements.statusText.textContent = text;
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
