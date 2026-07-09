(function () {
  var REPO = 'surenxue/bwlzone';
  var FILE = 'wallpaper.json';
  var LS_KEY = 'bwl_wallpaper';
  var TOKEN_KEY = 'bwl_gh_token';
  var PRESETS = [
    '/img/p1.jpg', '/img/239.jpg', '/img/73355141_p0_master1200.jpg',
    '/img/106995872_p0.jpg', '/img/109735950_p0_master1200.jpg',
    '/img/66965508_p0_master1200.jpg', '/img/69446164_p0_master1200.jpg', '/img/70750094_p0.jpg',
    '/img/109747615_p0_master1200.jpg', '/img/110332137_p0_master1200.jpg'
  ];
  var bg = document.getElementById('web_bg');
  var selected = '';

  function apply(url) {
    if (!bg || !url) return;
    bg.style.setProperty('background-image', "url('" + url + "')", 'important');
    try { localStorage.setItem(LS_KEY, url); } catch (e) {}
  }
  function b64(s) { return btoa(unescape(encodeURIComponent(s))); }
  function status(msg, err) {
    var el = document.getElementById('wp-status');
    if (el) { el.textContent = msg; el.style.color = err ? '#ff9b9b' : '#7fd17f'; }
  }
  try { var l = localStorage.getItem(LS_KEY); if (l) apply(l); } catch (e) {}
  fetch(FILE + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { if (j && j.wallpaper) apply(j.wallpaper); })
    .catch(function () {});

  function saveCloud(url) {
    var token = '';
    try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}
    if (!token) { status('已保存本机（未配置令牌，不同步云端）', false); return; }
    var api = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE;
    fetch(api, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function (r) {
        if (r.status === 404) return { sha: null };
        if (r.status === 401 || r.status === 403) throw new Error('令牌无效或权限不足');
        if (!r.ok) throw new Error('读取失败 ' + r.status);
        return r.json().then(function (x) { return { sha: x.sha }; });
      })
      .then(function (o) {
        var body = { message: 'wallpaper: ' + url, content: b64(JSON.stringify({ wallpaper: url })) };
        if (o.sha) body.sha = o.sha;
        return fetch(api, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) { status('云端同步失败：令牌无效或权限不足（仅本机已保存）', true); return; }
        if (r.ok) status('已同步到云端 ✓', false);
        else status('同步失败：' + r.status + '（仅本机已保存）', true);
      })
      .catch(function (e) { status('云端同步失败：' + e.message + '（仅本机已保存）', true); });
  }

  function buildUI() {
    var show = document.querySelector('#rightside-config-show');
    if (!show) return;
    var btn = document.getElementById('wp-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'wp-btn'; btn.type = 'button'; btn.title = '切换壁纸（云端同步）';
      btn.innerHTML = '<i class="fas fa-image"></i>';
      show.appendChild(btn);
    }
    var panel = document.createElement('div');
    panel.id = 'wp-panel'; panel.className = 'wp-panel';
    var grid = PRESETS.map(function (u) {
      var nm = u.split('/').pop();
      return '<img class="wp-thumb" loading="lazy" decoding="async" src="/img/thumb/' + nm + '" data-u="' + u + '" alt="' + nm + '">';
    }).join('');
    panel.innerHTML =
      '<h4>切换壁纸</h4>' +
      '<div class="wp-grid">' + grid + '</div>' +
      '<div class="wp-row"><input id="wp-custom" placeholder="自定义图片 URL"><button id="wp-apply">应用</button></div>' +
      '<hr class="wp-hr"><h4>云端同步（GitHub）</h4>' +
      '<div class="wp-note">选「应用」即可本机切换壁纸，无需令牌；要把壁纸同步到其他设备才需要填令牌。令牌是 GitHub 个人访问令牌（PAT），形如 ghp_… 或 github_pat_…（Settings → Developer settings → PAT 生成，勾 repo 或本仓库 contents:write）。SSH 指纹/密码不可用。令牌仅存你浏览器本地，不会上传。</div>' +
      '<div class="wp-row"><input id="wp-token" type="password" placeholder="ghp_... / github_pat_..."><button id="wp-savetoken">保存令牌</button></div>' +
      '<div class="wp-row"><button id="wp-sync" class="wp-btn2">同步当前壁纸到云端</button></div>' +
      '<div class="wp-status" id="wp-status"></div>';
    document.body.appendChild(panel);
    btn.addEventListener('click', function (e) { e.stopPropagation(); panel.classList.toggle('wp-open'); document.querySelectorAll('.wp-open').forEach(function (o) { if (o !== panel) o.classList.remove('wp-open'); }); var h = document.getElementById('rightside-config-hide'); if (h) h.classList.remove('show'); });
    panel.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && t.closest && (t.closest('.wp-panel') || t.closest('.ap-panel') || t.closest('#rightside-config-hide') || t.closest('#rightside-config-show'))) return;
    document.querySelectorAll('.wp-panel.wp-open').forEach(function (o) { o.classList.remove('wp-open'); });
    var ap = document.getElementById('ap-panel'); if (ap) ap.classList.remove('ap-open');
    var h = document.getElementById('rightside-config-hide'); if (h) h.classList.remove('show');
    });
    panel.querySelectorAll('.wp-thumb').forEach(function (im) {
      im.addEventListener('click', function () {
        selected = im.getAttribute('data-u');
        panel.querySelectorAll('.wp-thumb').forEach(function (x) { x.classList.remove('wp-active'); });
        im.classList.add('wp-active');
        apply(selected); status('已应用 ✓（本机已保存）', false); saveCloud(selected);
      });
    });
    document.getElementById('wp-apply').addEventListener('click', function () {
      var u = document.getElementById('wp-custom').value.trim() || selected;
      if (!u) { status('请先选一张壁纸或填写 URL', true); return; }
      apply(u); status('已应用 ✓（本机已保存）', false); saveCloud(u);
    });
    try { var sv = localStorage.getItem(LS_KEY) || ''; if (sv) {
      panel.querySelectorAll('.wp-thumb').forEach(function (im) { if (im.getAttribute('data-u') === sv) im.classList.add('wp-active'); });
    } } catch (e) {}
    document.getElementById('wp-savetoken').addEventListener('click', function () {
      var t = document.getElementById('wp-token').value.trim();
      try { localStorage.setItem(TOKEN_KEY, t); } catch (e) {}
      status(t ? '令牌已保存' : '令牌已清除');
    });
    document.getElementById('wp-sync').addEventListener('click', function () {
      var u = ''; try { u = localStorage.getItem(LS_KEY) || ''; } catch (e) {}
      if (!u) { status('还没有选择壁纸', true); return; }
      saveCloud(u);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
  else buildUI();

  // ---------- 外观设置面板（含云端同步，复用壁纸令牌） ----------
  function apStatus(msg, err) {
    var el = document.getElementById('ap-status');
    if (el) { el.textContent = msg; el.style.color = err ? '#ff9b9b' : '#7fd17f'; }
  }
  function saveAppearanceCloud() {
    var token = '';
    try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}
    var v = 35; try { v = parseInt(localStorage.getItem('bwl_mask') || '35', 10) || 35; } catch (e) {}
    var f = 'transparent'; try { f = localStorage.getItem('bwl_footer') || 'transparent'; } catch (e) {}
    if (!token) { apStatus('已保存本机（未配置令牌，不同步云端）', false); return; }
    var api = 'https://api.github.com/repos/' + REPO + '/contents/appearance.json';
    fetch(api, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function (r) {
        if (r.status === 404) return { sha: null };
        if (r.status === 401 || r.status === 403) throw new Error('令牌无效或权限不足');
        if (!r.ok) throw new Error('读取失败 ' + r.status);
        return r.json().then(function (x) { return { sha: x.sha }; });
      })
      .then(function (o) {
        var bgc = ''; try { bgc = localStorage.getItem('bwl_panel_bg') || ''; } catch (e) {}
        var body = { message: 'appearance: ' + v + '/' + f + '/' + bgc, content: b64(JSON.stringify({ mask: v, footer: f, panelBg: bgc })) };
        if (o.sha) body.sha = o.sha;
        return fetch(api, { method: 'PUT', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      })
      .then(function (r) {
        if (r.status === 401 || r.status === 403) { apStatus('云端同步失败：令牌无效或权限不足', true); return; }
        if (r.ok) apStatus('已同步到云端 ✓', false);
        else apStatus('同步失败：' + r.status, true);
      })
      .catch(function (e) { apStatus('云端同步失败：' + e.message, true); });
  }
  function loadAppearanceCloud() {
    fetch('appearance.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) return;
        if (typeof j.mask === 'number') { try { localStorage.setItem('bwl_mask', String(j.mask)); } catch (e) {} }
        if (j.footer) { try { localStorage.setItem('bwl_footer', j.footer); } catch (e) {} }
        var sv = 35, sf = 'transparent';
        try { sv = parseInt(localStorage.getItem('bwl_mask') || '35', 10) || 35; } catch (e) {}
        try { sf = localStorage.getItem('bwl_footer') || 'transparent'; } catch (e) {}
        if (window.__bwlApplyMask) window.__bwlApplyMask(sv);
        if (window.__bwlApplyFooter) window.__bwlApplyFooter(sf);
        if (j.panelBg) { if (window.__bwlApplyBg) window.__bwlApplyBg(j.panelBg); else document.documentElement.style.setProperty('--panel-bg', j.panelBg); }
      })
      .catch(function () {});
  }

  function buildAppearanceUI() {
    var ap = document.getElementById('ap-body');
    var apBtn = document.getElementById('ap-btn');
    var apPanel = document.getElementById('ap-panel');
    if (!ap || ap.dataset.built) return;
    ap.dataset.built = '1';
    ap.innerHTML =
      '<h4>外观设置</h4>' +
      '<div class="ap-sec">页头遮罩浓度<span class="ap-val" id="ap-maskval">35%</span></div>' +
      '<input id="ap-mask" class="ap-slider" type="range" min="0" max="100" value="35">' +
      '<div class="ap-presets"><button data-v="15">淡</button><button data-v="35">适中</button><button data-v="60">浓</button></div>' +
      '<hr class="wp-hr"><div class="ap-sec">页脚底色</div>' +
      '<div class="ap-seg" id="ap-footer"><button data-m="transparent" class="ap-on">透明</button><button data-m="keep">保留蓝底</button></div>' +
      '<hr class="wp-hr"><div class="ap-sec">弹窗背景色（常见几种）</div>' +
      '<div class="ap-swatches">' +
        '<span class="ap-swatch" data-c="#141416" style="background:#141416" title="深灰"></span>' +
        '<span class="ap-swatch" data-c="#1e1e24" style="background:#1e1e24" title="暗夜"></span>' +
        '<span class="ap-swatch" data-c="#0f1419" style="background:#0f1419" title="墨黑"></span>' +
        '<span class="ap-swatch" data-c="#1f2d3a" style="background:#1f2d3a" title="深蓝"></span>' +
        '<span class="ap-swatch" data-c="#3a2d22" style="background:#3a2d22" title="暖棕"></span>' +
        '<span class="ap-swatch" data-c="#26322a" style="background:#26322a" title="墨绿"></span>' +
        '<span class="ap-swatch" data-c="#2d2440" style="background:#2d2440" title="暗紫"></span>' +
        '<span class="ap-swatch" data-c="#f5f5f5" style="background:#f5f5f5" title="浅灰"></span>' +
        '<span class="ap-swatch" data-c="#ffffff" style="background:#ffffff" title="纯白"></span>' +
      '</div>' +
      '<hr class="wp-hr"><div class="wp-note">外观偏好与壁纸共用同一个 GitHub 令牌，可跨设备同步。</div>' +
      '<div class="wp-row"><button id="ap-sync" class="wp-btn2">同步到云端</button></div>' +
      '<div class="wp-status" id="ap-status"></div>';

    if (apBtn && apPanel) {
      apBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = apPanel.classList.toggle('ap-open');
        document.querySelectorAll('.wp-open').forEach(function (o) { o.classList.remove('wp-open'); });
        if (open) { var h = document.getElementById('rightside-config-hide'); if (h) h.classList.remove('show'); }
      });
      apPanel.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    var gear = document.getElementById('rightside_config');
    if (gear) gear.addEventListener('click', function () { if (apPanel) apPanel.classList.remove('ap-open'); });

    var root = document.documentElement;
    function applyMask(v) {
      v = Math.max(0, Math.min(100, v | 0));
      var p = document.getElementById('page-header');
      if (p) p.classList.toggle('no-mask', v === 0);
      var f = document.getElementById('footer');
      if (f) f.classList.toggle('no-mask', v === 0);
      root.style.setProperty('--header-mask', (v / 100).toFixed(2));
      root.style.setProperty('--header-mask-dark', (v / 100).toFixed(2));
      var valEl = document.getElementById('ap-maskval'); if (valEl) valEl.textContent = v + '%';
      var sl = document.getElementById('ap-mask'); if (sl) sl.value = v;
      try { localStorage.setItem('bwl_mask', String(v)); } catch (e) {}
    }
    function applyFooter(mode) {
      if (mode === 'keep') document.body.classList.add('keep-footer');
      else document.body.classList.remove('keep-footer');
      ap.querySelectorAll('#ap-footer button').forEach(function (b) {
        b.classList.toggle('ap-on', b.getAttribute('data-m') === mode);
      });
      try { localStorage.setItem('bwl_footer', mode); } catch (e) {}
    }
    window.__bwlApplyMask = applyMask;
    window.__bwlApplyFooter = applyFooter;
    function applyBg(c) {
      c = c || '#141416';
      root.style.setProperty('--panel-bg', c);
      ap.querySelectorAll('.ap-swatch').forEach(function (s) {
        s.classList.toggle('ap-on', (s.getAttribute('data-c') || '').toLowerCase() === String(c).toLowerCase());
      });
    }
    window.__bwlApplyBg = applyBg;
    function persistBg(c) { try { localStorage.setItem('bwl_panel_bg', c); } catch (e) {} }
    var savedBg = ''; try { savedBg = localStorage.getItem('bwl_panel_bg') || ''; } catch (e) {}
    if (savedBg) applyBg(savedBg); else applyBg('#141416');
    ap.querySelectorAll('.ap-swatch').forEach(function (s) {
      s.addEventListener('click', function () { var c = s.getAttribute('data-c'); applyBg(c); persistBg(c); saveAppearanceCloud(); });
    });
    document.getElementById('ap-mask').addEventListener('input', function () { applyMask(parseInt(this.value, 10) || 0); });
    document.getElementById('ap-mask').addEventListener('change', function () { applyMask(parseInt(this.value, 10) || 0); saveAppearanceCloud(); });
    ap.querySelectorAll('.ap-presets button').forEach(function (b) {
      b.addEventListener('click', function () { applyMask(parseInt(b.getAttribute('data-v'), 10) || 0); saveAppearanceCloud(); });
    });
    ap.querySelectorAll('#ap-footer button').forEach(function (b) {
      b.addEventListener('click', function () { applyFooter(b.getAttribute('data-m')); saveAppearanceCloud(); });
    });
    document.getElementById('ap-sync').addEventListener('click', function () { saveAppearanceCloud(); });
    var sv = 35, sf = 'transparent';
    try { sv = parseInt(localStorage.getItem('bwl_mask') || '35', 10) || 35; } catch (e) {}
    try { sf = localStorage.getItem('bwl_footer') || 'transparent'; } catch (e) {}
    applyMask(sv); applyFooter(sf);
    loadAppearanceCloud();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildAppearanceUI);
  else buildAppearanceUI();
})();