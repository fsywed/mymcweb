(function() {
    console.log('=== 启动器 ===');
    
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    const launchBtn = document.getElementById('launch-btn');
// 在文件最开头加上
function waitForCheerpJ() {
    return new Promise((resolve) => {
        if (window.cheerpjInit) {
            resolve();
            return;
        }
        // 轮询检测
        let attempts = 0;
        const interval = setInterval(() => {
            if (window.cheerpjInit) {
                clearInterval(interval);
                resolve();
            }
            attempts++;
            if (attempts > 50) { // 5秒超时
                clearInterval(interval);
                console.error('CheerpJ 加载超时');
                updateStatus('❌ CheerpJ 加载超时', 0);
            }
        }, 100);
    });
}

    function updateStatus(text, progress) {
        
// 然后在 startGame 的第一行加上
await waitForCheerpJ();
        if (statusText) statusText.textContent = text;
        if (progressFill && progress !== undefined) {
            progressFill.style.width = progress + '%';
        }
        console.log(text, progress);
    }

    launchBtn.addEventListener('click', async function() {
        updateStatus('启动中...', 5);
        
        try {
            const jarPath = '/mymcweb/minecraft/versions/1.7.10/1.7.10.jar';
            
            console.log('检查文件:', jarPath);
            const res = await fetch(jarPath, { method: 'HEAD' });
            if (!res.ok) throw new Error(`文件不存在 (${res.status})`);
            console.log('✅ 文件存在');
            
            updateStatus('初始化 CheerpJ...', 30);
            
            // ✅ 注意这里是 cheerpjInit（带 Init）
            await cheerpjInit({
                javaVersion: '17',
                initialHeapSize: 512 * 1024 * 1024,
                mounts: {
                    '/app/minecraft': new cheerpj.HTTPMount('/mymcweb/minecraft')
                }
            });
            
            updateStatus('启动游戏中...', 70);
            
            // ✅ 注意这里是 cheerpjRunJar
            cheerpjRunJar('/app/minecraft/versions/1.7.10/1.7.10.jar', [
                '--username', 'Player' + Math.floor(Math.random() * 10000),
                '--version', '1.7.10',
                '--gameDir', '/app/minecraft',
                '--assetsDir', '/app/minecraft/assets',
                '--assetIndex', '1.7.10',
                '--accessToken', 'dummy'
            ]);
            
            updateStatus('✅ 运行中', 100);
            
        } catch (err) {
            console.error('❌', err);
            updateStatus('❌ ' + err.message, 0);
        }
    });
})();
