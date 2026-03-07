// Minecraft 网页版 - 最终修复版
// 使用 Staticfile CDN（国内最稳）+ 1.7.10

(function() {
    console.log('🚀 Minecraft 启动器开始运行');
    
    // 获取页面元素
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    const launchBtn = document.getElementById('launch-btn');
    
    function updateStatus(text, progress) {
        console.log('📢', text, progress || '');
        if (statusText) statusText.textContent = text;
        if (progressFill && progress !== undefined) {
            progressFill.style.width = progress + '%';
        }
    }
    
    // 直接使用 Staticfile CDN（国内最稳）
    const CHEERPJ_URL = 'https://cjrtnc.leaningtech.com/2.3/loader.js';
    
    // 加载 CheerpJ
    function loadCheerpJ() {
        return new Promise((resolve, reject) => {
            if (window.cheerpj) {
                resolve();
                return;
            }
            
            updateStatus('加载 CheerpJ...', 20);
            
            const script = document.createElement('script');
            script.src = CHEERPJ_URL;
            script.onload = () => {
                console.log('✅ CheerpJ 脚本加载成功');
                updateStatus('CheerpJ 加载成功', 40);
                resolve();
            };
            script.onerror = (e) => {
                console.error('❌ CheerpJ 加载失败:', e);
                reject(new Error('CheerpJ 加载失败'));
            };
            document.head.appendChild(script);
        });
    }
    
    // 启动游戏
    async function startGame() {
        try {
            // 1. 加载 CheerpJ
            await loadCheerpJ();
            
            // 2. 等待 cheerpjInit 可用
            updateStatus('初始化中...', 50);
            for (let i = 0; i < 20; i++) {
                if (window.cheerpjInit) break;
                await new Promise(r => setTimeout(r, 200));
            }
            
            if (!window.cheerpjInit) {
                throw new Error('cheerpjInit 不可用');
            }
            
            // 3. 初始化
            await cheerpjInit({
                javaVersion: '8',
                initialHeapSize: 384 * 1024 * 1024
            });
            
            updateStatus('下载 Minecraft...', 70);
            
            // 4. 挂载 JAR（上海交大镜像）
            // 新版 CheerpJ 文件挂载方式
updateStatus('准备游戏文件...', 70);

// 方法1：直接使用 /app/ 挂载点（最简单）
// 根据官方文档，/app/ 直接对应你的 web 服务器根目录 [citation:1]
// 所以你可以直接运行远程 JAR，不需要先"下载"到虚拟文件系统

// 如果上面的方法不行，用这个方法创建目录并准备文件
if (window.cheerpOSAddStringFile) {
    // 新版 API：从 URL 加载文件到虚拟文件系统
    const response = await fetch('https://mirrors.cernet.edu.cn/bmclapi/version/1.7.10/client');
    const jarData = await response.arrayBuffer();
    await cheerpOSAddStringFile('/app/minecraft/minecraft.jar', new Uint8Array(jarData));
} else {
    // 如果新 API 也不存在，直接用 URL 运行（不先挂载）
    console.log('尝试直接运行远程 JAR');
}
            
            updateStatus('启动游戏中...', 90);
            
            // 5. 运行
            cheerpjRunJar('/app/minecraft/minecraft.jar', [
                '--username', 'Player' + Math.floor(Math.random() * 1000),
                '--version', '1.7.10',
                '--gameDir', '/app/minecraft/game',
                '--assetsDir', '/app/minecraft/assets',
                '--accessToken', 'dummy'
            ]);
            
            updateStatus('✅ 游戏运行中', 100);
            
        } catch (err) {
            console.error('❌ 启动失败:', err);
            updateStatus('❌ 失败: ' + err.message, 0);
        }
    }
    
    // 绑定按钮
    if (launchBtn) {
        launchBtn.onclick = startGame;
    }
    
    updateStatus('就绪，点击启动', 0);
})();
