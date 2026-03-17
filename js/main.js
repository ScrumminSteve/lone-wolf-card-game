// ═══════════════════════════════════════════════════════════════
// main.js  —  Global state, utilities, title, init, event bindings
// ═══════════════════════════════════════════════════════════════

// ── Global game state ────────────────────────────────────────
let G = {};

// ── Utilities ────────────────────────────────────────────────
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { let a=[...arr]; for(let i=a.length-1;i>0;i--){const j=~~(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
function getCard(id) { return ALL_CARDS.find(c => c.id === id) || ALL_CARDS[0]; }
function showScreen(id) { document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active')); document.getElementById(id).classList.add('active'); }
function showTitle() { showScreen('splash-screen'); }

function gainRandomCard(g, msg, andThen) {
  const c = pick(CARD_POOL); g.deck.push(c.id);
  G._emsg = msg || ('Gained: '+c.name);
  if(andThen) showNewCardZoom(c.id, andThen);
}
function gainRandomKaiCard(g, msg, andThen) {
  const pool = getCardPool().filter(c => c.type === 'kai');
  const c = pool.length ? pick(pool) : pick(CARD_POOL);
  g.deck.push(c.id); G._emsg = msg || ('Gained: '+c.name);
  if(andThen) showNewCardZoom(c.id, andThen);
}

// ── Theme ────────────────────────────────────────────────────
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const icon = t === 'light' ? '☀️' : '🌙';
  document.querySelectorAll('.theme-toggle, #titleThemeToggle, #splashThemeBtn').forEach(b => b.textContent = icon);
  try { localStorage.setItem('lw_theme', t); } catch(e) {}
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// ── Title screen ─────────────────────────────────────────────
function initTitle() {
  const el = document.getElementById('titleCards');
  if(el) {
    el.innerHTML = '';
    for(let i=0;i<8;i++) {
      const c = document.createElement('div'); c.className = 'floating-card';
      c.style.left = rand(3,92)+'%'; c.style.animationDuration = rand(10,22)+'s'; c.style.animationDelay = rand(0,14)+'s';
      el.appendChild(c);
    }
  }
  initDisciplineGrid();
}

// ── Discipline grid (title screen) ───────────────────────────
function initDisciplineGrid() {
  const grid = document.getElementById('discGrid'); if(!grid) return;
  grid.innerHTML = '';
  KAI_DISCIPLINES.forEach(d => {
    const cardDef = ALL_CARDS.find(c => c.id === d.flavorCard);
    const relicDef = ALL_RELICS.find(r => r.id === d.relic);
    const el = document.createElement('div');
    el.className = 'kai-disc-card' + (selectedDiscs.includes(d.id) ? ' selected' : '');
    el.dataset.id = d.id;
    el.innerHTML = `<div class="disc-icon">${d.icon}</div><div class="disc-name">${d.name}</div><div class="disc-hint">${d.hint}</div><div class="disc-grants"><span>📜 ${cardDef?cardDef.name:d.flavorCard}</span><span>✦ ${relicDef?relicDef.art:''}</span><span class="disc-preview-btn" onclick="event.stopPropagation();showDiscPreview('${d.id}')">👁</span></div>`;
    el.onclick = () => toggleDisc(d.id);
    grid.appendChild(el);
  });
  updateDiscChosen();
}

function toggleDisc(id) {
  if(selectedDiscs.includes(id)) { if(selectedDiscs.length > 1) selectedDiscs = selectedDiscs.filter(d => d !== id); }
  else { if(selectedDiscs.length >= 5) selectedDiscs.shift(); selectedDiscs.push(id); }
  document.querySelectorAll('#discGrid .kai-disc-card').forEach(el => el.classList.toggle('selected', selectedDiscs.includes(el.dataset.id)));
  updateDiscChosen();
}

function updateDiscChosen() {
  const el = document.getElementById('discChosen'); if(!el) return;
  const names = selectedDiscs.map(id => KAI_DISCIPLINES.find(d=>d.id===id)?.icon).join(' ');
  el.textContent = selectedDiscs.length === 5 ? '✦ '+names+' ✦' : `${selectedDiscs.length}/5 disciplines chosen`;
}

// ── Init state ───────────────────────────────────────────────
function initState() {
  const discCards = selectedDiscs.map(id => { const d=KAI_DISCIPLINES.find(x=>x.id===id); return d?d.flavorCard:'lw_strike'; });
  const startRelics = [];
  selectedDiscs.forEach(id => {
    const d = KAI_DISCIPLINES.find(x=>x.id===id);
    if(d && d.relic && !startRelics.includes(d.relic)) startRelics.push(d.relic);
    const kaiRelic = ALL_RELICS.find(r => r.rarity==='kai' && r.disc===id);
    if(kaiRelic && !startRelics.includes(kaiRelic.id)) startRelics.push(kaiRelic.id);
  });
  G = {
    hp:80, hpMax:80, gold:50, floor:0, kills:0,
    disciplines: selectedDiscs, discipline: selectedDiscs[0],
    deck: ['lw_strike','lw_strike','lw_strike','lw_defend','lw_defend','lw_defend', ...discCards],
    powers:{}, hand:[], drawPile:[], discardPile:[], exhaustPile:[],
    energy:3, energyMax:3, block:0, statuses:{},
    enemies:[], targetIdx:0, focus:0,
    round:0, combatActive:false,
    pendingRemove:false, pendingRemoveThenKai:false,
    _rewardGold:30, _emsg:'',
    relics: startRelics,
    _skullApplied:false, _essenceUsed:false,
    _extraStartDraw:0, currentNodeType:'combat', _pendingItemReward:null,
    storyChoices:{}, storyMode:false, bookIdx:0, storySection:0,
  };
}

// ── Start game ───────────────────────────────────────────────
function startGame() {
  if(storyMode) {
    loadProgress().then(() => { renderBookGrid(); showScreen('book-select-screen'); });
    return;
  }
  initState();
  updateMapUI();
  showScreen('map-screen');
  setTimeout(() => { const avail=document.querySelector('.map-node.available'); if(avail) avail.scrollIntoView({behavior:'smooth',block:'center'}); }, 100);
}

// ── Event bindings ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Theme first
  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('lw_theme') || 'dark'; } catch(e) {}
  applyTheme(savedTheme);

  // Load progress silently in background — never navigates
  loadProgress();
  initTitle();

  // ── Splash screen buttons ─────────────────────────────────
  document.getElementById('splash-story-btn').addEventListener('click', () => {
    loadProgress().then(() => { renderBookGrid(); showScreen('book-select-screen'); });
  });
  document.getElementById('splash-freeplay-btn').addEventListener('click', () => {
    storyMode = false;
    showScreen('title-screen');
  });
  document.getElementById('splashThemeBtn').addEventListener('click', toggleTheme);

  // ── Title screen ──────────────────────────────────────────
  document.getElementById('title-begin-btn').addEventListener('click', startGame);
  document.getElementById('titleThemeToggle').addEventListener('click', toggleTheme);
  document.getElementById('mode-btn-original').addEventListener('click', () => selectMode('original'));
  document.getElementById('mode-btn-story').addEventListener('click', () => selectMode('story'));

  // Map screen
  document.getElementById('map-deck-btn').onclick = openDeckViewer;
  document.getElementById('fogToggle').onclick = toggleFog;
  document.getElementById('mapThemeToggle').onclick = toggleTheme;

  // Combat screen
  document.getElementById('end-turn-btn').onclick = endTurn;
  document.getElementById('logToggleBtn').onclick = toggleLog;
  document.getElementById('relicToggleBtn').onclick = toggleRelicPanel;
  document.getElementById('combat-deck-btn').onclick = openDeckViewer;
  document.getElementById('logCloseBtn').onclick = toggleLog;
  document.getElementById('relicCloseBtn').onclick = toggleRelicPanel;

  // Reward screen
  document.getElementById('reward-gold-btn').onclick = takeRewardGold;
  document.getElementById('reward-skip-btn').onclick = skipReward;

  // Shop screen
  document.getElementById('shop-leave-btn').onclick = leaveShop;

  // Rest screen
  document.getElementById('rest-heal-opt').onclick = restHeal;
  document.getElementById('rest-forge-opt').onclick = restForge;
  document.getElementById('rest-remove-opt').onclick = restRemove;

  // Game over screen
  document.getElementById('go-restart-btn').onclick = showTitle;
  document.getElementById('go-story-restart-btn').onclick = restartCurrentBook;

  // Win screen
  document.getElementById('win-restart-btn').onclick = showTitle;

  // Item reward screen
  document.getElementById('item-reward-skip-btn').onclick = skipItemReward;

  // Book victory screen
  document.getElementById('bv-return-btn').onclick = returnToBookSelect;

  // Boss cutscene — onclick set dynamically in showBossCutscene

  // Book select screen
  document.getElementById('book-select-back-btn').onclick = showModeSelect;
  document.getElementById('copy-pid-btn').onclick = copyPlayerId;
  document.getElementById('manual-save-btn').onclick = manualSave;
  document.getElementById('pid-import-btn').onclick = importPlayerId;

  // Book intro screen
  document.getElementById('bi-start-btn').onclick = startStoryGame;
  document.getElementById('bi-back-btn').onclick = () => { showScreen('book-select-screen'); renderBookGrid(); };

  // Modals
  document.getElementById('deck-modal-close').onclick = closeDeckViewer;
  document.getElementById('forge-modal-cancel').onclick = () => {
    document.getElementById('forgeModal').classList.remove('open');
    if(G.storyMode) advanceStorySection(); else { updateMapUI(); showScreen('map-screen'); }
  };
  document.getElementById('remove-modal-cancel').onclick = () => {
    document.getElementById('removeModal').classList.remove('open');
    if(G.storyMode) advanceStorySection(); else { updateMapUI(); showScreen('map-screen'); }
  };
  document.getElementById('card-zoom-close').onclick = closeCardZoom;
  document.getElementById('cardZoomModal').onclick = e => { if(e.target === e.currentTarget) closeCardZoom(); };

  // Always end on splash — overrides any active class set in HTML
  showScreen('splash-screen');
});

// Global error handler
window.onerror = function(msg, src, line, col, err) {
  const e = err ? (err.stack || err.message || err) : msg;
  console.error('GAME ERROR:', e);
  return false;
};
