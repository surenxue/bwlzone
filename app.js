const one = selector => document.querySelector(selector);
const all = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

one('[data-theme-toggle]')?.addEventListener('click', () => {
  const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem('bwl-theme', theme); } catch {}
  one('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171e19' : '#f8f9f5');
});

const menuToggle = one('.mobile-menu-toggle');
const menu = one('#mobile-nav');
menuToggle?.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(expanded));
  menuToggle.setAttribute('aria-label', expanded ? '收起导航' : '展开导航');
  menu.hidden = !expanded;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
    menu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', '展开导航');
    menuToggle.focus();
  }
});

function filterPosts(filter, updateURL = true) {
  let shown = 0;
  all('[data-filter]').forEach(button => {
    const active = button.dataset.filter === filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  all('[data-post]').forEach(post => {
    const visible = filter === 'all' || post.dataset.categories.split(' ').includes(filter);
    post.hidden = !visible;
    if (visible) shown++;
  });
  const empty = one('.filter-empty');
  if (empty) empty.hidden = shown > 0;
  if (updateURL) {
    const url = new URL(location.href);
    if (filter === 'all') url.searchParams.delete('category');
    else url.searchParams.set('category', filter);
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  }
}
if (one('[data-filter]')) {
  all('[data-filter]').forEach(button => button.addEventListener('click', () => filterPosts(button.dataset.filter)));
  const category = new URL(location.href).searchParams.get('category');
  if (category && all('[data-filter]').some(button => button.dataset.filter === category)) filterPosts(category, false);
}

const dialog = one('#search-dialog');
const input = one('#search-input');
const results = one('#search-results');
const status = one('#search-status');
let searchData;
let searchRequest;
let searchTrigger;
async function getSearchData() {
  if (searchData) return searchData;
  if (!searchRequest) searchRequest = fetch('/search.json').then(response => {
    if (!response.ok) throw new Error('Search index unavailable');
    return response.json();
  }).then(data => searchData = data).catch(error => { searchRequest = null; throw error; });
  return searchRequest;
}
async function renderSearch() {
  const query = input.value.trim().toLocaleLowerCase('zh-CN');
  status.textContent = '正在翻找笔记…';
  try {
    const data = await getSearchData();
    if (query !== input.value.trim().toLocaleLowerCase('zh-CN')) return;
    const terms = query.split(/\s+/).filter(Boolean);
    const matching = data.filter(post => {
      const searchable = [post.title, post.description, post.body, ...post.categories, ...post.tags].join(' ').toLocaleLowerCase('zh-CN');
      return terms.every(term => searchable.includes(term));
    });
    status.textContent = query ? `找到 ${matching.length} 篇相关笔记` : `全部 ${data.length} 篇笔记，试试搜索 ESP32、前端或生活。`;
    results.innerHTML = matching.length ? matching.map(post => `<a class="search-result" href="/${escapeHTML(post.slug)}/"><small>${escapeHTML(post.categories.join(' / '))} · ${escapeHTML(post.date)}</small><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.description)}</p></a>`).join('') : '<p class="search-empty">还没找到这篇笔记，换个关键词试试。</p>';
  } catch {
    status.textContent = '暂时无法加载搜索索引。';
    results.innerHTML = '<p class="search-empty">可以先到<a href="/archives/">文章归档</a>看看，或重新打开搜索。</p>';
  }
}
function openSearch(trigger) {
  searchTrigger = trigger || document.activeElement;
  if (!dialog.open) dialog.showModal();
  document.body.style.overflow = 'hidden';
  input.focus();
  void renderSearch();
}
all('[data-open-search]').forEach(button => button.addEventListener('click', () => openSearch(button)));
one('[data-close-search]')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('close', () => {
  document.body.style.overflow = '';
  searchTrigger?.focus();
});
dialog?.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
input?.addEventListener('input', () => void renderSearch());
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    openSearch(document.activeElement);
  }
});

all('figure.highlight').forEach(figure => {
  const button = document.createElement('button');
  button.className = 'copy-code';
  button.type = 'button';
  button.textContent = '复制代码';
  button.addEventListener('click', async () => {
    const text = figure.querySelector('code').textContent;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      button.textContent = '已复制';
    } catch {
      const selection = getSelection();
      const range = document.createRange();
      range.selectNodeContents(figure.querySelector('code'));
      selection.removeAllRanges();
      selection.addRange(range);
      button.textContent = '请按 Ctrl / ⌘ C 复制';
    }
    setTimeout(() => button.textContent = '复制代码', 2500);
  });
  figure.append(button);
});
const backTop = one('.back-top');
const progress = one('.reading-progress');
let scrollPending = false;
function updateScroll() {
  backTop.hidden = scrollY < 600;
  if (progress) {
    const total = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${total > 0 ? Math.min(100, Math.max(0, scrollY / total * 100)) : 100}%`;
  }
  scrollPending = false;
}
addEventListener('scroll', () => {
  if (!scrollPending) { requestAnimationFrame(updateScroll); scrollPending = true; }
}, { passive: true });
backTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth' }));
updateScroll();
