(function() {
    console.log('=== Minecraft 启动器 ===');
    
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    const launchBtn = document.getElementById('launch-btn');

    function updateStatus(text, progress) {
        if (statusText) statusText.textContent = text;
        if (progressFill && progress !== undefined) {
            progressFill.style.width = progress + '%';
        }
        console.log(`[${progress || 0}%] ${text}`);
    }

    function waitForCheerpJ() {
        return new Promise((resolve, reject) => {
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
                    resolve();
                    return;
                }
                if (++attempts >= 50) {
                    clearInterval(interval);
                    reject(new Error('CheerpJ 加载超时'));
                }
            }, 100);
        });
    }

    async function startGame() {
        try {
            updateStatus('启动中...', 5);
            
            await waitForCheerpJ();
            
            // 检查文件
            const jarPath = '/mymcweb/minecraft/versions/1.7.10/1.7.10.jar';
            console.log('检查文件:', jarPath);
            
            const res = await fetch(jarPath, { method: 'HEAD' });
            if (!res.ok) throw new Error(`文件不存在 (${res.status})`);
            console.log('✅ 文件存在');
            
            updateStatus('初始化 CheerpJ...', 30);
            
            // ⭐ 简化版初始化：不加自定义挂载
            await cheerpjInit({
                javaVersion: '17',
                initialHeapSize: 512 * 1024 * 1024
                // 去掉 mounts，让 /app/ 默认指向服务器根目录
            });
            
            updateStatus('启动游戏中...', 70);
            
            // 路径加上仓库名
            cheerpjRunJar('/app/mymcweb/minecraft/versions/1.7.10/1.7.10.jar', [
                '--username', 'Player' + Math.floor(Math.random() * 10000),
                '--version', '1.7.10',
                '--gameDir', '/app/mymcweb/minecraft',
                '--assetsDir', '/app/mymcweb/minecraft/assets',
                '--assetIndex', '1.7.10',
                '--accessToken', 'dummy'
            ]);
            
            updateStatus('✅ 游戏运行中', 100);
            
        } catch (err) {
            console.error('❌ 启动失败:', err);
            updateStatus('❌ ' + err.message, 0);
        }
    }

    launchBtn.addEventListener('click', startGame);
    window.addEventListener('load', () => updateStatus('就绪', 0));
})();
