// ═══════════════════════════════════════════════════════════════
// story.js  —  Story mode, book select, decisions, boss cutscenes
// ═══════════════════════════════════════════════════════════════

let storyMode = true;
let activeBookIdx = 0;
let storySelectedDiscs = [];

// ── Mode toggle ──────────────────────────────────────────────
function showModeSelect() { showScreen('title-screen'); }

function selectMode(mode) {
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('mode-btn-' + mode).classList.add('active');
  if(mode === 'story') {
    storyMode = true;
    loadProgress().then(() => { renderBookGrid(); showScreen('book-select-screen'); });
  } else {
    storyMode = false;
    showScreen('title-screen');
  }
}

// ── Book select ──────────────────────────────────────────────
function renderBookGrid() {
  const pid = getOrCreatePlayerId();
  const spid = document.getElementById('sidebar-pid');
  if(spid) spid.textContent = pid;
  const grid = document.getElementById('bookGrid'); if(!grid) return;
  grid.innerHTML = '';
  BOOKS.forEach((book, i) => {
    const completed = PROGRESS.booksCompleted.includes(i);
    const locked = i > 0 && !PROGRESS.booksCompleted.includes(i-1);
    const maxDiscs = 5 + PROGRESS.booksCompleted.length;
    const el = document.createElement('div');
    el.className = 'book-card' + (locked?' locked':'') + (completed?' completed':'');
    el.innerHTML = `<div class="book-num">Book ${book.num}</div><div class="book-art">${book.art}</div><div class="book-title">${book.title}</div><div class="book-setting">${book.setting}</div><div class="book-disc-badge">${locked?'🔒 Complete Book '+book.num+' first':maxDiscs+' Disciplines'}</div>${locked?'<div class="book-lock">🔒</div>':''}`;
    if(!locked) el.onclick = () => openBookIntro(i);
    grid.appendChild(el);
  });
}

// ── Book intro — narrative + discipline pick ─────────────────
function openBookIntro(bookIdx) {
  activeBookIdx = bookIdx; storyMode = true;
  const book = BOOKS[bookIdx];
  const maxDiscs = Math.min(9, 5 + PROGRESS.booksCompleted.length);
  document.getElementById('bi-eyebrow').textContent = 'Book ' + book.num + ' of ' + BOOKS.length;
  document.getElementById('bi-title').textContent = book.title;
  document.getElementById('bi-art').textContent = book.art;
  document.getElementById('bi-text').textContent = book.intro;
  document.getElementById('bi-disc-label').textContent = `Choose ${maxDiscs} Kai Discipline${maxDiscs!==1?'s':''}`;
  document.getElementById('bi-disc-hint').textContent = '★ Recommended disciplines are highlighted for this journey';
  storySelectedDiscs = [];
  renderStoryDiscGrid(book, maxDiscs);
  showScreen('book-intro-screen');
}

function renderStoryDiscGrid(book, maxDiscs) {
  const grid = document.getElementById('storyDiscGrid'); if(!grid) return;
  grid.innerHTML = '';
  KAI_DISCIPLINES.forEach(d => {
    const cardDef = ALL_CARDS.find(c => c.id === d.flavorCard);
    const relicDef = ALL_RELICS.find(r => r.id === d.relic);
    const isRec = book.recommendedDiscs.includes(d.id);
    const el = document.createElement('div');
    el.className = 'kai-disc-card' + (storySelectedDiscs.includes(d.id)?' selected':'') + (isRec?' recommended':'');
    el.dataset.id = d.id;
    el.innerHTML = `<div class="disc-icon">${d.icon}</div><div class="disc-name">${d.name}</div><div class="disc-hint">${d.hint}</div><div class="disc-grants"><span>📜 ${cardDef?cardDef.name:d.flavorCard}</span><span>✦ ${relicDef?relicDef.art:''}</span><span class="disc-preview-btn" onclick="event.stopPropagation();showDiscPreview('${d.id}')">👁</span></div>`;
    el.onclick = () => toggleStoryDisc(d.id, maxDiscs);
    grid.appendChild(el);
  });
  updateStoryDiscChosen(maxDiscs);
}

function toggleStoryDisc(id, maxDiscs) {
  if(storySelectedDiscs.includes(id)) storySelectedDiscs = storySelectedDiscs.filter(d => d !== id);
  else { if(storySelectedDiscs.length >= maxDiscs) storySelectedDiscs.shift(); storySelectedDiscs.push(id); }
  document.querySelectorAll('#storyDiscGrid .kai-disc-card').forEach(el => el.classList.toggle('selected', storySelectedDiscs.includes(el.dataset.id)));
  updateStoryDiscChosen(maxDiscs);
}

function updateStoryDiscChosen(maxDiscs) {
  const el = document.getElementById('storyDiscChosen'); if(!el) return;
  const n = storySelectedDiscs.length;
  const names = storySelectedDiscs.map(id => { const d=KAI_DISCIPLINES.find(x=>x.id===id); return d?d.icon+' '+d.name:id; });
  el.textContent = n===0?'None chosen' : n<maxDiscs?`${names.join(' · ')} (choose ${maxDiscs-n} more)` : names.join(' · ');
}

// ── Start story game ─────────────────────────────────────────
function startStoryGame() {
  const maxDiscs = Math.min(9, 5 + PROGRESS.booksCompleted.length);
  if(storySelectedDiscs.length < Math.min(maxDiscs, 5)) { alert('Please choose at least 5 Kai Disciplines to begin.'); return; }
  selectedDiscs = [...storySelectedDiscs];
  initState();
  G.storyMode = true; G.bookIdx = activeBookIdx; G.storySection = 0;
  updateStoryMapUI();
  showScreen('map-screen');
}

// ── Story map UI ─────────────────────────────────────────────
function updateStoryMapUI() {
  const fogBtn = document.getElementById('fogToggle'); if(fogBtn) fogBtn.style.display = 'none';
  const book = BOOKS[G.bookIdx];
  document.getElementById('map-hp').textContent = G.hp+'/'+G.hpMax;
  document.getElementById('map-gold').textContent = G.gold;
  document.getElementById('map-floor').textContent = (G.floor+1)+' / '+book.sections.length;
  document.getElementById('map-disc').textContent = book.art+' '+book.title;
  document.getElementById('deck-count').textContent = G.deck.length;
  renderRelics('map-relics-bar');

  const container = document.getElementById('mapNodes');
  container.style.flexDirection = 'column';
  container.innerHTML = '';
  const section = book.sections[G.floor]; if(!section) return;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:.9rem;padding:1.2rem 1rem;max-width:520px;width:100%;';

  const prog = document.createElement('div');
  prog.style.cssText = "font-family:'Cinzel',serif;font-size:.52rem;letter-spacing:.25em;color:var(--text2);text-align:center;";
  prog.textContent = book.title.toUpperCase()+' · SECTION '+(G.floor+1)+' OF '+book.sections.length;
  wrap.appendChild(prog);

  const artEl = document.createElement('div');
  artEl.style.cssText = 'font-size:3.2rem;filter:drop-shadow(0 0 20px rgba(184,148,60,.3));';
  artEl.textContent = section.art || book.art; wrap.appendChild(artEl);

  const titleEl = document.createElement('div');
  titleEl.style.cssText = "font-family:'Cinzel',serif;font-size:1rem;color:var(--gold);letter-spacing:.12em;text-align:center;";
  titleEl.textContent = section.title; wrap.appendChild(titleEl);

  const rule = document.createElement('div');
  rule.style.cssText = 'width:80%;height:1px;background:linear-gradient(90deg,transparent,rgba(184,148,60,.4),transparent);';
  wrap.appendChild(rule);

  const sceneEl = document.createElement('div');
  sceneEl.style.cssText = "font-family:'Crimson Pro',Georgia,serif;font-size:.9rem;color:var(--text2);font-style:italic;line-height:1.7;text-align:center;max-width:460px;";
  sceneEl.textContent = section.scene; wrap.appendChild(sceneEl);

  const btn = document.createElement('button');
  btn.className = 'btn-primary';
  btn.style.cssText = 'font-size:.78rem;padding:.55rem 2rem;margin-top:.5rem;';
  btn.textContent = 'CHOOSE YOUR PATH ▶';
  btn.onclick = () => openStoryDecision(G.floor, 0);
  wrap.appendChild(btn);

  container.appendChild(wrap);
}

// ── Story decision screen ────────────────────────────────────
function openStoryDecision(ri, nodeIdx) {
  const book = BOOKS[G.bookIdx];
  const section = book.sections[ri];
  G.floor = ri; G.storySection = ri;

  document.getElementById('sd-book-label').textContent = book.title+' · Section '+(ri+1);
  document.getElementById('sd-section-title').textContent = section.title;
  document.getElementById('sd-scene-art').textContent = section.art || book.art;
  document.getElementById('sd-scene-text').textContent = section.scene;

  const choicesCon = document.getElementById('sd-choices'); choicesCon.innerHTML = '';
  const typeLabels = { combat:'⚔ Fight', event:'📖 Encounter', rest:'🏕 Rest', shop:'🛒 Trade', boss:'☠ Final Battle' };
  section.nodes.forEach((node, idx) => {
    const btn = document.createElement('div'); btn.className = 'sd-choice';
    const desc = node.combatIntro || node.restIntro || node.label;
    btn.innerHTML = '<div class="sd-choice-icon">'+node.icon+'</div><div class="sd-choice-body"><div class="sd-choice-label '+node.type+'">'+( typeLabels[node.type]||node.type)+'</div><div class="sd-choice-text">'+desc+'</div></div>';
    btn.onclick = () => _executeNode(ri, idx, node);
    choicesCon.appendChild(btn);
  });
  showScreen('story-decision-screen');
}

function _executeNode(ri, nodeIdx, node) {
  if(!G.storyChoices) G.storyChoices = {};
  G.storyChoices[ri] = nodeIdx;
  G.currentNodeType = node.type; G.floor = ri; G.storySection = ri;

  if(node.type === 'boss') showBossCutscene(ri);
  else if(node.type === 'combat' || node.type === 'elite') _startStoryCombat(node, ri);
  else if(node.type === 'rest') { showScreen('rest-screen'); const e=document.getElementById('rest-hp'); if(e) e.textContent=G.hp+' / '+G.hpMax; }
  else if(node.type === 'shop') openShop();
  else if(node.type === 'event') openStoryNodeEvent(BOOKS[G.bookIdx].sections[ri], node);
}

function _startStoryCombat(node, ri) {
  if(node.enemies && node.enemies.length) {
    const scale = 1 + ri * 0.04;
    G.enemies = node.enemies.map(base => {
      const e = JSON.parse(JSON.stringify(base));
      e.hp = Math.round(e.hp * scale); e.hpMax = e.hp;
      e.block = 0; e.statuses = {}; e.actionIdx = 0; e.pinned = 0; e.marked = 0; e.stunned = 0; e.hasActed = false;
      return e;
    });
    G.targetIdx = 0; G.round = 0; G.powers = {}; G.combatActive = true; G.block = 0; G.statuses = {};
    G.energyMax = 3; G.energy = 3; G.focus = 0;
    G.drawPile = shuffle([...G.deck]); G.hand = []; G.discardPile = []; G.exhaustPile = [];
    G._extraStartDraw = 0; G._pendingTarget = null;
    applyRelicsOnCombatStart();
    renderCombatTitle(node.type==='elite'?'★ ELITE':null);
    document.getElementById('c-floor').textContent = 'Section '+G.floor;
    showScreen('combat-screen');
    renderRelics('combat-relics-bar');
    renderCombatUI();
    startPlayerTurn();
  } else {
    startCombat(node.type==='elite'?'elite':'combat', ri);
  }
}

function openStoryNodeEvent(section, node) {
  const book = BOOKS[G.bookIdx];
  let evt = node.eventId ? book.events.find(e => e.id === node.eventId) : null;
  if(!evt) evt = { title:section.title, art:node.icon, text:section.scene, choices:node.outcomes||[{label:node.label,effect:{},txt:'You proceed carefully.'}] };

  document.getElementById('sd-book-label').textContent = '📖 Encounter';
  document.getElementById('sd-section-title').textContent = section.title;
  document.getElementById('sd-scene-art').textContent = evt.art || node.icon;
  document.getElementById('sd-scene-text').textContent = evt.text || section.scene;

  const choicesCon = document.getElementById('sd-choices'); choicesCon.innerHTML = '';
  evt.choices.forEach(ch => {
    const btn = document.createElement('div'); btn.className = 'sd-choice';
    const warnParts = [];
    if(ch.effect && ch.effect.heal < 0) warnParts.push('Lose '+Math.abs(ch.effect.heal)+' HP');
    if(ch.effect && ch.effect.gold < 0) warnParts.push('Costs '+Math.abs(ch.effect.gold)+' gold');
    btn.innerHTML = '<div class="sd-choice-icon">'+(ch.icon||'→')+'</div><div class="sd-choice-body">'+(warnParts.length?'<div class="sd-choice-warning">⚠ '+warnParts.join(' · ')+'</div>':'')+'<div class="sd-choice-text">'+ch.label+'</div></div>';
    btn.onclick = () => applyStoryEventChoice(ch);
    choicesCon.appendChild(btn);
  });
  showScreen('story-decision-screen');
}

function applyStoryEventChoice(ch) {
  const ef = ch.effect || {};
  if(ef.heal) { const h = Math.max(-G.hp+1, ef.heal); G.hp = Math.min(G.hpMax, G.hp + h); }
  if(ef.gold) { G.gold = Math.max(0, G.gold + ef.gold); }
  showStoryOutcome(ch.txt || 'You proceed.', () => {
    if(ef.card) {
      const isRealCard = ALL_CARDS.some(c => c.id === ef.card);
      const isRelic    = ALL_RELICS.some(r => r.id === ef.card);
      if(isRelic && !isRealCard) {
        let relicId = ef.card;
        if(G.relics.includes(relicId)) {
          const intended = ALL_RELICS.find(r => r.id === relicId);
          const rarity = intended ? intended.rarity : 'common';
          const rarityOrder = ['common','uncommon','rare'];
          let fallback = null;
          for(let i = rarityOrder.indexOf(rarity); i >= 0 && !fallback; i--) {
            const pool = ALL_RELICS.filter(r => r.rarity === rarityOrder[i] && r.rarity !== 'kai' && !G.relics.includes(r.id));
            if(pool.length) fallback = pool[Math.floor(Math.random()*pool.length)];
          }
          if(fallback) { relicId = fallback.id; }
          else { G.gold += 20; advanceStorySection(); return; }
        }
        G.relics.push(relicId);
        showRelicZoom(relicId, advanceStorySection);
      } else if(isRealCard) {
        G.deck.push(ef.card);
        showNewCardZoom(ef.card, advanceStorySection);
      } else {
        advanceStorySection();
      }
    } else {
      advanceStorySection();
    }
  });
}

function showStoryOutcome(text, onContinue) {
  document.getElementById('sd-book-label').textContent = '';
  document.getElementById('sd-section-title').textContent = '';
  document.getElementById('sd-scene-art').textContent = '📖';
  document.getElementById('sd-scene-text').textContent = text;
  document.getElementById('sd-choices').innerHTML = '<div style="text-align:center;font-size:.62rem;color:var(--text2);font-style:italic;padding:.6rem;letter-spacing:.1em;">Continuing…</div>';
  showScreen('story-decision-screen');
  setTimeout(onContinue, 2500);
}

// ── Boss cutscene ─────────────────────────────────────────────
function showBossCutscene(ri) {
  const boss = BOOKS[G.bookIdx].boss;
  document.getElementById('bcs-art').textContent = boss.art;
  document.getElementById('bcs-name').textContent = boss.name;
  document.getElementById('bcs-title').textContent = boss.title;
  document.getElementById('bcs-scene').textContent = boss.scene;
  document.getElementById('bcs-fight-btn').textContent = boss.fightLabel;
  document.getElementById('bcs-fight-btn').onclick = () => startStoryBoss(ri, boss);
  showScreen('boss-cutscene-screen');
}

function startStoryBoss(ri, boss) {
  const bossEnemy = JSON.parse(JSON.stringify(boss.enemy));
  G.enemies = [bossEnemy];
  G.targetIdx = 0;
  startCombat('boss', ri);
  if(G.storyMode && G.bookIdx === 1) {
    if(!G.hand.includes('sommerswerd') && !G.deck.includes('sommerswerd') && !G.discardPile.includes('sommerswerd')) {
      G.hand.push('sommerswerd'); addLog('✦ The Sommerswerd blazes in your hand! ✦'); renderCombatUI();
    }
  }
}

// ── Advance story ─────────────────────────────────────────────
function advanceStorySection() {
  const book = BOOKS[G.bookIdx];
  const next = G.floor + 1;
  if(next >= book.sections.length) showBookVictory();
  else { G.floor = next; openStoryDecision(next, 0); }
}

// ── Book victory ──────────────────────────────────────────────
function showBookVictory() {
  const book = BOOKS[G.bookIdx]; const bookIdx = G.bookIdx;
  document.getElementById('bv-art').textContent = book.art;
  document.getElementById('bv-title').textContent = book.title + ' — Complete!';
  document.getElementById('bv-ending').textContent = book.ending;
  if(!PROGRESS.booksCompleted.includes(bookIdx)) {
    PROGRESS.booksCompleted.push(bookIdx);
    PROGRESS.discUnlocks = 5 + PROGRESS.booksCompleted.length;
    const unlockEl = document.getElementById('bv-unlock');
    const nextBook = BOOKS[bookIdx + 1];
    if(nextBook) { unlockEl.textContent = '✦ Unlocked: '+nextBook.title+' · You may now master '+PROGRESS.discUnlocks+' Disciplines'; unlockEl.style.display = 'block'; }
    else { unlockEl.textContent = '✦ All five books complete — Kai Lord Supreme!'; unlockEl.style.display = 'block'; }
    document.getElementById('bv-save-note').textContent = 'Saving progress to cloud…';
    saveProgress().then(ok => { document.getElementById('bv-save-note').textContent = ok ? '✓ Progress saved to cloud' : '✗ Save failed — copy your Player ID to restore progress'; });
  } else {
    document.getElementById('bv-unlock').style.display = 'none';
    document.getElementById('bv-save-note').textContent = 'This book was already completed.';
  }
  showScreen('book-victory-screen');
}

function restartCurrentBook() { if(!storyMode) return; openBookIntro(activeBookIdx); }
function returnToBookSelect() { storyMode = false; renderBookGrid(); showScreen('book-select-screen'); }

function storyPlayerDied() {
  G.combatActive = false;
  const book = BOOKS[G.bookIdx];
  document.getElementById('go-floor').textContent = G.floor + 1;
  document.getElementById('go-kills').textContent = G.kills;
  document.getElementById('go-cards').textContent = G.deck.length;
  document.getElementById('go-msg').textContent = 'Fallen in '+book.title+'. The journey must begin again.';
  const retryBtn = document.getElementById('go-story-restart-btn');
  const normalBtn = document.getElementById('go-restart-btn');
  if(retryBtn) retryBtn.style.display = 'inline-block';
  if(normalBtn) normalBtn.style.display = 'none';
  showScreen('gameover-screen');
}

function afterRewardStoryCheck() {
  if(G.storyMode) advanceStorySection();
  else { document.getElementById('deck-count').textContent = G.deck.length; updateMapUI(); renderRelics('map-relics-bar'); showScreen('map-screen'); }
}
