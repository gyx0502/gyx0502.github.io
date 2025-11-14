// Taraxa区块链账户查询器 - 主要逻辑
class TaraxaQuery {
    constructor() {
        this.rpcEndpoint = 'https://rpc.mainnet.taraxa.io';
        this.chainId = 841;
        this.currentBlockNumber = 0;
        this.queryHistory = this.loadQueryHistory();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateNetworkStatus();
        this.loadQuickQueries();
        this.startBlockUpdate();
    }

    setupEventListeners() {
        const addressInput = document.getElementById('address-input');
        const queryBtn = document.getElementById('query-btn');
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        // 地址输入验证
        addressInput.addEventListener('input', (e) => {
            this.validateAddress(e.target.value);
        });

        // 查询按钮点击
        queryBtn.addEventListener('click', () => {
            this.queryBalance();
        });

        // Enter键查询
        addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !queryBtn.disabled) {
                this.queryBalance();
            }
        });

        // 移动端菜单切换
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // 快速查询地址点击
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-query-btn')) {
                const address = e.target.dataset.address;
                document.getElementById('address-input').value = address;
                this.validateAddress(address);
                this.queryBalance();
            }
        });
    }

    validateAddress(address) {
        const queryBtn = document.getElementById('query-btn');
        const validationDiv = document.getElementById('address-validation');
        const errorDiv = document.getElementById('address-error');

        // 基本地址格式验证
        const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);

        if (address.length === 0) {
            queryBtn.disabled = true;
            validationDiv.innerHTML = '';
            errorDiv.classList.add('hidden');
            return;
        }

        if (isValid) {
            queryBtn.disabled = false;
            validationDiv.innerHTML = '<svg class="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>';
            errorDiv.classList.add('hidden');
        } else {
            queryBtn.disabled = true;
            validationDiv.innerHTML = '<svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>';
            errorDiv.classList.remove('hidden');
        }

        return isValid;
    }

    async queryBalance() {
        const address = document.getElementById('address-input').value;
        const queryBtn = document.getElementById('query-btn');
        const btnText = document.getElementById('btn-text');
        const loadingSpinner = document.getElementById('loading-spinner');
        const resultSection = document.getElementById('result-section');

        if (!this.validateAddress(address)) {
            this.showError('请输入有效的钱包地址');
            return;
        }

        // 显示加载状态
        queryBtn.disabled = true;
        btnText.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');

        try {
            const startTime = Date.now();
            
            // 构建RPC请求
            const requestData = {
                jsonrpc: '2.0',
                method: 'eth_getBalance',
                params: [address, 'latest'],
                id: 1
            };

            const response = await fetch(this.rpcEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            const latency = Date.now() - startTime;

            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(`RPC错误: ${data.error.message}`);
            }

            // 处理查询结果
            const balanceWei = data.result;
            const balanceTara = this.weiToTara(balanceWei);

            // 显示结果
            this.displayResult({
                address: address,
                balance: balanceTara,
                wei: balanceWei,
                latency: latency,
                timestamp: new Date()
            });

            // 添加到历史记录
            this.addToHistory(address, balanceTara);

            // 显示结果区域
            resultSection.classList.remove('hidden');
            
            // 滚动到结果区域
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (error) {
            console.error('查询失败:', error);
            this.showError(`查询失败: ${error.message}`);
        } finally {
            // 恢复按钮状态
            queryBtn.disabled = false;
            btnText.classList.remove('hidden');
            loadingSpinner.classList.add('hidden');
        }
    }

    displayResult(result) {
        document.getElementById('result-address').textContent = result.address;
        document.getElementById('result-balance').textContent = result.balance.toFixed(6);
        document.getElementById('query-time').textContent = result.timestamp.toLocaleString();
        document.getElementById('network-latency').textContent = `${result.latency}ms`;
        document.getElementById('result-block-height').textContent = this.currentBlockNumber;

        // 添加动画效果
        this.animateBalanceDisplay();
    }

    animateBalanceDisplay() {
        const balanceElement = document.getElementById('result-balance');
        
        anime({
            targets: balanceElement,
            scale: [0.8, 1],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .8)'
        });
    }

    weiToTara(wei) {
        // 1 TARA = 10^18 wei
        return parseInt(wei, 16) / Math.pow(10, 18);
    }

    async updateNetworkStatus() {
        const statusIndicator = document.getElementById('network-status');
        const statusText = document.getElementById('network-text');
        
        try {
            statusIndicator.className = 'status-indicator status-connecting';
            statusText.textContent = '正在连接网络...';

            const response = await fetch(this.rpcEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentBlockNumber = parseInt(data.result, 16);
                
                statusIndicator.className = 'status-indicator status-connected';
                statusText.textContent = '已连接到Taraxa主网';
                
                document.getElementById('block-number').textContent = `区块高度: ${this.currentBlockNumber.toLocaleString()}`;
            } else {
                throw new Error('网络连接失败');
            }
        } catch (error) {
            console.error('网络状态更新失败:', error);
            statusIndicator.className = 'status-indicator status-disconnected';
            statusText.textContent = '网络连接失败';
        }
    }

    startBlockUpdate() {
        // 每30秒更新一次区块高度
        setInterval(() => {
            this.updateNetworkStatus();
        }, 30000);
    }

    addToHistory(address, balance) {
        const query = {
            address: address,
            balance: balance,
            timestamp: new Date().toISOString()
        };

        // 避免重复记录
        this.queryHistory = this.queryHistory.filter(item => item.address !== address);
        
        // 添加到开头
        this.queryHistory.unshift(query);
        
        // 限制历史记录数量
        if (this.queryHistory.length > 10) {
            this.queryHistory = this.queryHistory.slice(0, 10);
        }

        // 保存到本地存储
        localStorage.setItem('taraxa-query-history', JSON.stringify(this.queryHistory));
        
        // 更新快速查询区域
        this.loadQuickQueries();
    }

    loadQueryHistory() {
        const saved = localStorage.getItem('taraxa-query-history');
        return saved ? JSON.parse(saved) : [];
    }

    loadQuickQueries() {
        const container = document.getElementById('quick-queries');
        
        if (this.queryHistory.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center text-gray-400 py-8">
                    暂无查询历史
                </div>
            `;
            return;
        }

        container.innerHTML = this.queryHistory.slice(0, 6).map(query => `
            <div class="glass-effect rounded-lg p-4 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors quick-query-btn" data-address="${query.address}">
                <div class="text-sm text-gray-400 mb-1">${new Date(query.timestamp).toLocaleDateString()}</div>
                <div class="text-white font-mono text-sm mb-2 truncate">${query.address}</div>
                <div class="text-teal-400 font-bold">${query.balance.toFixed(4)} TARA</div>
            </div>
        `).join('');
    }

    showError(message) {
        // 创建错误提示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-20 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        // 显示动画
        setTimeout(() => {
            errorDiv.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            errorDiv.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(errorDiv);
            }, 300);
        }, 5000);
    }

    showSuccess(message) {
        // 创建成功提示
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300';
        successDiv.textContent = message;
        
        document.body.appendChild(successDiv);
        
        // 显示动画
        setTimeout(() => {
            successDiv.classList.remove('translate-x-full');
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            successDiv.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(successDiv);
            }, 300);
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.taraxaQuery = new TaraxaQuery();
});

// 工具函数
const utils = {
    // 格式化地址显示
    formatAddress(address, length = 12) {
        if (!address || address.length <= length * 2) return address;
        return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
    },

    // 格式化数字
    formatNumber(num, decimals = 4) {
        return parseFloat(num).toFixed(decimals);
    },

    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    },

    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            window.taraxaQuery.showSuccess('地址已复制到剪贴板');
        } catch (err) {
            console.error('复制失败:', err);
            window.taraxaQuery.showError('复制失败');
        }
    }
};

// 导出工具函数
window.utils = utils;