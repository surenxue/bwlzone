// ========== 头像点击切换 ==========
(function() {
    var avatarContainer = document.getElementById('avatarContainer');
    var avatarInput = document.getElementById('avatarInput');
    var avatarImg = document.getElementById('avatarImg');
    var avatarSvg = document.getElementById('avatarSvg');

    if (avatarContainer && avatarInput) {
        avatarContainer.addEventListener('click', function() {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                avatarImg.src = event.target.result;
                avatarImg.style.display = 'block';
                if (avatarSvg) avatarSvg.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }
})();

// ========== 滚动淡入动画 ==========
var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

var fadeElements = document.querySelectorAll(
    '.about-card, .project-card, .contact-item, .stat-item, .section-header'
);
fadeElements.forEach(function(el) {
    el.classList.add('fade-in');
    observer.observe(el);
});

// ========== 导航栏滚动效果 ==========
var navbar = document.querySelector('.navbar');
window.addEventListener('scroll', function() {
    if (navbar) {
        if (window.pageYOffset > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// ========== 平滑滚动 ==========
document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
            var offset = 80;
            var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    });
});

// ========== 数字递增动画 ==========
function animateNumbers() {
    var statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(function(stat) {
        var text = stat.textContent;
        var match = text.match(/(\d+)(\+?)/);
        if (!match) return;

        var target = parseInt(match[1]);
        var suffix = match[2] || '';
        var duration = 1500;
        var startTime = null;
        var animated = false;

        function update(timestamp) {
            if (!startTime) startTime = timestamp;
            var elapsed = timestamp - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            var current = Math.floor(eased * target);
            stat.textContent = current + suffix;
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        var numObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting && !animated) {
                    animated = true;
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
(function() {
    var titleEl = document.querySelector('.gradient-text');
    if (titleEl) {
        var originalText = titleEl.textContent;
        titleEl.textContent = '';
        var charIndex = 0;
        function typeWriter() {
            if (charIndex < originalText.length) {
                titleEl.textContent += originalText.charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, 60);
            }
        }
        setTimeout(typeWriter, 500);
    }
})();

console.log('✨ BWL Zone 已就绪！');
