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
    const CHEERPJ_URL = 'https://cdn.staticfile.net/cheerpj/3.2.0/cheerpj.js';
    
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
            if (window.cheerpjCreateDirectory) {
                await cheerpjCreateDirectory('/app/minecraft');
            }
            
            await cheerpjAttachFile(
                '/app/minecraft/minecraft.jar',
                'https://mirrors.cernet.edu.cn/bmclapi/version/1.7.10/client',
                { mode: 'read' }
            );
            
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
