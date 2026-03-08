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
            
            // ⭐ 关键配置：启用 AWT 并指定容器
            await cheerpjInit({
                javaVersion: '17',
                initialHeapSize: 1024 * 1024 * 1024,
                awt: true,
                container: '#game-container',
                // 告诉 CheerpJ 使用新的窗口系统
                windowingSystem: 'cheerpj',
                // 预加载必要的类
                preloadClasses: [
                    'java.awt.Component',
                    'java.awt.Container',
                    'java.awt.Window',
                    'javax.swing.JFrame',
                    'javax.swing.JPanel'
                ]
            });
            
            updateStatus('启动游戏中...', 70);
            
            // 清空容器并设置样式
            if (gameContainer) {
                gameContainer.innerHTML = '';
                gameContainer.style.position = 'relative';
                gameContainer.style.overflow = 'hidden';
            }
            
            // ⭐ 运行游戏：使用 cheerpjRunJarWithClass 指定主类
            // 并加上系统属性强制使用 CheerpJ 的 AWT 实现
            const process = cheerpjRunJar('/app/mymcweb/minecraft/versions/1.7.10/1.7.10.jar', [
                '-Djava.awt.headless=false',
                '-Dcheerpj.awt.disable=true',  // 禁用旧版 AWT
                '-Dcheerpj.awt.enable=true',   // 启用新版 AWT
                'net.minecraft.client.main.Main',  // 明确指定主类
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
            
            // 轮询检查容器变化
            let checkCount = 0;
            const checkInterval = setInterval(() => {
                if (gameContainer.children.length > 0) {
                    console.log('✅ 画面已出现！子元素数:', gameContainer.children.length);
                    clearInterval(checkInterval);
                }
                checkCount++;
                if (checkCount > 30) { // 30秒后停止检查
                    clearInterval(checkInterval);
                    console.log('⚠️ 画面未出现，可能启动失败');
                }
            }, 1000);
            
        } catch (err) {
            console.error('❌ 启动失败:', err);
            updateStatus('❌ ' + err.message, 0);
        }
    }

    launchBtn.addEventListener('click', startGame);
    window.addEventListener('load', () => updateStatus('就绪', 0));
})();
