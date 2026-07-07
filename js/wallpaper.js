(function () {
  var REPO = 'surenxue/bwlzone';
  var FILE = 'wallpaper.json';
  var LS_KEY = 'bwl_wallpaper';
  var TOKEN_KEY = 'bwl_gh_token';
  var PRESETS = [
    '/img/p1.jpg', '/img/239.jpg', '/img/73355141_p0_master1200.jpg',
    '/img/106995872_p0.jpg', '/img/109735950_p0_master1200.jpg',
    '/img/66965508_p0.jpg', '/img/69446164_p0.jpg', '/img/70750094_p0.jpg',
    '/img/109747615_p0_master1200.jpg', '/img/110332137_p0_master1200.jpg'
  ];
  var bg = document.getElementById('web_bg');

  function apply(url) {
    if (!bg || !url) return;
    bg.style.backgroundImage = "url('" + url + "')";
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
    if (!token) { status('未配置 GitHub 令牌，仅本机保存', true); return; }
    var api = 'https://api.github.com/repos/' + REPO + '/contents/' + FILE;
    fetch(api, { headers: { 'Authorization': 'Bearer ' + token } })
      .then(function (r) {
        if (r.status === 404) return { sha: null };
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
      .then(function (r) { if (r.ok) status('已同步到云端'); else status('同步失败：' + r.status, true); })
      .catch(function (e) { status('同步错误：' + e.message, true); });
  }

  function buildUI() {
    if (document.getElementById('wp-btn')) return;
    var show = document.querySelector('#rightside-config-show');
    if (!show) return;
    var btn = document.createElement('button');
    btn.id = 'wp-btn'; btn.type = 'button'; btn.title = '切换壁纸（云端同步）';
    btn.innerHTML = '<i class="fas fa-image"></i>';
    show.appendChild(btn);
    var panel = document.createElement('div');
    panel.id = 'wp-panel'; panel.className = 'wp-panel';
    var grid = PRESETS.map(function (u) {
      return '<img class="wp-thumb" src="' + u + '" data-u="' + u + '" alt="">';
    }).join('');
    panel.innerHTML =
      '<h4>切换壁纸</h4>' +
      '<div class="wp-grid">' + grid + '</div>' +
      '<div class="wp-row"><input id="wp-custom" placeholder="自定义图片 URL"><button id="wp-apply">应用</button></div>' +
      '<hr class="wp-hr"><h4>云端同步（GitHub）</h4>' +
      '<div class="wp-note">填入仅本仓库可写的 GitHub 令牌（repo 或 fine-grained contents:write），仅保存在你浏览器本地，不会上传。</div>' +
      '<div class="wp-row"><input id="wp-token" type="password" placeholder="ghp_... / github_pat_..."><button id="wp-savetoken">保存令牌</button></div>' +
      '<div class="wp-row"><button id="wp-sync" class="wp-btn2">同步当前壁纸到云端</button></div>' +
      '<div class="wp-status" id="wp-status"></div>';
    document.body.appendChild(panel);
    btn.addEventListener('click', function () { panel.classList.toggle('wp-open'); });
    panel.querySelectorAll('.wp-thumb').forEach(function (im) {
      im.addEventListener('click', function () {
        var u = im.getAttribute('data-u');
        apply(u);
        panel.querySelectorAll('.wp-thumb').forEach(function (x) { x.classList.remove('wp-active'); });
        im.classList.add('wp-active');
        status('已应用，正在同步…');
        saveCloud(u);
      });
    });
    document.getElementById('wp-apply').addEventListener('click', function () {
      var u = document.getElementById('wp-custom').value.trim();
      if (!u) return;
      apply(u); status('已应用，正在同步…'); saveCloud(u);
    });
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
})();