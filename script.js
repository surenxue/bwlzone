// ========== 配置 ==========
var config = {
    welcometitle: "Hi, I'm Leleo",
    avatar: "img/avatar.jpg",
    color: {
        welcometitlecolor: "#ffffff",
        themecolor: "#ffffff"
    },
    brightness: 85,
    blur: 5,
    tags: ['乐观开朗', '温柔体贴', '随和亲切', '冷静沉着', '才思敏捷', '风趣幽默', '刚正不阿', '善解人意'],
    socialPlatformIcons: [
        { icon: 'mdi-github', tip: 'GitHub', url: 'https://www.github.com/leleo886' },
        { icon: 'mdi-email', tip: '邮箱', url: 'mailto:leleo886@foxmail.com' },
        { icon: 'mdi-qqchat', tip: 'QQ', url: '#' },
        { icon: 'mdi-wechat', tip: '微信', url: '#' }
    ],
    typewriter: [
        "欢迎来到我的主页~",
        "每一天都是新的开始！",
        "Stay hungry, stay foolish.",
        "你相信光吗？"
    ],
    polarChart: {
        skills: ['JavaScript', 'Node', 'Vue.js', 'React', 'Python', 'Java', 'Linux', 'Docker', 'MySQL', 'MongoDB', 'AWS'],
        skillPoints: [88, 90, 85, 78, 78, 80, 85, 65, 82, 78, 70]
    },
    musicPlayer: {
        server: 'netease',
        type: 'playlist',
        id: '2028178887'
    },
    background: {
        pc: {
            type: "pic",
            datainfo: {
                name: "海洋女孩",
                url: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg"
            }
        },
        mobile: {
            type: "pic",
            datainfo: {
                name: "0001",
                url: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg"
            }
        }
    },
    projectcards: [
        { title: "Project 1", img: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg", text: "项目描述1", link: "https://leleo.top" },
        { title: "Project 2", img: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg", text: "项目描述2", link: "https://leleo.top" },
        { title: "Project 3", img: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg", text: "项目描述3", link: "https://leleo.top" },
        { title: "Project 4", img: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg", text: "项目描述4", link: "https://leleo.top" },
        { title: "Project 5", img: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg", text: "项目描述5", link: "https://leleo.top" },
        { title: "Project 6", img: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg", text: "项目描述6", link: "https://leleo.top" },
        { title: "Project 7", img: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg", text: "项目描述7", link: "https://leleo.top" },
        { title: "Project 8", img: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg", text: "项目描述8", link: "https://leleo.top" }
    ],
    wallpapers: [
        { name: "海洋女孩", url: "https://s21.ax1x.com/2025/02/24/pEHh81f.jpg" },
        { name: "书房夜晚", url: "https://s21.ax1x.com/2025/02/24/pEH4jWq.jpg" },
        { name: "星空", url: "https://s21.ax1x.com/2025/02/24/pEH4Xy4.jpg" },
        { name: "雪山", url: "https://s21.ax1x.com/2025/02/24/pEH4xT1.jpg" },
        { name: "森林", url: "https://s21.ax1x.com/2025/02/24/pEH4jWq.jpg" },
        { name: "城市", url: "https://s21.ax1x.com/2025/02/24/pEH4Xy4.jpg" }
    ],
    metaData: {
        title: "Leleo的个人主页🎉",
        description: "欢迎来到Leleo的奇妙世界！",
        keywords: "Leleo, leleo, 个人主页, 个人网站",
        icon: "/favicon.ico"
    }
};

// ========== 音乐状态 ==========
var musicState = {
    playlist: [],
    currentIndex: 0,
    isPlaying: false,
    audio: document.getElementById('audioPlayer')
};

// ========== 初始化 ==========
(function init() {
    setMeta();
    setBackground();
    renderTags();
    renderProjects();
    renderWallpapers();
    initTabs();
    initSearch();
    initDeploy();
    startClock();
    startTypewriter();
    initPolarChart();
    initMusic();
    initAvatarHover();

    // 加载完成后隐藏 loading
    preloadImages().then(function() {
        setTimeout(function() {
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('mainContent').style.visibility = 'visible';
        }, 500);
    });
})();

// ========== 设置元数据 ==========
function setMeta() {
    document.title = config.metaData.title;
    var desc = document.querySelector('meta[name="description"]');
    var keywords = document.querySelector('meta[name="keywords"]');
    if (desc) desc.content = config.metaData.description;
    if (keywords) keywords.content = config.metaData.keywords;
}

// ========== 设置背景 ==========
function setBackground() {
    var isMobile = window.innerWidth <= 960;
    var bgConfig = isMobile ? config.background.mobile : config.background.pc;
    if (bgConfig.type === 'pic') {
        document.documentElement.style.setProperty('--bg-image', "url('" + bgConfig.datainfo.url + "')");
    }
    document.documentElement.style.setProperty('--brightness', config.brightness + '%');
    document.documentElement.style.setProperty('--blur', config.blur + 'px');

    // 保存默认壁纸
    if (!localStorage.getItem('leleoBgUrl')) {
        localStorage.setItem('leleoBgUrl', bgConfig.datainfo.url);
    }
}

// ========== 预加载图片 ==========
function preloadImages() {
    var urls = [config.avatar];
    config.projectcards.forEach(function(item) { urls.push(item.img); });
    urls.push(config.background.pc.datainfo.url);

    var promises = urls.map(function(url) {
        return new Promise(function(resolve) {
            var img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = url;
        });
    });

    return Promise.race([
        Promise.all(promises),
        new Promise(function(resolve) { setTimeout(resolve, 2500); })
    ]);
}

// ========== 渲染标签 ==========
function renderTags() {
    var container = document.getElementById('tagsSection');
    if (!container) return;
    var html = '';
    config.tags.forEach(function(tag) {
        html += '<span class="tag">' + escapeHtml(tag) + '</span>';
    });
    container.innerHTML = html;
}

// ========== 渲染项目卡片 ==========
function renderProjects() {
    var grid = document.getElementById('projectsGrid');
    if (!grid) return;
    var html = '';
    config.projectcards.forEach(function(project) {
        html += '<div class="project-card" onclick="window.open(\'' + project.link + '\', \'_blank\')">' +
            '<img src="' + project.img + '" alt="' + project.title + '" loading="lazy" />' +
            '<div class="project-card-body">' +
            '<h3>' + escapeHtml(project.title) + '</h3>' +
            '<p>' + escapeHtml(project.text) + '</p>' +
            '</div></div>';
    });
    grid.innerHTML = html;
}

// ========== 渲染壁纸 ==========
function renderWallpapers() {
    var grid = document.getElementById('wallpaperGrid');
    if (!grid) return;
    var html = '';
    config.wallpapers.forEach(function(wp, index) {
        html += '<div class="wallpaper-item" style="background-image:url(\'' + wp.url + '\')" data-url="' + wp.url + '" data-index="' + index + '">' +
            '<span class="wallpaper-name">' + wp.name + '</span></div>';
    });
    grid.innerHTML = html;

    // 点击切换壁纸
    grid.querySelectorAll('.wallpaper-item').forEach(function(item) {
        item.addEventListener('click', function() {
            var url = this.getAttribute('data-url');
            document.documentElement.style.setProperty('--bg-image', "url('" + url + "')");
            localStorage.setItem('leleoBgUrl', url);
            grid.querySelectorAll('.wallpaper-item').forEach(function(el) { el.classList.remove('active'); });
            this.classList.add('active');
        });
    });

    // 高亮当前壁纸
    var savedBg = localStorage.getItem('leleoBgUrl');
    if (savedBg) {
        grid.querySelectorAll('.wallpaper-item').forEach(function(item) {
            if (item.getAttribute('data-url') === savedBg) item.classList.add('active');
        });
    }
}

// ========== 标签页切换 ==========
function initTabs() {
    var buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var tabId = this.getAttribute('data-tab');
            buttons.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(function(tc) { tc.classList.remove('active'); });
            var target = document.getElementById(tabId);
            if (target) target.classList.add('active');
        });
    });
}

// ========== 搜索 ==========
function initSearch() {
    var input = document.getElementById('searchInput');
    var btn = document.getElementById('searchBtn');
    if (!input || !btn) return;
    btn.addEventListener('click', function() {
        var query = input.value.trim();
        if (query) window.open('https://www.google.com/search?q=' + encodeURIComponent(query), '_blank');
    });
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') btn.click();
    });
}

// ========== 部署按钮 ==========
function initDeploy() {
    var btn = document.getElementById('deployBtn');
    if (!btn) return;
    btn.addEventListener('click', function() {
        window.open('https://leleo.top', '_blank');
    });
}

// ========== 时钟 ==========
function startClock() {
    var timeEl = document.getElementById('timeDisplay');
    var dateEl = document.getElementById('dateDisplay');
    if (!timeEl || !dateEl) return;

    function update() {
        var now = new Date();
        var h = String(now.getHours()).padStart(2, '0');
        var m = String(now.getMinutes()).padStart(2, '0');
        var s = String(now.getSeconds()).padStart(2, '0');
        timeEl.textContent = h + ' : ' + m + ' : ' + s;

        var days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        dateEl.textContent = now.getFullYear() + '年' +
            String(now.getMonth() + 1).padStart(2, '0') + '月' +
            String(now.getDate()).padStart(2, '0') + '日 ' +
            days[now.getDay()];
    }
    update();
    setInterval(update, 1000);
}

// ========== 打字机效果 ==========
function startTypewriter() {
    var el = document.getElementById('welcomeText');
    if (!el) return;
    var texts = config.typewriter;
    var textIndex = 0;
    var charIndex = 0;
    var isDeleting = false;
    var typeSpeed = 80;
    var deleteSpeed = 40;
    var pauseTime = 2000;

    function type() {
        var currentText = texts[textIndex];
        if (isDeleting) {
            el.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            if (charIndex === 0) {
                isDeleting = false;
                textIndex = (textIndex + 1) % texts.length;
                setTimeout(type, 500);
                return;
            }
            setTimeout(type, deleteSpeed);
        } else {
            el.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            if (charIndex === currentText.length) {
                isDeleting = true;
                setTimeout(type, pauseTime);
                return;
            }
            setTimeout(type, typeSpeed);
        }
    }
    // 先显示欢迎标题
    el.textContent = config.welcometitle;
    setTimeout(function() {
        el.textContent = '';
        charIndex = 0;
        isDeleting = false;
        type();
    }, 2000);
}

// ========== 极坐标图 ==========
function initPolarChart() {
    var canvas = document.getElementById('polarChart');
    if (!canvas || !window.Chart) return;
    var ctx = canvas.getContext('2d');
    var skills = config.polarChart.skills;
    var points = config.polarChart.skillPoints;

    var colors = skills.map(function() {
        var r = Math.floor(Math.random() * 200 + 55);
        var g = Math.floor(Math.random() * 200 + 55);
        var b = Math.floor(Math.random() * 200 + 55);
        return 'rgba(' + r + ',' + g + ',' + b + ',0.6)';
    });

    new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels: skills,
            datasets: [{
                data: points,
                backgroundColor: colors,
                borderColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30,30,30,0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    cornerRadius: 8,
                    padding: 12
                }
            },
            scales: {
                r: {
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    ticks: { display: false },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            animation: { duration: 1800, easing: 'easeOutQuad' }
        }
    });
}

// ========== 音乐播放器 ==========
function initMusic() {
    fetchMusicList();
    setupMusicControls();
}

function fetchMusicList() {
    var url = 'https://api.i-meto.com/meting/api?server=' + config.musicPlayer.server +
        '&type=' + config.musicPlayer.type + '&id=' + config.musicPlayer.id;

    fetch(url)
        .then(function(res) { return res.json(); })
        .then(function(data) {
            musicState.playlist = data;
            renderPlaylist();
            if (data.length > 0) {
                document.getElementById('musicPlayer').style.display = 'flex';
                document.getElementById('turntable').style.display = 'block';
                loadTrack(0);
            }
        })
        .catch(function(err) {
            console.error('音乐加载失败:', err);
        });
}

function setupMusicControls() {
    var playBtn = document.getElementById('playBtn');
    var prevBtn = document.getElementById('prevBtn');
    var nextBtn = document.getElementById('nextBtn');
    var progress = document.getElementById('musicProgress');

    if (playBtn) {
        playBtn.addEventListener('click', function() {
            if (musicState.isPlaying) {
                musicState.audio.pause();
                setPlaying(false);
            } else {
                musicState.audio.play().catch(function() {});
                setPlaying(true);
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            var idx = musicState.currentIndex > 0 ? musicState.currentIndex - 1 : musicState.playlist.length - 1;
            loadTrack(idx);
            musicState.audio.play().catch(function() {});
            setPlaying(true);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            var idx = musicState.currentIndex < musicState.playlist.length - 1 ? musicState.currentIndex + 1 : 0;
            loadTrack(idx);
            musicState.audio.play().catch(function() {});
            setPlaying(true);
        });
    }

    if (progress) {
        progress.addEventListener('input', function() {
            var val = parseInt(this.value);
            if (musicState.audio.duration) {
                musicState.audio.currentTime = (val / 100) * musicState.audio.duration;
            }
        });
    }

    musicState.audio.addEventListener('timeupdate', function() {
        if (musicState.audio.duration && progress) {
            progress.value = (musicState.audio.currentTime / musicState.audio.duration) * 100;
        }
    });

    musicState.audio.addEventListener('ended', function() {
        var idx = musicState.currentIndex < musicState.playlist.length - 1 ? musicState.currentIndex + 1 : 0;
        loadTrack(idx);
        musicState.audio.play().catch(function() {});
        setPlaying(true);
    });

    musicState.audio.addEventListener('play', function() { setPlaying(true); });
    musicState.audio.addEventListener('pause', function() { setPlaying(false); });
}

function loadTrack(index) {
    if (!musicState.playlist[index]) return;
    musicState.currentIndex = index;
    var song = musicState.playlist[index];
    musicState.audio.src = song.url;
    document.getElementById('musicTitle').textContent = song.title || '';
    document.getElementById('musicAuthor').textContent = song.author || '';

    // 更新播放列表高亮
    document.querySelectorAll('.playlist-item').forEach(function(item, i) {
        item.classList.toggle('active', i === index);
    });
}

function setPlaying(playing) {
    musicState.isPlaying = playing;
    var playBtn = document.getElementById('playBtn');
    var turntable = document.getElementById('turntable');
    if (playBtn) {
        playBtn.innerHTML = playing ? '<i class="mdi mdi-pause"></i>' : '<i class="mdi mdi-play"></i>';
    }
    if (turntable) {
        turntable.classList.toggle('paused', !playing);
    }
}

function renderPlaylist() {
    var container = document.getElementById('playlist');
    if (!container) return;
    var html = '';
    musicState.playlist.forEach(function(song, index) {
        html += '<div class="playlist-item" data-index="' + index + '">' +
            '<span class="index">' + (index + 1) + '</span>' +
            '<div class="info">' +
            '<span class="song-title">' + escapeHtml(song.title || '未知歌曲') + '</span>' +
            '<span class="song-author">' + escapeHtml(song.author || '未知作者') + '</span>' +
            '</div></div>';
    });
    container.innerHTML = html;

    container.querySelectorAll('.playlist-item').forEach(function(item) {
        item.addEventListener('click', function() {
            var idx = parseInt(this.getAttribute('data-index'));
            loadTrack(idx);
            musicState.audio.play().catch(function() {});
            setPlaying(true);
        });
    });
}

// ========== 头像悬停效果 ==========
function initAvatarHover() {
    var wrapper = document.getElementById('avatarWrapper');
    if (!wrapper) return;
    wrapper.addEventListener('click', function() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                document.getElementById('avatarImg').src = ev.target.result;
                localStorage.setItem('leleoAvatar', ev.target.result);
            };
            reader.readAsDataURL(file);
        });
        input.click();
    });

    // 恢复头像
    var savedAvatar = localStorage.getItem('leleoAvatar');
    if (savedAvatar) {
        document.getElementById('avatarImg').src = savedAvatar;
    }
}

// ========== 工具函数 ==========
function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== 控制台彩蛋 ==========
console.log('%c I LOVE YOU! %c leleo.top ',
    'background:#ff6b9d;color:#fff;padding:10px 16px;border-radius:4px 0 0 4px;font-size:14px;',
    'background:#2d1b4e;color:#00d4aa;padding:10px 16px;border-radius:0 4px 4px 0;font-size:14px;');
console.log('%cCopyright © ' + new Date().getFullYear() + ' Leleo', 'color:#9ca3af;');
console.log('✨ Leleo 个人主页已就绪！');
