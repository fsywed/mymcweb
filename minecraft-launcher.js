(function() {
    console.log('=== Minecraft 启动器（最终版）===');
    
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
                resolve();
                return;
            }
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
            
            updateStatus('初始化 CheerpJ...', 30);
            await cheerpjInit({
                javaVersion: '8',
                awt: true,
                canvas: '#game-container'
            });
            
            if (typeof cheerpjCreateDisplay === 'function') {
                cheerpjCreateDisplay('#game-container');
            }
            
            updateStatus('启动游戏中...', 50);
            
            const jarUrl = '/mymcweb/minecraft/versions/1.7.10/1.7.10.jar';
            console.log(`加载 JAR: ${jarUrl}`);
            
            // ⭐ 关键修改：不等待 Promise，让它在后台运行
            // Minecraft 是持续运行的游戏，Promise 不会完成
            cheerpjRunJar(jarUrl, [
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
                updateStatus(`游戏已退出 (${exitCode})`, 0);
            }).catch(err => {
                console.error('游戏运行错误:', err);
                updateStatus('❌ 游戏运行出错', 0);
            });
            
            updateStatus('✅ 游戏运行中', 100);
            
        } catch (err) {
            console.error('❌ 启动失败:', err);
            updateStatus('❌ ' + err.message, 0);
        }
    }

    launchBtn.addEventListener('click', startGame);
    window.addEventListener('load', () => updateStatus('就绪', 0));
})();
