// ========== 头像点击切换 ==========
(function() {
    var avatarContainer = document.getElementById('avatarContainer');
    var avatarInput = document.getElementById('avatarInput');
    var avatarImg = document.getElementById('avatarImg');
    var avatarSvg = document.getElementById('avatarSvg');

    // 页面加载时从 localStorage 恢复头像
    var savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar && avatarImg && avatarSvg) {
        avatarImg.src = savedAvatar;
        avatarImg.style.display = 'block';
        avatarSvg.style.display = 'none';
    }

    if (avatarContainer && avatarInput) {
        avatarContainer.addEventListener('click', function() {
            avatarInput.click();
        });

        avatarInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(event) {
                var dataUrl = event.target.result;
                avatarImg.src = dataUrl;
                avatarImg.style.display = 'block';
                if (avatarSvg) avatarSvg.style.display = 'none';
                // 保存到 localStorage
                localStorage.setItem('userAvatar', dataUrl);
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

// ========== 留言板（提交 + 分页） ==========
(function() {
    var PER_PAGE = 10;
    var currentPage = 1;

    // 从 localStorage 读取留言
    function getMessages() {
        var data = localStorage.getItem('guestbookMessages');
        return data ? JSON.parse(data) : [];
    }

    // 保存留言到 localStorage
    function saveMessages(messages) {
        localStorage.setItem('guestbookMessages', JSON.stringify(messages));
    }

    // 格式化时间
    function formatTime(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        var h = String(date.getHours()).padStart(2, '0');
        var min = String(date.getMinutes()).padStart(2, '0');
        return y + '-' + m + '-' + d + ' ' + h + ':' + min;
    }

    // 渲染当前页留言
    function renderMessages() {
        var messages = getMessages();
        var listEl = document.getElementById('messageList');
        var pageEl = document.getElementById('pagination');

        if (!listEl || !pageEl) return;

        // 倒序显示（最新的在前）
        var reversed = messages.slice().reverse();
        var totalPage = Math.max(1, Math.ceil(reversed.length / PER_PAGE));
        if (currentPage > totalPage) currentPage = totalPage;

        var start = (currentPage - 1) * PER_PAGE;
        var pageData = reversed.slice(start, start + PER_PAGE);

        if (reversed.length === 0) {
            listEl.innerHTML = '<div class="empty-message">暂无留言，快来抢沙发吧！</div>';
        } else {
            var html = '';
            for (var i = 0; i < pageData.length; i++) {
                var msg = pageData[i];
                html += '<div class="message-item fade-in visible">' +
                    '<div class="message-header">' +
                    '<span class="message-name">👤 ' + escapeHtml(msg.name) + '</span>' +
                    '<span class="message-time">' + formatTime(new Date(msg.time)) + '</span>' +
                    '</div>' +
                    '<div class="message-content">' + escapeHtml(msg.content) + '</div>' +
                    '</div>';
            }
            listEl.innerHTML = html;
        }

        // 渲染分页按钮
        if (totalPage > 1) {
            var pgHtml = '';
            for (var p = 1; p <= totalPage; p++) {
                pgHtml += '<button class="page-btn' + (p === currentPage ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
            }
            pageEl.innerHTML = pgHtml;
            pageEl.querySelectorAll('.page-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    currentPage = parseInt(this.getAttribute('data-page'));
                    renderMessages();
                    document.getElementById('guestbook').scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            });
        } else {
            pageEl.innerHTML = '';
        }
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // 提交留言
    var form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            var nameInput = this.querySelector('input[type="text"]');
            var emailInput = this.querySelector('input[type="email"]');
            var textInput = this.querySelector('textarea');
            if (!nameInput || !textInput || !nameInput.value.trim() || !textInput.value.trim()) return;

            var messages = getMessages();
            messages.push({
                name: nameInput.value.trim(),
                email: emailInput ? emailInput.value.trim() : '',
                content: textInput.value.trim(),
                time: new Date().toISOString()
            });
            saveMessages(messages);

            nameInput.value = '';
            if (emailInput) emailInput.value = '';
            textInput.value = '';

            currentPage = 1;
            renderMessages();

            document.getElementById('guestbook').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    renderMessages();
})();

console.log('✨ BWL Zone 已就绪！');
