// ========== 滚动淡入动画 ==========
const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// 为所有卡片和内容区域添加淡入效果
document.querySelectorAll('.skill-card, .project-card, .about-content, .contact-links, .stat-item').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// ========== 导航栏滚动效果 ==========
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // 滚动超过 100px 添加阴影
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// ========== 平滑滚动导航（针对 Safari） ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ========== 技能卡片悬浮粒子效果 ==========
document.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// ========== 数字递增动画 ==========
function animateNumbers() {
    document.querySelectorAll('.stat-number').forEach(stat => {
        const text = stat.textContent;
        const match = text.match(/(\d+)(\+?)/);
        if (!match) return;

        const target = parseInt(match[1]);
        const suffix = match[2] || '';
        const duration = 1500;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // easeOutExpo
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const current = Math.floor(eased * target);

            stat.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        const numObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    requestAnimationFrame(update);
                    numObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        numObserver.observe(stat);
    });
}

animateNumbers();

// ========== 打字机效果 ==========
const titleEl = document.querySelector('.title');
if (titleEl) {
    const originalText = titleEl.textContent;
    titleEl.textContent = '';
    let charIndex = 0;

    function typeWriter() {
        if (charIndex < originalText.length) {
            titleEl.textContent += originalText.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, 60);
        }
    }

    // 延迟 500ms 后开始打字
    setTimeout(typeWriter, 500);
}

console.log('✨ 欢迎来到我的个人主页！');
