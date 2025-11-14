// 视觉效果和动画控制
class VisualEffects {
    constructor() {
        this.pixiApp = null;
        this.particles = [];
        this.init();
    }

    init() {
        this.initParticleSystem();
        this.initScrollAnimations();
        this.initHoverEffects();
        this.initBackgroundEffects();
    }

    // 初始化粒子系统
    initParticleSystem() {
        try {
            // 创建PIXI应用
            this.pixiApp = new PIXI.Application({
                width: window.innerWidth,
                height: window.innerHeight,
                backgroundColor: 0x000000,
                backgroundAlpha: 0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            // 添加到背景
            const canvas = this.pixiApp.view;
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '-1';
            canvas.style.pointerEvents = 'none';
            document.body.appendChild(canvas);

            // 创建粒子容器
            this.particleContainer = new PIXI.Container();
            this.pixiApp.stage.addChild(this.particleContainer);

            // 初始化粒子
            this.createParticles();

            // 启动动画循环
            this.pixiApp.ticker.add(() => {
                this.updateParticles();
            });

            // 响应窗口大小变化
            window.addEventListener('resize', () => {
                this.pixiApp.renderer.resize(window.innerWidth, window.innerHeight);
            });

        } catch (error) {
            console.log('粒子系统初始化失败:', error);
            // 降级到CSS动画
            this.initFallbackEffects();
        }
    }

    // 创建粒子
    createParticles() {
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            
            // 随机大小和颜色
            const size = Math.random() * 3 + 1;
            const color = Math.random() > 0.5 ? 0x319795 : 0xed8936;
            
            particle.beginFill(color, 0.6);
            particle.drawCircle(0, 0, size);
            particle.endFill();
            
            // 随机位置
            particle.x = Math.random() * window.innerWidth;
            particle.y = Math.random() * window.innerHeight;
            
            // 随机速度
            particle.vx = (Math.random() - 0.5) * 0.5;
            particle.vy = (Math.random() - 0.5) * 0.5;
            
            // 随机透明度变化
            particle.alphaSpeed = (Math.random() - 0.5) * 0.02;
            
            this.particles.push(particle);
            this.particleContainer.addChild(particle);
        }
    }

    // 更新粒子
    updateParticles() {
        this.particles.forEach(particle => {
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 更新透明度
            particle.alpha += particle.alphaSpeed;
            if (particle.alpha <= 0.1 || particle.alpha >= 0.8) {
                particle.alphaSpeed = -particle.alphaSpeed;
            }
            
            // 边界检查
            if (particle.x < 0) particle.x = window.innerWidth;
            if (particle.x > window.innerWidth) particle.x = 0;
            if (particle.y < 0) particle.y = window.innerHeight;
            if (particle.y > window.innerHeight) particle.y = 0;
        });
    }

    // 初始化滚动动画
    initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, observerOptions);

        // 观察需要动画的元素
        const animatedElements = document.querySelectorAll('.floating-animation, .glass-effect');
        animatedElements.forEach(el => observer.observe(el));
    }

    // 元素动画
    animateElement(element) {
        if (element.classList.contains('animated')) return;
        element.classList.add('animated');

        anime({
            targets: element,
            translateY: [50, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutQuart',
            delay: Math.random() * 200
        });
    }

    // 初始化悬停效果
    initHoverEffects() {
        // 按钮悬停效果
        const buttons = document.querySelectorAll('.btn-primary');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                anime({
                    targets: button,
                    scale: 1.05,
                    duration: 200,
                    easing: 'easeOutQuart'
                });
            });

            button.addEventListener('mouseleave', () => {
                anime({
                    targets: button,
                    scale: 1,
                    duration: 200,
                    easing: 'easeOutQuart'
                });
            });
        });

        // 卡片悬停效果
        const cards = document.querySelectorAll('.glass-effect');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                anime({
                    targets: card,
                    translateY: -5,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });

            card.addEventListener('mouseleave', () => {
                anime({
                    targets: card,
                    translateY: 0,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            });
        });
    }

    // 初始化背景效果
    initBackgroundEffects() {
        // 创建网络连接线效果
        this.createNetworkLines();
        
        // 添加鼠标跟随效果
        this.initMouseFollowEffect();
    }

    // 创建网络连接线
    createNetworkLines() {
        if (!this.pixiApp) return;

        const lines = new PIXI.Graphics();
        lines.lineStyle(1, 0x319795, 0.2);
        
        // 连接附近的粒子
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const distance = Math.sqrt(
                    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
                );
                
                if (distance < 100) {
                    lines.moveTo(p1.x, p1.y);
                    lines.lineTo(p2.x, p2.y);
                }
            }
        }
        
        this.particleContainer.addChild(lines);
    }

    // 鼠标跟随效果
    initMouseFollowEffect() {
        let mouseX = 0;
        let mouseY = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        // 在鼠标附近创建额外粒子效果
        setInterval(() => {
            if (this.particles.length > 0) {
                const nearestParticle = this.particles[
                    Math.floor(Math.random() * this.particles.length)
                ];
                
                anime({
                    targets: nearestParticle,
                    x: mouseX + (Math.random() - 0.5) * 100,
                    y: mouseY + (Math.random() - 0.5) * 100,
                    duration: 2000,
                    easing: 'easeOutQuart'
                });
            }
        }, 1000);
    }

    // 降级效果（当PIXI不可用时）
    initFallbackEffects() {
        // 添加CSS动画作为后备
        const style = document.createElement('style');
        style.textContent = `
            .fallback-particle {
                position: fixed;
                width: 4px;
                height: 4px;
                background: linear-gradient(45deg, #319795, #ed8936);
                border-radius: 50%;
                pointer-events: none;
                z-index: -1;
                animation: float-particle 8s infinite linear;
            }
            
            @keyframes float-particle {
                0% {
                    transform: translateY(100vh) translateX(0px) rotate(0deg);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100px) translateX(100px) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);

        // 创建浮动粒子
        setInterval(() => {
            const particle = document.createElement('div');
            particle.className = 'fallback-particle';
            particle.style.left = Math.random() * window.innerWidth + 'px';
            particle.style.animationDelay = Math.random() * 2 + 's';
            particle.style.animationDuration = (Math.random() * 4 + 6) + 's';
            
            document.body.appendChild(particle);
            
            // 清理粒子
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 10000);
        }, 500);
    }

    // 查询成功动画
    animateQuerySuccess() {
        // 创建成功粒子爆发效果
        for (let i = 0; i < 20; i++) {
            const particle = new PIXI.Graphics();
            particle.beginFill(0x48bb78, 0.8);
            particle.drawCircle(0, 0, 3);
            particle.endFill();
            
            particle.x = window.innerWidth / 2;
            particle.y = window.innerHeight / 2;
            
            this.particleContainer.addChild(particle);
            
            anime({
                targets: particle,
                x: particle.x + (Math.random() - 0.5) * 200,
                y: particle.y + (Math.random() - 0.5) * 200,
                alpha: [1, 0],
                scale: [1, 0],
                duration: 1000,
                easing: 'easeOutQuart',
                complete: () => {
                    this.particleContainer.removeChild(particle);
                }
            });
        }
    }

    // 加载动画
    animateLoading(element) {
        const spinner = element.querySelector('.loading-spinner');
        if (spinner) {
            anime({
                targets: spinner,
                rotate: '360deg',
                duration: 1000,
                loop: true,
                easing: 'linear'
            });
        }
    }

    // 数字计数动画
    animateCounter(element, from, to, duration = 1000) {
        const obj = { value: from };
        
        anime({
            targets: obj,
            value: to,
            duration: duration,
            easing: 'easeOutQuart',
            update: () => {
                element.textContent = obj.value.toFixed(6);
            }
        });
    }

    // 文本打字机效果
    animateTypewriter(element, text, speed = 50) {
        element.textContent = '';
        let i = 0;
        
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, speed);
    }

    // 波纹效果
    createRippleEffect(element, x, y) {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(49, 151, 149, 0.3)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.marginLeft = '-10px';
        ripple.style.marginTop = '-10px';
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // 清理资源
    destroy() {
        if (this.pixiApp) {
            this.pixiApp.destroy(true);
        }
    }
}

// 添加波纹动画CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// 初始化视觉效果
document.addEventListener('DOMContentLoaded', () => {
    window.visualEffects = new VisualEffects();
});

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (window.visualEffects) {
        window.visualEffects.destroy();
    }
});