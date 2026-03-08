(function() {
    // DOM 元素
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    const launchBtn = document.getElementById('launch-btn');

    function updateStatus(text, progress) {
        if (statusText) statusText.textContent = text;
        if (progressFill && progress !== undefined) {
            progressFill.style.width = progress + '%';
        }
        console.log(`[状态] ${text} ${progress ? progress + '%' : ''}`);
    }

    async function startGame() {
        try {
            updateStatus('初始化 CheerpJ...', 10);
            
            // 初始化 CheerpJ，设置正确的挂载点
            await cheerpjInit({
                javaVersion: '17',  // 1.7.10 需要 Java 17
                initialHeapSize: 1024 * 1024 * 1024,  // 1GB
                // 关键：将仓库中的 minecraft 目录挂载到虚拟文件系统的 /app/minecraft
                mounts: {
                    // 这里不需要额外配置，/app/ 默认指向服务器根目录
                    // 你的文件在服务器上的 /minecraft/，所以在虚拟文件系统里就是 /app/minecraft/
                }
            });

            updateStatus('准备启动...', 40);
            
            // 检查文件是否存在
            try {
                // 注意路径：/app/minecraft/... 对应服务器上的 /minecraft/...
                const response = await fetch('/minecraft/versions/1.7.10/1.7.10.jar', { method: 'HEAD' });
                if (!response.ok) {
                    throw new Error(`核心文件不存在 (HTTP ${response.status})`);
                }
                console.log('✅ 核心文件存在');
            } catch (e) {
                throw new Error('无法访问核心文件，请确保文件已上传到 /minecraft/versions/1.7.10/1.7.10.jar');
            }

            updateStatus('启动游戏中...', 70);

            // 运行 Minecraft
            // 路径格式：/app/minecraft/... 对应服务器的 /minecraft/...
            const process = cheerpjRunJar('/app/minecraft/versions/1.7.10/1.7.10.jar', [
                '--username', 'Player' + Math.floor(Math.random() * 10000),
                '--version', '1.7.10',
                '--gameDir', '/app/minecraft',           // 游戏目录指向 /minecraft
                '--assetsDir', '/app/minecraft/assets',  // 资源目录
