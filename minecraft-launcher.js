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
            
            // ⭐ 关键：显式启用 AWT 支持，指定容器
            await cheerpjInit({
                javaVersion: '17',
                initialHeapSize: 1024 * 1024 * 1024,  // 1GB
                awt: true,  // 启用 AWT 支持
                container: '#game-container',
                // 预加载 AWT 相关类
                preloadClasses: [
                    'java.awt.Component',
                    'java.awt.Container',
                    'javax.swing.JFrame',
                    'javax.swing.JPanel'
                ]
            });
            
            updateStatus('启动游戏中...', 70);
            
            // 清空容器
            if (gameContainer) {
                gameContainer.innerHTML = '';
                gameContainer.style.background = '#000';
            }
            
            // 运行游戏 - 关键：加上 -Djava.awt.headless=false
            cheerpjRunJar('/app/mymcweb/minecraft/versions/1.7.10/1.7.10.jar', [
                '-Djava.awt.headless=false',  // 强制启用图形
                '--username', 'Player' + Math.floor(Math.random() * 10000),
                '--version', '1.7.10',
                '--gameDir', '/app/mymcweb/minecraft',
                '--assetsDir', '/app/mymcweb/minecraft/assets',
                '--assetIndex', '1.7.10',
                '--accessToken', 'dummy',
                '--width', '854',
                '--height', '480'
            ]);
            
            updateStatus('✅ 游戏运行中', 100);
            
            // 延迟后检查容器内容
            setTimeout(() => {
                console.log('容器内容:', gameContainer.innerHTML.slice(0, 200));
                console.log('容器高度:', gameContainer.clientHeight);
            }, 5000);
            
        } catch (err) {
            console.error('❌ 启动失败:', err);
            updateStatus('❌ ' + err.message, 0);
        }
    }

    launchBtn.addEventListener('click', startGame);
    window.addEventListener('load', () => updateStatus('就绪', 0));
})();
