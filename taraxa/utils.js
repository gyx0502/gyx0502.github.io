// Taraxa区块链查询器 - 工具函数库

const TaraxaUtils = {
    // 地址相关工具函数
    address: {
        // 验证地址格式
        isValid(address) {
            return /^0x[a-fA-F0-9]{40}$/.test(address);
        },

        // 格式化地址显示
        format(address, length = 8) {
            if (!address || address.length <= length * 2 + 2) {
                return address;
            }
            return `${address.substring(0, length + 2)}...${address.substring(address.length - length)}`;
        },

        // 标准化地址
        normalize(address) {
            if (!address) return '';
            return address.toLowerCase();
        },

        // 生成随机地址（仅用于测试）
        generateRandom() {
            const chars = '0123456789abcdef';
            let address = '0x';
            for (let i = 0; i < 40; i++) {
                address += chars[Math.floor(Math.random() * chars.length)];
            }
            return address;
        }
    },

    // 数字相关工具函数
    number: {
        // wei转换为TARA
        weiToTara(wei) {
            if (typeof wei === 'string' && wei.startsWith('0x')) {
                return parseInt(wei, 16) / Math.pow(10, 18);
            }
            return parseInt(wei) / Math.pow(10, 18);
        },

        // TARA转换为wei
        taraToWei(tara) {
            return Math.floor(tara * Math.pow(10, 18)).toString();
        },

        // 格式化数字显示
        format(num, decimals = 6) {
            return parseFloat(num).toFixed(decimals);
        },

        // 大数字缩写显示
        abbreviate(num) {
            if (num >= 1000000000) {
                return (num / 1000000000).toFixed(2) + 'B';
            }
            if (num >= 1000000) {
                return (num / 1000000).toFixed(2) + 'M';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(2) + 'K';
            }
            return num.toFixed(2);
        }
    },

    // 时间相关工具函数
    time: {
        // 格式化时间
        format(timestamp, format = 'YYYY-MM-DD HH:mm:ss') {
            const date = new Date(timestamp);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day)
                .replace('HH', hours)
                .replace('mm', minutes)
                .replace('ss', seconds);
        },

        // 相对时间显示
        fromNow(timestamp) {
            const now = new Date();
            const time = new Date(timestamp);
            const diff = now - time;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return '刚刚';
            if (minutes < 60) return `${minutes}分钟前`;
            if (hours < 24) return `${hours}小时前`;
            if (days < 30) return `${days}天前`;
            return this.format(timestamp, 'YYYY-MM-DD');
        },

        // 时间差计算
        timeDiff(timestamp1, timestamp2) {
            const diff = Math.abs(new Date(timestamp1) - new Date(timestamp2));
            return {
                milliseconds: diff,
                seconds: Math.floor(diff / 1000),
                minutes: Math.floor(diff / 60000),
                hours: Math.floor(diff / 3600000),
                days: Math.floor(diff / 86400000)
            };
        }
    },

    // 字符串相关工具函数
    string: {
        // 截断字符串
        truncate(str, maxLength, suffix = '...') {
            if (str.length <= maxLength) return str;
            return str.substring(0, maxLength - suffix.length) + suffix;
        },

        // 首字母大写
        capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        },

        // 转换为标题格式
        toTitleCase(str) {
            return str.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
        },

        // 去除空白字符
        trim(str) {
            return str ? str.trim() : '';
        }
    },

    // 存储相关工具函数
    storage: {
        // 安全设置本地存储
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('存储失败:', error);
                return false;
            }
        },

        // 安全获取本地存储
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('读取失败:', error);
                return defaultValue;
            }
        },

        // 安全删除本地存储
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('删除失败:', error);
                return false;
            }
        },

        // 清空所有存储
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('清空失败:', error);
                return false;
            }
        },

        // 获取存储大小
        size() {
            try {
                return new Blob(Object.values(localStorage)).size;
            } catch (error) {
                console.error('计算大小失败:', error);
                return 0;
            }
        }
    },

    // 网络相关工具函数
    network: {
        // 检查网络状态
        async checkConnection() {
            try {
                const response = await fetch('https://rpc.mainnet.taraxa.io', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        method: 'eth_blockNumber',
                        params: [],
                        id: 1
                    }),
                    timeout: 5000
                });
                return response.ok;
            } catch (error) {
                return false;
            }
        },

        // 计算网络延迟
        async measureLatency(url = 'https://rpc.mainnet.taraxa.io') {
            const start = Date.now();
            try {
                await fetch(url, { method: 'HEAD', mode: 'no-cors' });
                return Date.now() - start;
            } catch (error) {
                return -1; // 表示无法测量
            }
        },

        // 格式化网络状态
        formatStatus(connected, latency = null) {
            if (!connected) {
                return { text: '离线', color: 'text-red-400', icon: '🔴' };
            }
            if (latency === null || latency < 0) {
                return { text: '在线', color: 'text-green-400', icon: '🟢' };
            }
            if (latency < 100) {
                return { text: `在线 (${latency}ms)`, color: 'text-green-400', icon: '🟢' };
            }
            if (latency < 500) {
                return { text: `在线 (${latency}ms)`, color: 'text-yellow-400', icon: '🟡' };
            }
            return { text: `在线 (${latency}ms)`, color: 'text-orange-400', icon: '🟠' };
        }
    },

    // 验证相关工具函数
    validation: {
        // 验证邮箱
        isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },

        // 验证URL
        isValidURL(url) {
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },

        // 验证JSON字符串
        isValidJSON(str) {
            try {
                JSON.parse(str);
                return true;
            } catch {
                return false;
            }
        },

        // 验证数字
        isValidNumber(num) {
            return !isNaN(num) && isFinite(num);
        }
    },

    // 性能相关工具函数
    performance: {
        // 测量函数执行时间
        measure(fn, ...args) {
            const start = performance.now();
            const result = fn(...args);
            const end = performance.now();
            return {
                result,
                duration: end - start
            };
        },

        // 防抖函数
        debounce(fn, delay) {
            let timeoutId;
            return function(...args) {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
        },

        // 节流函数
        throttle(fn, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    fn.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    },

    // UI相关工具函数
    ui: {
        // 显示加载状态
        showLoading(element) {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            if (element) {
                element.innerHTML = '<div class="loading-spinner mx-auto"></div>';
            }
        },

        // 隐藏加载状态
        hideLoading(element, originalContent = '') {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            if (element) {
                element.innerHTML = originalContent;
            }
        },

        // 滚动到元素
        scrollTo(element, offset = 0) {
            if (typeof element === 'string') {
                element = document.querySelector(element);
            }
            if (element) {
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                    top: elementPosition - offset,
                    behavior: 'smooth'
                });
            }
        },

        // 显示通知
        showNotification(message, type = 'info', duration = 3000) {
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                warning: 'bg-yellow-500',
                info: 'bg-blue-500'
            };

            const notification = document.createElement('div');
            notification.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform duration-300`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // 显示动画
            setTimeout(() => {
                notification.classList.remove('translate-x-full');
            }, 100);
            
            // 自动隐藏
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, duration);

            return notification;
        }
    },

    // 数学相关工具函数
    math: {
        // 随机数生成
        random(min, max) {
            return Math.random() * (max - min) + min;
        },

        // 随机整数生成
        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },

        // 数组求和
        sum(arr) {
            return arr.reduce((a, b) => a + b, 0);
        },

        // 数组平均值
        average(arr) {
            return arr.length > 0 ? this.sum(arr) / arr.length : 0;
        },

        // 数组最大值
        max(arr) {
            return Math.max(...arr);
        },

        // 数组最小值
        min(arr) {
            return Math.min(...arr);
        }
    }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TaraxaUtils;
} else {
    window.TaraxaUtils = TaraxaUtils;
}