(function() {
    console.log('=== Minecraft 启动器 ===');
    
    // DOM 元素
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    const launchBtn = document.getElementById('launch-btn');

    // 更新状态函数（必须先定义）
    function updateStatus(text, progress) {
        if (statusText) statusText.textContent = text;
        if (progressFill && progress !== undefined) {
            progressFill.style.width = progress + '%';
        }
        console.log(`[${progress || 0}%] ${text}`);
    }

    // 等待 CheerpJ 加载
    function waitForCheerpJ() {
        return new Promise((resolve, reject) => {
            // 如果已经存在，直接返回
            if (window.cheerpjInit) {
                console.log('CheerpJ 已就绪');
                resolve();
                return;
            }

            console.log('等待 CheerpJ 加载...');
            let attempts = 0;
            const interval = setInterval(() => {
                if (window.cheerpjInit) {
                    clearInterval(interval);
                    console.log('CheerpJ 加载完成');
                    resolve();
                    return;
                }
                
                attempts++;
                if (attempts >= 50) { // 5秒超时
                    clearInterval(interval);
                    reject(new Error('CheerpJ 加载超时'));
                }
            }, 100);
        });
    }

    // 启动游戏
    async function startGame() {
        try {
            updateStatus('启动中...', 5);
            
            // 1. 等待 CheerpJ 加载
            await waitForCheerpJ();
            
            // 2. 检查文件
            const jarPath = '/mymcweb/minecraft/versions/1.7.10/1.7.10.jar';
            console.log('检查文件:', jarPath);
            
            const res = await fetch(jarPath, { method: 'HEAD' });
            if (!res.ok) throw new Error(`文件不存在 (${res.status})`);
            console.log('✅ 文件存在');
            
            // 3. 初始化 CheerpJ
            updateStatus('初始化 CheerpJ...', 30);
            await cheerpjInit({
                javaVersion: '17',
                initialHeapSize: 512 * 1024 * 1024,
                mounts: {
                    '/app/minecraft': new cheerpj.HTTPMount('/mymcweb/minecraft')
                }
            });
            
            // 4. 运行游戏
            updateStatus('启动游戏中...', 70);
            cheerpjRunJar('/app/minecraft/versions/1.7.10/1.7.10.jar', [
                '--username', 'Player' + Math.floor(Math.random() * 10000),
                '--version', '1.7.10',
                '--gameDir', '/app/minecraft',
                '--assetsDir', '/app/minecraft/assets',
                '--assetIndex', '1.7.10',
                '--accessToken', 'dummy'
            ]);
            
            updateStatus('✅ 游戏运行中', 100);
            
        } catch (err) {
            console.error('❌ 启动失败:', err);
            updateStatus('❌ ' + err.message, 0);
        }
    }

    // 绑定按钮
    if (launchBtn) {
        launchBtn.addEventListener('click', startGame);
    }

    // 页面加载完成提示
    window.addEventListener('load', () => {
        console.log('页面加载完成');
        updateStatus('就绪，点击启动', 0);
    });
})();
