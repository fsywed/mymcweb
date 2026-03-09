(function() {
    console.log('=== Minecraft 启动器 ===');
    
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    const launchBtn = document.getElementById('launch-btn');
    const gameContainer = document.getElementById('game-container');

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
            
            const jarPath = '/mymcweb/minecraft/versions/1.7.10/1.7.10.jar';
            console.log('检查文件:', jarPath);
            
            const res = await fetch(jarPath, { method: 'HEAD' });
            if (!res.ok) throw new Error(`文件不存在 (${res.status})`);
            console.log('✅ 文件存在');
            
            updateStatus('初始化 CheerpJ...', 30);
            
            // 初始化 CheerpJ
            await cheerpjInit({
                javaVersion: '17',
                initialHeapSize: 1024 * 1024 * 1024,
                awt: true,
                container: '#game-container'
            });
            
            // 创建显示
            if (cheerpjCreateDisplay) {
                cheerpjCreateDisplay('#game-container');
            }
            
            updateStatus('加载游戏核心...', 50);
            
            // 先加载 jar
            await cheerpjRunJar('/app/mymcweb/minecraft/versions/1.7.10/1.7.10.jar', []);
            
            updateStatus('启动游戏中...', 70);

            // ⭐ 只保留这一个运行命令
            cheerpjRunMain('net.minecraft.client.main.Main', [
                '--username', 'Player' + Math.floor(Math.random() * 10000),
                '--version', '1.7.10',
                '--gameDir', '/app/mymcweb/minecraft',
                '--assetsDir', '/app/mymcweb/minecraft/assets',
                '--assetIndex', '1.7.10',
                '--accessToken', 'dummy',
                '--width', '854',
                '--height', '480'
            ]).then(exitCode => {
                console.log('游戏退出，代码:', exitCode);
                if (exitCode !== 0) {
                    updateStatus(`❌ 游戏异常退出 (${exitCode})`, 0);
                }
            }).catch(err => {
                console.error('运行失败:', err);
                updateStatus('❌ 运行失败', 0);
            });
            
        } catch (err) {
            console.error('❌ 启动失败:', err);
            updateStatus('❌ ' + err.message, 0);
        }
    }

    launchBtn.addEventListener('click', startGame);
    window.addEventListener('load', () => updateStatus('就绪', 0));
})();
