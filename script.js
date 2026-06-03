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

            // 社交图标编辑（因 Vue 动态key问题，用数组辅助）
            socialIconNames: [],
            socialIconLinks: [],

            // 原始配置备份（用于恢复默认）
            defaultContent: null,

            // 图表实例
            polarChartInstance: null,

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

            // 本地上传壁纸
            uploadedWallpapers: {
                pic: [],
                picMobile: [],
                video: [],
                videoMobile: []
            },
            uploadPreviewSrc: '',
            uploadWallpaperName: '',
            uploadWallpaperFile: null,
            importStatus: '',

            // 云端同步
            syncKey: '',
            syncing: false,
            syncStatus: '',
            syncOk: true,
            autoSync: false,

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
            // 获取预设壁纸
            let presetList = [];
            if (device === 'pc') {
                presetList = type === 'pic' ? (wallpapers.pic || []) : (wallpapers.video || []);
            } else {
                presetList = type === 'pic' ? (wallpapers.picMobile || []) : (wallpapers.videoMobile || []);
            }
            // 获取上传壁纸
            const uploadKey = device === 'pc'
                ? (type === 'pic' ? 'pic' : 'video')
                : (type === 'pic' ? 'picMobile' : 'videoMobile');
            const uploadList = (this.uploadedWallpapers[uploadKey] || []).map(wp => ({ ...wp, isUpload: true }));
            // 合并：预设在前，上传在后
            return [...presetList.map(wp => ({ ...wp, isUpload: false })), ...uploadList];
        }
    },
    watch: {
        tab(newVal) {
            if (newVal === 'tab-4') this.syncSocialArrays();
        },
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
                this.autoSyncToServer();
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
            // 保存到 localStorage
            const bgData = {
                pc: { type: this.wallpaperDevice === 'pc' ? this.wallpaperType : 'pic', datainfo: this.wallpaperDevice === 'pc' && this.selectedWallpaperIdx >= 0 ? this.currentWallpaperList[this.selectedWallpaperIdx] : null },
                mobile: { type: this.wallpaperDevice === 'mobile' ? this.wallpaperType : 'pic', datainfo: this.wallpaperDevice === 'mobile' && this.selectedWallpaperIdx >= 0 ? this.currentWallpaperList[this.selectedWallpaperIdx] : null }
            };
            localStorage.setItem('bwldatabackground', JSON.stringify(bgData));
            this.dialog1 = false;
            this.autoSyncToServer();
        },

        // ========== 壁纸本地上传 ==========
        onWallpaperFileChange(e) {
            const file = e.target.files[0];
            if (!file) return;
            this.uploadWallpaperFile = file;
            this.uploadWallpaperName = file.name.replace(/\.[^/.]+$/, '');
            const reader = new FileReader();
            reader.onload = (event) => {
                this.uploadPreviewSrc = event.target.result;
            };
            if (this.wallpaperType === 'pic') {
                reader.readAsDataURL(file);
            } else {
                reader.readAsDataURL(file);
            }
        },
        addUploadedWallpaper() {
            if (!this.uploadPreviewSrc) return;
            const name = this.uploadWallpaperName.trim() || '未命名';
            const key = this.wallpaperDevice === 'pc'
                ? (this.wallpaperType === 'pic' ? 'pic' : 'video')
                : (this.wallpaperType === 'pic' ? 'picMobile' : 'videoMobile');
            this.uploadedWallpapers[key].push({
                name: name,
                url: this.uploadPreviewSrc,
                pre: this.wallpaperType === 'pic' ? this.uploadPreviewSrc : null
            });
            // 保存到 localStorage
            this.saveUploadedWallpapers();
            this.autoSyncToServer();
            // 清理预览
            this.uploadPreviewSrc = '';
            this.uploadWallpaperName = '';
            this.uploadWallpaperFile = null;
            if (this.$refs.wallpaperFileInput) this.$refs.wallpaperFileInput.value = '';
            // 自动选中新上传的壁纸
            this.$nextTick(() => {
                this.selectedWallpaperIdx = this.currentWallpaperList.length - 1;
            });
        },
        removeUploadedWallpaper(idx) {
            if (!confirm('确定删除这个壁纸吗？')) return;
            const key = this.wallpaperDevice === 'pc'
                ? (this.wallpaperType === 'pic' ? 'pic' : 'video')
                : (this.wallpaperType === 'pic' ? 'picMobile' : 'videoMobile');
            const presetCount = this.getPresetWallpaperCount();
            const uploadIdx = idx - presetCount;
            if (uploadIdx >= 0 && uploadIdx < this.uploadedWallpapers[key].length) {
                this.uploadedWallpapers[key].splice(uploadIdx, 1);
                this.saveUploadedWallpapers();
                if (this.selectedWallpaperIdx === idx) {
                    this.selectedWallpaperIdx = -1;
                }
            }
        },
        getPresetWallpaperCount() {
            const wallpapers = this.configdata.wallpaper;
            if (!wallpapers) return 0;
            const device = this.wallpaperDevice;
            const type = this.wallpaperType;
            if (device === 'pc') {
                return (type === 'pic' ? (wallpapers.pic || []) : (wallpapers.video || [])).length;
            } else {
                return (type === 'pic' ? (wallpapers.picMobile || []) : (wallpapers.videoMobile || [])).length;
            }
        },
        saveUploadedWallpapers() {
            localStorage.setItem('bwl_uploaded_wallpapers', JSON.stringify(this.uploadedWallpapers));
        },

        // ========== 数据导出/导入 ==========
        exportSettings() {
            const exportData = {
                bwl_avatar: localStorage.getItem('bwl_avatar') || null,
                bwl_content: JSON.parse(localStorage.getItem('bwl_content') || 'null'),
                bwldata: JSON.parse(localStorage.getItem('bwldata') || 'null'),
                bwldatabackground: JSON.parse(localStorage.getItem('bwldatabackground') || 'null'),
                bwl_uploaded_wallpapers: JSON.parse(localStorage.getItem('bwl_uploaded_wallpapers') || 'null'),
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bwlzone-settings-' + new Date().toISOString().slice(0, 10) + '.json';
            a.click();
            URL.revokeObjectURL(url);
        },
        importSettings(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    let count = 0;
                    if (data.bwl_avatar) { localStorage.setItem('bwl_avatar', data.bwl_avatar); count++; }
                    if (data.bwl_content) { localStorage.setItem('bwl_content', JSON.stringify(data.bwl_content)); count++; }
                    if (data.bwldata) { localStorage.setItem('bwldata', JSON.stringify(data.bwldata)); count++; }
                    if (data.bwldatabackground) { localStorage.setItem('bwldatabackground', JSON.stringify(data.bwldatabackground)); count++; }
                    if (data.bwl_uploaded_wallpapers) { localStorage.setItem('bwl_uploaded_wallpapers', JSON.stringify(data.bwl_uploaded_wallpapers)); count++; }
                    this.importStatus = `已导入 ${count} 项数据，刷新页面生效`;
                    if (this.$refs.importFileInput) this.$refs.importFileInput.value = '';
                } catch (err) {
                    this.importStatus = '文件格式错误，请选择正确的 .json 文件';
                    console.error('导入失败:', err);
                }
            };
            reader.readAsText(file);
        },
        clearAllData() {
            if (!confirm('⚠️ 确定要清除所有本地数据吗？\n\n这将删除：头像、壁纸、内容设置、上传的壁纸等。\n清除后页面将恢复默认状态。')) return;
            localStorage.removeItem('bwl_avatar');
            localStorage.removeItem('bwl_content');
            localStorage.removeItem('bwldata');
            localStorage.removeItem('bwldatabackground');
            localStorage.removeItem('bwl_uploaded_wallpapers');
            this.importStatus = '已清除所有数据，刷新页面生效';
        },

        // ========== 云端同步 ==========
        getAllSettingsData() {
            return {
                bwl_avatar: localStorage.getItem('bwl_avatar') || null,
                bwl_content: JSON.parse(localStorage.getItem('bwl_content') || 'null'),
                bwldatabackground: JSON.parse(localStorage.getItem('bwldatabackground') || 'null'),
                bwl_uploaded_wallpapers: JSON.parse(localStorage.getItem('bwl_uploaded_wallpapers') || 'null'),
            };
        },
        applySyncData(data) {
            if (!data) return;
            let count = 0;
            if (data.bwl_avatar) { localStorage.setItem('bwl_avatar', data.bwl_avatar); count++; }
            if (data.bwl_content) { localStorage.setItem('bwl_content', JSON.stringify(data.bwl_content)); count++; }
            if (data.bwldatabackground) { localStorage.setItem('bwldatabackground', JSON.stringify(data.bwldatabackground)); count++; }
            if (data.bwl_uploaded_wallpapers) { localStorage.setItem('bwl_uploaded_wallpapers', JSON.stringify(data.bwl_uploaded_wallpapers)); count++; }
            return count;
        },
        generateSyncKey() {
            const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
            let key = '';
            for (let i = 0; i < 8; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
            this.syncKey = key;
            this.saveSyncKey();
        },
        saveSyncKey() {
            localStorage.setItem('bwl_sync_key', this.syncKey);
        },
        toggleAutoSync() {
            localStorage.setItem('bwl_auto_sync', this.autoSync ? '1' : '0');
        },
        autoSyncToServer() {
            if (!this.syncKey || !this.autoSync || this.syncing) return;
            this.syncing = true;
            const data = this.getAllSettingsData();
            fetch('/api/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: this.syncKey, data })
            }).then(r => r.json()).then(res => {
                this.syncStatus = res.ok ? '自动同步成功' : '';
                this.syncOk = !!res.ok;
            }).catch(() => {
                // 静默失败，不打扰用户
            }).finally(() => {
                this.syncing = false;
                setTimeout(() => { if (this.syncStatus === '自动同步成功') this.syncStatus = ''; }, 3000);
            });
        },
        async syncSaveToServer() {
            if (!this.syncKey) return;
            this.syncing = true;
            this.syncStatus = '';
            const data = this.getAllSettingsData();
            try {
                const resp = await fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: this.syncKey, data })
                });
                const result = await resp.json();
                this.syncStatus = result.ok ? '保存成功！可在其他电脑用相同同步码加载' : (result.msg || '保存失败');
                this.syncOk = !!result.ok;
            } catch (err) {
                this.syncStatus = '无法连接服务器，请确认 server.js 已启动（node server.js）';
                this.syncOk = false;
            }
            this.syncing = false;
        },
        async syncLoadFromServer() {
            if (!this.syncKey) return;
            this.syncing = true;
            this.syncStatus = '';
            try {
                const resp = await fetch('/api/load', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: this.syncKey })
                });
                const result = await resp.json();
                if (result.ok && result.data) {
                    const count = this.applySyncData(result.data);
                    this.syncStatus = `加载成功！已恢复 ${count || 0} 项数据，刷新页面生效`;
                    this.syncOk = true;
                } else {
                    this.syncStatus = result.msg || '加载失败';
                    this.syncOk = false;
                }
            } catch (err) {
                this.syncStatus = '无法连接服务器，请确认 server.js 已启动（node server.js）';
                this.syncOk = false;
            }
            this.syncing = false;
        },

        // ========== 跳转 ==========
        jump(url) {
            if (url) window.open(url, '_blank').focus();
        },

        // ========== 内容编辑 - 社交图标同步 ==========
        syncSocialArrays() {
            const icons = this.configdata.socialPlatformIcons || {};
            const keys = Object.keys(icons);
            this.socialIconNames = [...keys];
            this.socialIconLinks = keys.map(k => icons[k]);
        },
        updateSocialKey(idx) {
            const oldKeys = Object.keys(this.configdata.socialPlatformIcons);
            const oldKey = oldKeys[idx];
            const newKey = this.socialIconNames[idx];
            if (oldKey !== newKey && newKey.trim()) {
                const entries = Object.entries(this.configdata.socialPlatformIcons);
                entries[idx] = [newKey.trim(), this.socialIconLinks[idx] || ''];
                this.configdata.socialPlatformIcons = Object.fromEntries(entries);
                this.syncSocialArrays();
            }
        },

        // ========== 内容编辑 - 打字机文字 ==========
        addTypeWriter() {
            this.configdata.typeWriterStrings.push('新文字...');
        },
        removeTypeWriter(idx) {
            this.configdata.typeWriterStrings.splice(idx, 1);
        },

        // ========== 内容编辑 - 标签 ==========
        addTag() {
            this.configdata.tags.push('新标签');
        },
        removeTag(idx) {
            this.configdata.tags.splice(idx, 1);
        },

        // ========== 内容编辑 - 技能 ==========
        addSkill() {
            this.configdata.polarChart.skills.push('新技能');
            this.configdata.polarChart.skillPoints.push(50);
        },
        removeSkill(idx) {
            this.configdata.polarChart.skills.splice(idx, 1);
            this.configdata.polarChart.skillPoints.splice(idx, 1);
        },

        // ========== 内容编辑 - 项目卡片 ==========
        addProject() {
            this.configdata.projectcards.push({
                title: '新项目',
                subtitle: '项目描述',
                text: '项目详情介绍',
                img: 'img/sunshine.jpg',
                link: 'https://bwl.top'
            });
        },
        removeProject(idx) {
            this.configdata.projectcards.splice(idx, 1);
        },
        onProjectImgChange(e, idx) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                this.configdata.projectcards[idx].img = event.target.result;
            };
            reader.readAsDataURL(file);
        },

        // ========== 内容编辑 - 社交图标 ==========
        addSocial() {
            const icons = this.configdata.socialPlatformIcons || {};
            icons['新平台'] = 'https://';
            this.configdata.socialPlatformIcons = { ...icons };
            this.syncSocialArrays();
        },
        removeSocial(idx) {
            const keys = Object.keys(this.configdata.socialPlatformIcons);
            const newIcons = {};
            keys.forEach((k, i) => {
                if (i !== idx) newIcons[k] = this.configdata.socialPlatformIcons[k];
            });
            this.configdata.socialPlatformIcons = newIcons;
            this.syncSocialArrays();
        },

        // ========== 内容编辑 - 保存/恢复 ==========
        saveContent() {
            // 同步社交图标链接
            const newIcons = {};
            this.socialIconNames.forEach((name, i) => {
                if (name.trim()) newIcons[name.trim()] = this.socialIconLinks[i] || '';
            });
            this.configdata.socialPlatformIcons = newIcons;

            const toSave = {
                welcometitle: this.configdata.welcometitle,
                typeWriterStrings: [...this.configdata.typeWriterStrings],
                tags: [...this.configdata.tags],
                polarChart: {
                    skills: [...this.configdata.polarChart.skills],
                    skillPoints: [...this.configdata.polarChart.skillPoints]
                },
                projectcards: this.configdata.projectcards.map(p => ({ ...p })),
                socialPlatformIcons: { ...this.configdata.socialPlatformIcons }
            };
            localStorage.setItem('bwl_content', JSON.stringify(toSave));
            this.dialog1 = false;
            this.autoSyncToServer();
            // 刷新技能图
            this.$nextTick(() => {
                this.renderPolarChart();
                this.restartTypewriter();
            });
        },
        resetContent() {
            if (!this.defaultContent) return;
            this.configdata.welcometitle = this.defaultContent.welcometitle;
            this.configdata.typeWriterStrings = [...this.defaultContent.typeWriterStrings];
            this.configdata.tags = [...this.defaultContent.tags];
            this.configdata.polarChart = {
                skills: [...this.defaultContent.polarChart.skills],
                skillPoints: [...this.defaultContent.polarChart.skillPoints]
            };
            this.configdata.projectcards = this.defaultContent.projectcards.map(p => ({ ...p }));
            this.configdata.socialPlatformIcons = { ...this.defaultContent.socialPlatformIcons };
            localStorage.removeItem('bwl_content');
            this.syncSocialArrays();
            this.$nextTick(() => {
                this.renderPolarChart();
                this.restartTypewriter();
            });
        },
        restartTypewriter() {
            if (this.typewriterTimer) clearTimeout(this.typewriterTimer);
            this.typewriterIndex = 0;
            this.typewriterCharIndex = 0;
            this.currentTypewriterText = '';
            this.$nextTick(() => this.startTypewriter());
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
            // 备份原始配置用于恢复
            this.defaultContent = {
                welcometitle: this.configdata.welcometitle,
                typeWriterStrings: [...this.configdata.typeWriterStrings],
                tags: [...this.configdata.tags],
                polarChart: {
                    skills: [...this.configdata.polarChart.skills],
                    skillPoints: [...this.configdata.polarChart.skillPoints]
                },
                projectcards: this.configdata.projectcards.map(p => ({ ...p })),
                socialPlatformIcons: { ...this.configdata.socialPlatformIcons }
            };

            // 加载已保存的内容
            const savedContent = JSON.parse(localStorage.getItem('bwl_content') || 'null');
            if (savedContent) {
                if (savedContent.welcometitle) this.configdata.welcometitle = savedContent.welcometitle;
                if (savedContent.typeWriterStrings) this.configdata.typeWriterStrings = [...savedContent.typeWriterStrings];
                if (savedContent.tags) this.configdata.tags = [...savedContent.tags];
                if (savedContent.polarChart) {
                    this.configdata.polarChart = {
                        skills: [...savedContent.polarChart.skills],
                        skillPoints: [...savedContent.polarChart.skillPoints]
                    };
                }
                if (savedContent.projectcards) {
                    this.configdata.projectcards = savedContent.projectcards.map(p => ({ ...p }));
                }
                if (savedContent.socialPlatformIcons) {
                    this.configdata.socialPlatformIcons = { ...savedContent.socialPlatformIcons };
                }
            }

            // 恢复头像
            const savedAvatar = localStorage.getItem('bwl_avatar');
            if (savedAvatar) {
                this.avatarSrc = savedAvatar;
                this.updateFavicon(savedAvatar);
            }

            // 恢复上传的壁纸
            const savedUploadedWp = JSON.parse(localStorage.getItem('bwl_uploaded_wallpapers') || 'null');
            if (savedUploadedWp) {
                this.uploadedWallpapers = savedUploadedWp;
            }

            // 恢复同步设置
            const savedSyncKey = localStorage.getItem('bwl_sync_key');
            if (savedSyncKey) this.syncKey = savedSyncKey;
            this.autoSync = localStorage.getItem('bwl_auto_sync') === '1';

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

            // 销毁旧图表
            if (this.polarChartInstance) {
                this.polarChartInstance.destroy();
                this.polarChartInstance = null;
            }

            const ctx = this.$refs.polarChartRef.getContext('2d');
            const colors = skills.map(() => {
                const r = Math.floor(Math.random() * 200 + 55);
                const g = Math.floor(Math.random() * 200 + 55);
                const b = Math.floor(Math.random() * 200 + 55);
                return `rgba(${r},${g},${b},0.6)`;
            });

            this.polarChartInstance = new Chart(ctx, {
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
