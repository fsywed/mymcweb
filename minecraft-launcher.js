(function() {
    console.log('=== 启动器 ===');
    
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    const launchBtn = document.getElementById('launch-btn');

    function updateStatus(text, progress) {
        if (statusText) statusText.textContent = text;
        if (progressFill && progress !== undefined) {
            progressFill.style.width = progress + '%';
        }
        console.log(text, progress);
    }

    launchBtn.addEventListener('click', async function() {
        updateStatus('启动中...', 5);
        
        try {
            // 正确的路径：带上仓库名 mymcweb
            const baseUrl = '/mymcweb/minecraft';
            const jarPath = `${baseUrl}/versions/1.7.10/1.7.10.jar`;
            
            console.log('检查文件:', jarPath);
            
            // 测试文件
            const res = await fetch(jarPath, { method: 'HEAD' });
            if (!res.ok) throw new Error(`文件不存在 (${res.status})`);
            console.log('文件存在');
            
            updateStatus('初始化 CheerpJ...', 30);
            
            await cheerpjInit({
                javaVersion: '17',
                initialHeapSize: 512 * 1024 * 1024,
                mounts: {
                    '/app/minecraft': new cheerpj.HTTPMount('/mymcweb/minecraft')
                }
            });
            
            updateStatus('启动游戏中...', 70);
            
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
            console.error(err);
            updateStatus('❌ ' + err.message, 0);
        }
    });
})();
