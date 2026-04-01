const API_URL = 'https://api.imgflip.com/get_memes';

const loadingEl    = document.getElementById('loading');
const errorEl      = document.getElementById('error-msg');
const gridEl       = document.getElementById('meme-grid');
const resultEl     = document.getElementById('result-count');
const searchInput  = document.getElementById('search-input');

let allMemes = [];

async function fetchMemes() {
  showLoading(true);
  try {
    const res  = await fetch(API_URL);
    const data = await res.json();
    if (!data.success) throw new Error('API error');
    allMemes = data.data.memes;
    displayMemes(allMemes);
  } catch (err) {
    showLoading(false);
    errorEl.hidden = false;
  }
}

function displayMemes(memes) {
  showLoading(false);
  gridEl.innerHTML = '';

  memes.forEach((meme, i) => {
    const card = document.createElement('div');
    card.className = 'meme-card';
    card.style.animationDelay = Math.min(i * 25, 500) + 'ms';
    card.innerHTML = `
      <img src="${meme.url}" alt="${meme.name}" loading="lazy" />
      <div class="card-body">
        <div class="card-name" title="${meme.name}">${meme.name}</div>
        <div class="card-boxes">${meme.box_count} text box${meme.box_count !== 1 ? 'es' : ''}</div>
      </div>
    `;
    gridEl.appendChild(card);
  });

  gridEl.hidden = false;
  resultEl.hidden = false;
  resultEl.textContent = `${memes.length} memes loaded`;
}

function showLoading(show) {
  loadingEl.style.display = show ? 'flex' : 'none';
}

searchInput.addEventListener('input', () => {
  const q = searchInput.value.toLowerCase().trim();
  const filtered = allMemes.filter(m => m.name.toLowerCase().includes(q));
  displayMemes(filtered);
});

fetchMemes();
