const API_URL = 'https://api.imgflip.com/get_memes';

const $ = id => document.getElementById(id);

const loadingEl    = $('loading');
const errorEl      = $('error-msg');
const gridEl       = $('meme-grid');
const metaBar      = $('meta-bar');
const resultEl     = $('result-count');
const likedNumEl   = $('liked-num');
const likedCountEl = $('liked-count');
const noResultsEl  = $('no-results');
const searchInput  = $('search-input');
const filterSelect = $('filter-select');
const sortSelect   = $('sort-select');
const themeToggle  = $('theme-toggle');

let allMemes   = [];
let likedSet   = new Set();
let favedSet   = new Set();

/* ── Theme ──────────────────────────────────────────── */
const applyTheme = isDark => {
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  themeToggle.querySelector('.theme-icon').textContent  = isDark ? '🌙' : '☀️';
  themeToggle.querySelector('.theme-label').textContent = isDark ? 'Dark' : 'Light';
};

let isDark = true;
themeToggle.addEventListener('click', () => {
  isDark = !isDark;
  applyTheme(isDark);
});

/* ── Fetch ───────────────────────────────────────────── */
async function fetchMemes() {
  showLoading(true);
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    if (!data.success) throw new Error('API error');
    allMemes = data.data.memes;
    renderFiltered();
  } catch {
    showLoading(false);
    errorEl.hidden = false;
  }
}

/* ── Filter + Sort pipeline ─────────────────────────── */
const getFiltered = () => {
  const q      = searchInput.value.toLowerCase().trim();
  const filter = filterSelect.value;
  const sort   = sortSelect.value;

  const searched = allMemes.filter(m =>
    m.name.toLowerCase().includes(q)
  );

  const filtered = searched.filter(m => {
    if (filter === 'all')     return true;
    if (filter === 'simple')  return m.box_count <= 2;
    if (filter === 'medium')  return m.box_count >= 3 && m.box_count <= 4;
    if (filter === 'complex') return m.box_count >= 5;
    return true;
  });

  const sortMap = {
    'az':         (a, b) => a.name.localeCompare(b.name),
    'za':         (a, b) => b.name.localeCompare(a.name),
    'boxes-asc':  (a, b) => a.box_count - b.box_count,
    'boxes-desc': (a, b) => b.box_count - a.box_count,
    'default':    () => 0
  };

  return [...filtered].sort(sortMap[sort] ?? (() => 0));
};

/* ── Render ──────────────────────────────────────────── */
function renderFiltered() {
  const memes = getFiltered();
  showLoading(false);
  gridEl.innerHTML = '';

  if (memes.length === 0) {
    gridEl.hidden      = true;
    metaBar.hidden     = true;
    noResultsEl.hidden = false;
    return;
  }

  noResultsEl.hidden = false;
  noResultsEl.hidden = true;
  metaBar.hidden     = false;
  gridEl.hidden      = false;

  resultEl.textContent = `${memes.length} meme${memes.length !== 1 ? 's' : ''} found`;

  memes.map((meme, i) => createCard(meme, i)).forEach(card => gridEl.appendChild(card));
}

/* ── Card Factory ────────────────────────────────────── */
function createCard(meme, i) {
  const card = document.createElement('div');
  card.className = 'meme-card';
  card.style.animationDelay = Math.min(i * 28, 500) + 'ms';

  const isLiked = likedSet.has(meme.id);
  const isFaved = favedSet.has(meme.id);
  const likeCount = likedSet.has(meme.id) ? 1 : 0;

  card.innerHTML = `
    <img src="${meme.url}" alt="${meme.name}" loading="lazy" />
    <div class="card-body">
      <div class="card-name" title="${meme.name}">${meme.name}</div>
      <div class="card-boxes">${meme.box_count} text box${meme.box_count !== 1 ? 'es' : ''}</div>
    </div>
    <div class="card-footer">
      <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${meme.id}" aria-label="Like ${meme.name}">
        <span class="like-icon">${isLiked ? '❤️' : '🤍'}</span>
        <span class="like-label">${isLiked ? 'Liked' : 'Like'}</span>
      </button>
      <button class="fav-btn ${isFaved ? 'faved' : ''}" data-id="${meme.id}" aria-label="Favourite ${meme.name}" title="Add to favourites">
        ${isFaved ? '⭐' : '☆'}
      </button>
    </div>
  `;

  card.querySelector('.like-btn').addEventListener('click', e => {
    e.stopPropagation();
    handleLike(meme.id, card);
  });

  card.querySelector('.fav-btn').addEventListener('click', e => {
    e.stopPropagation();
    handleFav(meme.id, card);
  });

  return card;
}

/* ── Like interaction ────────────────────────────────── */
function handleLike(id, card) {
  const btn   = card.querySelector('.like-btn');
  const icon  = btn.querySelector('.like-icon');
  const label = btn.querySelector('.like-label');

  if (likedSet.has(id)) {
    likedSet.delete(id);
    btn.classList.remove('liked');
    icon.textContent  = '🤍';
    label.textContent = 'Like';
  } else {
    likedSet.add(id);
    btn.classList.add('liked');
    icon.textContent  = '❤️';
    label.textContent = 'Liked';
  }

  likedNumEl.textContent = likedSet.size;
  likedCountEl.classList.remove('bump');
  void likedCountEl.offsetWidth;
  likedCountEl.classList.add('bump');
}

/* ── Favourite interaction ───────────────────────────── */
function handleFav(id, card) {
  const btn = card.querySelector('.fav-btn');

  if (favedSet.has(id)) {
    favedSet.delete(id);
    btn.classList.remove('faved');
    btn.textContent = '☆';
  } else {
    favedSet.add(id);
    btn.classList.add('faved');
    btn.textContent = '⭐';
  }
}

/* ── Helpers ─────────────────────────────────────────── */
function showLoading(show) {
  loadingEl.style.display = show ? 'flex' : 'none';
}

/* ── Event listeners ─────────────────────────────────── */
[searchInput, filterSelect, sortSelect].map(el =>
  el.addEventListener('input', renderFiltered)
);

/* ── Boot ────────────────────────────────────────────── */
fetchMemes();
