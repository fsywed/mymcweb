// ============================================
// Minecraft 网页版 - 最终调试版
// 版本: 1.7.10 | 镜像: 上海交大 BMCLAPI
// ============================================

(function() {
    console.log('🚀 Minecraft 启动器开始运行');
    
    // 获取页面元素
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');
    const launchBtn = document.getElementById('launch-btn');
    const gameContainer = document.getElementById('game-container');
    
    // 更新状态
    function updateStatus(text, progress) {
        console.log('📢 状态:', text, progress || '');
        if (statusText) statusText.textContent = text;
        if (progressFill && progress !== undefined) {
            progressFill.style.width = progress + '%';
        }
    }
    
    // 更新诊断项
    function updateDiag(id, text, className) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
            if (className) el.className = 'diag-value ' + className;
        }
    }
    
    // ========================================
    // 1. 页面加载完成后的基础检测
    // ========================================
    window.addEventListener('load', function() {
        console.log('📄 页面加载完成');
        updateStatus('检测环境中...', 5);
        
        // 检测 WebAssembly
        const wasmSupported = typeof WebAssembly === 'object';
        updateDiag('diag-wasm', wasmSupported ? '✅ 支持' : '❌ 不支持', 
                  wasmSupported ? 'success' : 'error');
        
        // 检测内存 (估算)
        updateDiag('diag-memory', '2GB+ (预估)', 'success');
        
        // 检测是否已有 CheerpJ
        if (window.cheerpj) {
            updateDiag('diag-cheerpj', '✅ 已加载', 'success');
        } else {
            updateDiag('diag-cheerpj', '⏳ 等待加载', 'warning');
        }
        
        updateStatus('就绪，请点击启动', 0);
    });
    
    // ========================================
    // 2. 镜像源切换逻辑
    // ========================================
    const mirrorRadios = document.querySelectorAll('input[name="mirror"]');
    const localPathDiv = document.getElementById('local-path-input');
    
    if (mirrorRadios.length) {
        mirrorRadios.forEach(radio => {
            radio.addEventListener('change', function(e) {
                if (localPathDiv) {
                    localPathDiv.style.display = e.target.value === 'local' ? 'block' : 'none';
                }
                updateDiag('diag-cheerpj', '⏳ 镜像已切换，需重新启动', 'warning');
            });
        });
    }
    
    // ========================================
    // 3. 检测镜像源连接
    // ========================================
    async function testMirror(url) {
        try {
            const res = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // 测试常用镜像
    Promise.all([
        testMirror('https://cdn.jsdelivr.net/npm/@leaningtech/cheerpj@3.2.0/cheerpj.js'),
        testMirror('https://unpkg.com/@leaningtech/cheerpj@3.2.0/cheerpj.js')
    ]).then(results => {
        const mirrorEl = document.getElementById('diag-mirror');
        if (mirrorEl) {
            if (results[0]) {
                mirrorEl.innerHTML = '✅ jsDelivr 可用';
                mirrorEl.className = 'diag-value success';
            } else if (results[1]) {
                mirrorEl.innerHTML = '✅ UNPKG 可用';
                mirrorEl.className = 'diag-value success';
            } else {
                mirrorEl.innerHTML = '❌ 镜像均不可用';
                mirrorEl.className = 'diag-value error';
            }
        }
    });
    
    // ========================================
    // 4. 启动游戏主函数
    // ========================================
    async function startGame() {
        console.log('🎮 启动按钮被点击');
        updateStatus('启动流程开始...', 10);
        
        // 获取选中的镜像
        let selectedMirror = 'jsdelivr';
        for (let radio of mirrorRadios) {
            if (radio.checked) {
                selectedMirror = radio.value;
                break;
            }
        }
        
        // 确定 CheerpJ 脚本地址
        let scriptUrl = 'https://cdn.jsdelivr.net/npm/@leaningtech/cheerpj@3.2.0/cheerpj.js';
        if (selectedMirror === 'unpkg') {
            scriptUrl = 'https://unpkg.com/@leaningtech/cheerpj@3.2.0/cheerpj.js';
        } else if (selectedMirror === 'staticfile') {
            scriptUrl = 'https://cdn.staticfile.net/cheerpj/3.2.0/cheerpj.js';
        } else if (selectedMirror === 'local') {
            const localInput = document.querySelector('.local-path input');
            scriptUrl = localInput ? localInput.value : 'js/cheerpj.js';
            if (!scriptUrl) {
                alert('请填写本地 cheerpj.js 路径');
                return;
            }
        }
        
        console.log('📡 使用镜像:', selectedMirror, scriptUrl);
        
        // ===== 如果 CheerpJ 还没加载，先加载 =====
        if (!window.cheerpj) {
            updateStatus('正在加载 CheerpJ...', 20);
            
            try {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = scriptUrl;
                    script.onload = () => {
                        console.log('✅ CheerpJ 脚本加载成功');
                        updateDiag('diag-cheerpj', '✅ 已加载', 'success');
                        resolve();
                    };
                    script.onerror = () => {
                        console.error('❌ CheerpJ 脚本加载失败');
                        updateDiag('diag-cheerpj', '❌ 加载失败', 'error');
                        reject(new Error('CheerpJ 加载失败'));
                    };
                    document.head.appendChild(script);
                });
            } catch (e) {
                updateStatus('❌ CheerpJ 加载失败', 0);
                return;
            }
        }
        
        // ===== 等待 cheerpjInit 可用 =====
        updateStatus('等待 CheerpJ 初始化...', 40);
        
        // 轮询检查 cheerpjInit 是否存在
        let initReady = false;
        for (let i = 0; i < 20; i++) {
            if (window.cheerpjInit) {
                initReady = true;
                break;
            }
            console.log('⏳ 等待 cheerpjInit...', i);
            await new Promise(r => setTimeout(r, 200));
        }
        
        if (!initReady) {
            updateStatus('❌ CheerpJ 初始化函数不可用', 0);
            console.error('cheerpjInit 未定义');
            return;
        }
        
        console.log('✅ cheerpjInit 可用，开始初始化');
        
        // ===== 初始化 CheerpJ =====
        try {
            updateStatus('初始化 CheerpJ 运行时...', 50);
            
            await cheerpjInit({
                javaVersion: '8',
                initialHeapSize: 384 * 1024 * 1024,
                maxHeapSize: 768 * 1024 * 1024,
                disableSecurityManager: true
            });
            
            console.log('✅ CheerpJ 初始化成功');
            
        } catch (e) {
            console.error('❌ CheerpJ 初始化失败:', e);
            updateStatus('❌ 初始化失败: ' + e.message, 0);
            return;
        }
        
        // ===== 挂载 Minecraft JAR =====
        try {
            updateStatus('准备下载 Minecraft 1.7.10...', 60);
            
            // 创建目录
            if (window.cheerpjCreateDirectory) {
                await cheerpjCreateDirectory('/app/minecraft');
                console.log('✅ 创建虚拟目录成功');
            }
            
            // 挂载 JAR（上海交大镜像）
            updateStatus('下载游戏中 (约100MB)...', 70);
            
            if (window.cheerpjAttachFile) {
                await cheerpjAttachFile(
                    '/app/minecraft/minecraft.jar',
                    'https://mirrors.cernet.edu.cn/bmclapi/version/1.7.10/client',
                    { mode: 'read' }
                );
                console.log('✅ JAR 挂载成功');
            } else {
                throw new Error('cheerpjAttachFile 不可用');
            }
            
        } catch (e) {
            console.error('❌ 挂载失败:', e);
            updateStatus('❌ 下载失败: ' + e.message, 0);
            return;
        }
        
        // ===== 启动 Minecraft =====
        try {
            updateStatus('启动游戏中...', 90);
            
            if (window.cheerpjRunJar) {
                const proc = cheerpjRunJar('/app/minecraft/minecraft.jar', [
                    '--username', 'Player' + Math.floor(Math.random() * 1000),
                    '--version', '1.7.10',
                    '--gameDir', '/app/minecraft/game',
                    '--assetsDir', '/app/minecraft/assets',
                    '--accessToken', 'dummy'
                ]);
                
                console.log('✅ 游戏进程已启动', proc);
                updateStatus('✅ 游戏运行中', 100);
                
                if (gameContainer) {
                    gameContainer.style.borderColor = '#4caf50';
                }
            } else {
                throw new Error('cheerpjRunJar 不可用');
            }
            
        } catch (e) {
            console.error('❌ 启动失败:', e);
            updateStatus('❌ 启动失败: ' + e.message, 0);
        }
    }
    
    // ========================================
    // 5. 绑定按钮事件
    // ========================================
    if (launchBtn) {
        launchBtn.addEventListener('click', startGame);
        console.log('✅ 启动按钮已绑定');
    } else {
        console.error('❌ 找不到启动按钮');
    }
    
    // 重置按钮
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            updateStatus('环境已重置', 0);
            if (gameContainer) {
                gameContainer.style.borderColor = 'rgba(107, 140, 255, 0.3)';
            }
            if (window.cheerpjRemoveDirectory) {
                cheerpjRemoveDirectory('/app/minecraft', { recursive: true }).catch(() => {});
            }
        });
    }
    
    console.log('✅ Minecraft 启动器初始化完成');
})();
