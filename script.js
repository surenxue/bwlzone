// ========== Vue 应用 ==========
const { createApp, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } = Vue;

const app = createApp({
    data() {
        return {
            isloading: true,
            isClearScreen: false,
            formattedTime: "",
            formattedDate: "",
            configdata: config,
            dialog1: false,
            videosrc: '',
            ismusicplayer: true,
            isPlaying: false,
            playlistIndex: 0,
            audioLoading: false,
            musicinfo: null,
            musicinfoLoading: false,
            showMusicPlayer: false,
            isExpanded: false,
            selectedEngine: searchEngines[0],
            searchQuery: '',
            currentTypewriterText: '',
            avatarSrc: 'img/avatar.jpg',

            // 主题设置
            themeColor: '#FFFFFF',
            titleColor: '#FFFFFF',
            brightness: 85,
            blur: 5,

            // 壁纸设置
            wallpaperDevice: 'pc',
            wallpaperType: 'pic',
            selectedWallpaperIdx: -1,
            tab: 'tab-1',

            // 技术栈图标
            stackicons: [
                { icon: 'mdi mdi-vuejs', color: '#4FC08D', tip: 'vue' },
                { icon: 'mdi mdi-language-javascript', color: '#CAD300', tip: 'javascript' },
                { icon: 'mdi mdi-language-css3', color: '#2965F1', tip: 'css' },
                { icon: 'mdi mdi-language-html5', color: '#E44D26', tip: 'html' },
                { icon: 'mdi mdi-vuetify', color: '#1697F6', tip: 'vuetify' },
            ],

            // 打字机
            typewriterIndex: 0,
            typewriterCharIndex: 0,
            typewriterTimer: null,
        };
    },
    computed: {
        currentSong() {
            return this.musicinfo ? this.musicinfo[this.playlistIndex] : null;
        },
        audioPlayer() {
            return this.$refs.audioPlayer;
        },
        currentWallpaperList() {
            if (!this.configdata.wallpaper) return [];
            const device = this.wallpaperDevice;
            const type = this.wallpaperType;
            const wallpapers = this.configdata.wallpaper;
            if (device === 'pc') {
                return type === 'pic' ? (wallpapers.pic || []) : (wallpapers.video || []);
            } else {
                return type === 'pic' ? (wallpapers.picMobile || []) : (wallpapers.videoMobile || []);
            }
        }
    },
    watch: {
        isClearScreen(val) {
            if (!this.videosrc) return;
            const vd = this.$refs.VdPlayer;
            if (vd) {
                if (val) { vd.style.zIndex = 0; vd.controls = true; }
                else { vd.style.zIndex = -100; vd.controls = false; }
            }
        },
        audioLoading(val) {
            this.isPlaying = !val;
        }
    },
    methods: {
        // ========== 工具方法 ==========
        formatTime(date) {
            const h = String(date.getHours()).padStart(2, '0');
            const m = String(date.getMinutes()).padStart(2, '0');
            const s = String(date.getSeconds()).padStart(2, '0');
            return `${h}:${m}:${s}`;
        },
        formatDate(date) {
            const y = date.getFullYear();
            const mo = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            const days = ['日', '一', '二', '三', '四', '五', '六'];
            return `${y}/${mo}/${d} 星期${days[date.getDay()]}`;
        },

        // ========== 头像 ==========
        updateFavicon(src) {
            let link = document.querySelector("link[rel='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                link.type = 'image/x-icon';
                document.head.appendChild(link);
            }
            link.href = src;
        },
        onAvatarChange(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                this.avatarSrc = event.target.result;
                localStorage.setItem('bwl_avatar', event.target.result);
                this.updateFavicon(event.target.result);
            };
            reader.readAsDataURL(file);
        },

        // ========== 搜索 ==========
        doSearch() {
            if (!this.searchQuery.trim()) return;
            const url = this.selectedEngine.url + encodeURIComponent(this.searchQuery.trim());
            window.open(url, '_blank').focus();
        },

        // ========== 社交图标 ==========
        getSocialIcon(name) {
            const map = {
                'GitHub': 'mdi mdi-github',
                'Email': 'mdi mdi-email',
                'QQ': 'mdi mdi-qqchat',
                'WeChat': 'mdi mdi-wechat',
                'YouTube': 'mdi mdi-youtube',
                'Facebook': 'mdi mdi-facebook',
            };
            return map[name] || 'mdi mdi-link';
        },

        // ========== 打字机效果 ==========
        startTypewriter() {
            const strings = this.configdata.typeWriterStrings || [];
            if (!strings.length) return;
            const type = () => {
                const currentStr = strings[this.typewriterIndex];
                if (this.typewriterCharIndex < currentStr.length) {
                    this.currentTypewriterText = currentStr.substring(0, this.typewriterCharIndex + 1);
                    this.typewriterCharIndex++;
                    this.typewriterTimer = setTimeout(type, 100);
                } else {
                    this.typewriterTimer = setTimeout(() => {
                        this.typewriterCharIndex = 0;
                        this.currentTypewriterText = '';
                        this.typewriterIndex = (this.typewriterIndex + 1) % strings.length;
                        type();
                    }, 2000);
                }
            };
            type();
        },

        // ========== 音乐 ==========
        async getMusicInfo() {
            this.musicinfoLoading = true;
            try {
                const { server, type, id } = this.configdata.musicPlayer;
                const resp = await fetch(`https://api.i-meto.com/meting/api?server=${server}&type=${type}&id=${id}`);
                if (!resp.ok) throw new Error('网络请求失败');
                this.musicinfo = await resp.json();
                this.musicinfoLoading = false;
            } catch (err) {
                console.error('音乐请求失败:', err);
                this.musicinfoLoading = false;
            }
        },
        togglePlay() {
            if (!this.audioPlayer) return;
            if (!this.isPlaying) {
                this.audioPlayer.play();
            } else {
                this.audioPlayer.pause();
            }
            this.isPlaying = !this.musicinfoLoading && !this.isPlaying;
        },
        previousTrack() {
            if (!this.musicinfo || !this.musicinfo.length) return;
            this.playlistIndex = this.playlistIndex > 0 ? this.playlistIndex - 1 : this.musicinfo.length - 1;
            this.updateAudio();
        },
        nextTrack() {
            if (!this.musicinfo || !this.musicinfo.length) return;
            this.playlistIndex = this.playlistIndex < this.musicinfo.length - 1 ? this.playlistIndex + 1 : 0;
            this.updateAudio();
        },
        updateAudio() {
            if (!this.audioPlayer || !this.currentSong) return;
            this.audioPlayer.src = this.currentSong.url;
            this.isPlaying = true;
            this.$nextTick(() => {
                this.audioPlayer.play().catch(() => {});
            });
        },
        updateCurrentIndex(idx) {
            this.playlistIndex = idx;
            this.updateAudio();
        },

        // ========== 设置 - 样式 ==========
        applyTheme() {
            const root = document.documentElement;
            root.style.setProperty('--bwl-welcomtitle-color', this.titleColor);
            root.style.setProperty('--bwl-vcard-color', this.themeColor);
            root.style.setProperty('--bwl-brightness', this.brightness + '%');
            root.style.setProperty('--bwl-blur', this.blur + 'px');
        },
        resetStyle() {
            this.themeColor = this.configdata.color?.themecolor || '#FFFFFF';
            this.titleColor = this.configdata.color?.welcometitlecolor || '#FFFFFF';
            this.brightness = this.configdata.brightness || 85;
            this.blur = this.configdata.blur || 5;
            this.applyTheme();
        },
        saveStyle() {
            const data = {
                color: { themecolor: this.themeColor, welcometitlecolor: this.titleColor },
                brightness: this.brightness,
                blur: this.blur
            };
            localStorage.setItem('bwldata', JSON.stringify(data));
            this.dialog1 = false;
            this.applyTheme();
        },

        // ========== 设置 - 壁纸 ==========
        selectWallpaper(idx) {
            this.selectedWallpaperIdx = idx;
        },
        resetWallpaper() {
            this.selectedWallpaperIdx = -1;
        },
        saveWallpaper() {
            if (this.selectedWallpaperIdx >= 0) {
                const wp = this.currentWallpaperList[this.selectedWallpaperIdx];
                if (wp) {
                    if (this.wallpaperType === 'pic') {
                        const root = document.documentElement;
                        root.style.setProperty('--bwl-background-image-url', `url('${wp.url}')`);
                        this.videosrc = '';
                    } else {
                        this.videosrc = wp.url;
                    }
                }
            }
            // 保存到 cookie/localStorage
            const bgData = {
                pc: { type: this.wallpaperDevice === 'pc' ? this.wallpaperType : 'pic', datainfo: this.wallpaperDevice === 'pc' && this.selectedWallpaperIdx >= 0 ? this.currentWallpaperList[this.selectedWallpaperIdx] : null },
                mobile: { type: this.wallpaperDevice === 'mobile' ? this.wallpaperType : 'pic', datainfo: this.wallpaperDevice === 'mobile' && this.selectedWallpaperIdx >= 0 ? this.currentWallpaperList[this.selectedWallpaperIdx] : null }
            };
            localStorage.setItem('bwldatabackground', JSON.stringify(bgData));
            this.dialog1 = false;
        },

        // ========== 跳转 ==========
        jump(url) {
            if (url) window.open(url, '_blank').focus();
        },

        // ========== 初始化 ==========
        setMainProperty() {
            const root = document.documentElement;

            // 读取已保存的主题
            const bwldata = JSON.parse(localStorage.getItem('bwldata') || 'null');
            if (bwldata) {
                this.themeColor = bwldata.color?.themecolor || '#FFFFFF';
                this.titleColor = bwldata.color?.welcometitlecolor || '#FFFFFF';
                this.brightness = bwldata.brightness || 85;
                this.blur = bwldata.blur || 5;
            } else {
                this.themeColor = this.configdata.color?.themecolor || '#FFFFFF';
                this.titleColor = this.configdata.color?.welcometitlecolor || '#FFFFFF';
                this.brightness = this.configdata.brightness || 85;
                this.blur = this.configdata.blur || 5;
            }
            this.applyTheme();

            // 读取已保存的壁纸
            const bgData = JSON.parse(localStorage.getItem('bwldatabackground') || 'null');
            const isMobile = window.innerWidth <= 960;

            if (bgData) {
                const deviceData = isMobile ? bgData.mobile : bgData.pc;
                if (deviceData && deviceData.datainfo) {
                    if (deviceData.type === 'pic') {
                        root.style.setProperty('--bwl-background-image-url', `url('${deviceData.datainfo.url}')`);
                    } else {
                        this.videosrc = deviceData.datainfo.url;
                    }
                }
            } else {
                // 使用默认壁纸
                const defaultBg = this.configdata.background;
                if (defaultBg) {
                    const deviceData = isMobile ? defaultBg.mobile : defaultBg.pc;
                    if (deviceData && deviceData.datainfo) {
                        if (deviceData.type === 'pic') {
                            root.style.setProperty('--bwl-background-image-url', `url('${deviceData.datainfo.url}')`);
                        } else {
                            this.videosrc = deviceData.datainfo.url;
                        }
                    }
                }
            }
        },

        async init() {
            // 恢复头像
            const savedAvatar = localStorage.getItem('bwl_avatar');
            if (savedAvatar) {
                this.avatarSrc = savedAvatar;
                this.updateFavicon(savedAvatar);
            }

            // 设置背景
            this.setMainProperty();

            // 获取音乐
            await this.getMusicInfo();

            // 加载图片
            await this.loadImages();

            // 启动时钟
            this.formattedTime = this.formatTime(new Date());
            this.formattedDate = this.formatDate(new Date());
            setInterval(() => {
                this.formattedTime = this.formatTime(new Date());
            }, 1000);

            // 显示页面
            setTimeout(() => { this.isloading = false; }, 500);

            // 启动打字机
            this.$nextTick(() => { this.startTypewriter(); });

            // 渲染极坐标图
            this.$nextTick(() => { this.renderPolarChart(); });
        },

        loadImages() {
            const imageUrls = [
                this.configdata.avatar || 'img/avatar.jpg',
                ...(this.configdata.projectcards || []).map(item => item.img).filter(Boolean)
            ];
            return new Promise((resolve) => {
                const promises = imageUrls.map(url => {
                    return new Promise((res) => {
                        const img = new Image();
                        img.src = url;
                        img.onload = () => res();
                        img.onerror = () => res();
                    });
                });
                const timeout = new Promise(res => setTimeout(res, 2500));
                Promise.race([Promise.all(promises), timeout]).then(resolve);
            });
        },

        renderPolarChart() {
            if (!this.configdata.polarChart || !this.$refs.polarChartRef) return;
            const { skills, skillPoints } = this.configdata.polarChart;
            if (!skills || !skillPoints) return;

            const ctx = this.$refs.polarChartRef.getContext('2d');
            const colors = skills.map(() => {
                const r = Math.floor(Math.random() * 200 + 55);
                const g = Math.floor(Math.random() * 200 + 55);
                const b = Math.floor(Math.random() * 200 + 55);
                return `rgba(${r},${g},${b},0.6)`;
            });

            new Chart(ctx, {
                type: 'polarArea',
                data: {
                    labels: skills,
                    datasets: [{
                        data: skillPoints,
                        backgroundColor: colors,
                        borderColor: colors.map(c => c.replace('0.6', '1')),
                        borderWidth: 1,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            callbacks: {
                                label: (ctx) => `${ctx.label}: ${ctx.raw} 技能点`
                            }
                        }
                    },
                    scales: {
                        r: {
                            ticks: { display: false, backdropColor: 'transparent' },
                            grid: { color: 'rgba(255,255,255,0.1)' },
                            angleLines: { color: 'rgba(255,255,255,0.1)' },
                            pointLabels: { color: '#fff', font: { size: 11 } },
                            suggestedMin: 0, suggestedMax: 100
                        }
                    },
                    animation: { duration: 1800, easing: 'easeOutQuad' }
                }
            });
        },
    },
    mounted() {
        this.init();
    },
    beforeUnmount() {
        if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
        if (this.$refs.audioPlayer) {
            this.$refs.audioPlayer.removeEventListener('ended', this.nextTrack);
        }
    }
});

app.mount('#app');
