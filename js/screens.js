// ═══════════════════════════════════════════════════════════════
// screens.js  —  Reward, shop, event, rest, deck, card zoom, relics
// ═══════════════════════════════════════════════════════════════

// ── Combat log drawer ────────────────────────────────────────
let logVisible = false;
function toggleLog() {
  logVisible = !logVisible;
  const drawer = document.getElementById('logDrawer');
  const btn = document.getElementById('logToggleBtn');
  if(drawer) drawer.classList.toggle('open', logVisible);
  if(btn) btn.classList.toggle('active', logVisible);
}

// ── Reward screen ────────────────────────────────────────────
function showReward() {
  const isBossReward = G.enemies && G.enemies[0] && G.enemies[0].isBoss;
  const gold = isBossReward ? (40 + G.floor*4 + rand(0,20)) : (20 + G.floor*3 + rand(0,18));
  G._rewardGold = gold;
  document.getElementById('reward-gold-text').textContent = '💰 +' + gold + ' gold';

  const existingBanner = document.getElementById('boss-heal-banner');
  if(existingBanner) existingBanner.remove();
  if(isBossReward) {
    const banner = document.createElement('div');
    banner.id = 'boss-heal-banner'; banner.className = 'boss-heal-banner';
    banner.textContent = '✦ Boss Defeated — HP Fully Restored ✦';
    const rs = document.getElementById('reward-screen');
    rs.insertBefore(banner, rs.children[1]);
  }

  const basePool = getCardPool();
  let pool = G.floor <= 5 ? basePool.filter(c=>!['darklord_bane','kai_mastery','battle_fury','wolf_spirit'].includes(c.id))
           : G.floor <= 10 ? basePool.filter(c=>!['darklord_bane','kai_mastery'].includes(c.id))
           : basePool;

  const chosen = shuffle(pool).slice(0,3);
  const con = document.getElementById('rewardCards'); con.innerHTML = '';
  chosen.forEach(def => {
    const w = document.createElement('div');
    w.className = 'reward-card-wrap';
    w.appendChild(buildCard(def, true));
    w.onclick = () => { G.deck.push(def.id); showNewCardZoom(def.id, afterReward); };
    con.appendChild(w);
  });
  showScreen('reward-screen');
}

function takeRewardGold() { G.gold += G._rewardGold || 30; afterReward(); }
function skipReward() { afterReward(); }

function afterReward() {
  if(G.storyMode) { afterRewardStoryCheck(); return; }
  document.getElementById('deck-count').textContent = G.deck.length;
  updateMapUI();
  renderRelics('map-relics-bar');
  showScreen('map-screen');
}

// ── Shop screen ──────────────────────────────────────────────
function openShop() {
  document.getElementById('shop-gold-val').textContent = G.gold;
  const pool = shuffle(getCardPool()).slice(0,4);
  const con = document.getElementById('shopCards'); con.innerHTML = '';

  pool.forEach(def => {
    const price = 25 + rand(0,25) + (def.type==='kai'?20:0) + (def.cost>=2?10:0);
    const item = document.createElement('div'); item.className = 'shop-item';
    const pe = document.createElement('div'); pe.className = 'shop-price'; pe.textContent = '💰 ' + price;
    const ce = buildCard(def, true);
    ce.onclick = () => {
      if(G.gold >= price && !ce.classList.contains('sold')) {
        G.gold -= price; G.deck.push(def.id);
        ce.classList.add('sold');
        document.getElementById('shop-gold-val').textContent = G.gold;
      }
    };
    item.appendChild(pe); item.appendChild(ce); con.appendChild(item);
  });

  const relicPool = relicsForSource('shop');
  shuffle(relicPool).slice(0, Math.min(2, relicPool.length)).forEach(r => {
    const price = r.rarity==='common'?45 : r.rarity==='uncommon'?70 : 100;
    const item = document.createElement('div'); item.className = 'shop-item';
    const pe = document.createElement('div'); pe.className = 'shop-price'; pe.textContent = '💰 ' + price;
    const box = document.createElement('div');
    box.className = `item-choice ${r.rarity}`;
    box.style.cssText = 'min-width:130px;max-width:155px;padding:.8rem 1rem;cursor:pointer';
    box.innerHTML = `<div class="item-art">${r.art}</div><div class="item-name" style="font-size:.72rem">${r.name}</div><div class="item-rarity ${r.rarity}">${r.rarity}</div><div class="item-desc">${r.desc}</div>`;
    box.onclick = () => {
      if(G.gold >= price && !box.classList.contains('sold')) {
        G.gold -= price; G.relics.push(r.id);
        box.classList.add('sold'); box.style.opacity = '.4';
        document.getElementById('shop-gold-val').textContent = G.gold;
      }
    };
    item.appendChild(pe); item.appendChild(box); con.appendChild(item);
  });

  showScreen('shop-screen');
}

function leaveShop() {
  if(G.storyMode) { advanceStorySection(); return; }
  updateMapUI(); showScreen('map-screen');
}

// ── Event screen ─────────────────────────────────────────────
function openEvent() {
  G._emsg = '';
  const ev = pick(EVENTS);
  document.getElementById('event-art').textContent = ev.art;
  document.getElementById('event-title').textContent = ev.title;
  document.getElementById('event-text').textContent = ev.text;
  const choicesEl = document.getElementById('event-choices'); choicesEl.innerHTML = '';
  ev.choices.forEach(ch => {
    const btn = document.createElement('div');
    btn.className = 'event-choice';
    btn.innerHTML = `<span class="event-choice-label">${ch.label}</span>${ch.desc}`;
    btn.onclick = () => {
      ch.effect(G);
      if(G._pendingItemReward) {
        const src = G._pendingItemReward; G._pendingItemReward = null;
        showItemReward(src, 'You found a special item on the road.', () => { updateMapUI(); showScreen('map-screen'); });
        return;
      }
      if(G.pendingRemoveThenKai) {
        G.pendingRemoveThenKai = false;
        openRemoveModal(() => { gainRandomKaiCard(G, "Sage's Kai technique acquired!"); if(!G.storyMode){updateMapUI();showScreen('map-screen');} });
        return;
      }
      if(G._emsg) {
        document.getElementById('event-text').textContent = G._emsg;
        choicesEl.innerHTML = '<div class="event-choice" id="evt-continue"><span class="event-choice-label">Continue</span>Press on down the road.</div>';
        document.getElementById('evt-continue').onclick = () => { updateMapUI(); showScreen('map-screen'); };
        G._emsg = ''; return;
      }
      updateMapUI(); showScreen('map-screen');
    };
    choicesEl.appendChild(btn);
  });
  showScreen('event-screen');
}

// ── Rest screen ──────────────────────────────────────────────
function showRestScreen() {
  const el = document.getElementById('rest-hp');
  if(el) el.textContent = G.hp + ' / ' + G.hpMax;
  showScreen('rest-screen');
}

function restHeal() {
  G.hp = Math.min(G.hpMax, G.hp + Math.floor(G.hpMax * .3));
  if(hasRelic('ration_pack')) { G.hp = Math.min(G.hpMax, G.hp + 5); }
  if(G.storyMode) { advanceStorySection(); return; }
  updateMapUI(); showScreen('map-screen');
}

function restForge() {
  const grid = document.getElementById('forgeGrid'); grid.innerHTML = '';
  const ups = G.deck.filter(id => ALL_CARDS.some(c=>c.id===id) && ALL_CARDS.some(c=>c.id===id+'+'));
  if(!ups.length) { if(G.storyMode){advanceStorySection();}else{updateMapUI();showScreen('map-screen');} return; }
  ups.forEach(id => {
    const def = getCard(id);
    const el = buildCard(def, true); el.style.cursor = 'pointer';
    el.onclick = () => {
      const i = G.deck.indexOf(id); if(i !== -1) G.deck[i] = id + '+';
      document.getElementById('forgeModal').classList.remove('open');
      showCardZoom(id+'+', {
        label:'CARD TRAINED', hint:'▲ Upgrade applied',
        onClose: () => { if(G.storyMode){advanceStorySection();}else{updateMapUI();showScreen('map-screen');} }
      });
    };
    grid.appendChild(el);
  });
  document.getElementById('forgeModal').classList.add('open');
}

function restRemove() {
  openRemoveModal(() => { if(G.storyMode){advanceStorySection();}else{updateMapUI();showScreen('map-screen');} });
}

function openRemoveModal(cb) {
  const grid = document.getElementById('removeGrid'); grid.innerHTML = '';
  const removable = G.deck.filter(id => id !== 'curse_card' && id !== 'wound_card');
  if(!removable.length) { cb(); return; }
  removable.forEach(id => {
    const def = getCard(id);
    const el = buildCard(def, true); el.style.cursor = 'pointer';
    el.onclick = () => {
      const i = G.deck.indexOf(id); if(i !== -1) G.deck.splice(i, 1);
      document.getElementById('removeModal').classList.remove('open');
      cb();
    };
    grid.appendChild(el);
  });
  document.getElementById('removeModal').classList.add('open');
}

// ── Deck viewer ──────────────────────────────────────────────
function openDeckViewer() {
  const modal = document.getElementById('deckModal');
  const grid = document.getElementById('deckGrid'); grid.innerHTML = '';
  const counts = {};
  G.deck.forEach(id => counts[id] = (counts[id]||0) + 1);
  const seen = new Set();

  [...G.deck].sort().forEach(id => {
    if(seen.has(id)) return; seen.add(id);
    const def = getCard(id);
    const cnt = counts[id];
    const canUpgrade = ALL_CARDS.some(c => c.id === id+'+');
    const isUpgraded = id.endsWith('+');

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:3px;position:relative;cursor:pointer;';
    const cardEl = buildCard(def, false);
    cardEl.style.transition = 'transform .2s,box-shadow .2s';
    cardEl.addEventListener('mouseenter', () => { cardEl.style.transform='translateY(-4px) scale(1.04)'; cardEl.style.boxShadow='0 6px 24px rgba(0,0,0,.7)'; });
    cardEl.addEventListener('mouseleave', () => { cardEl.style.transform=''; cardEl.style.boxShadow=''; });
    cardEl.addEventListener('click', () => showCardZoom(id));
    cardEl.addEventListener('touchend', e => { e.preventDefault(); showCardZoom(id); });
    wrap.appendChild(cardEl);

    if(cnt > 1) {
      const badge = document.createElement('div');
      badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:var(--gold);color:var(--bg);border-radius:50%;width:17px;height:17px;font-size:.6rem;font-family:Cinzel,serif;font-weight:700;display:flex;align-items:center;justify-content:center;z-index:5;';
      badge.textContent = 'x'+cnt; wrap.appendChild(badge);
    }
    const upLabel = document.createElement('div');
    upLabel.style.cssText = 'font-family:Cinzel,serif;font-size:.44rem;letter-spacing:.07em;text-align:center;';
    if(isUpgraded) {
      upLabel.style.color = 'var(--gold)'; upLabel.textContent = '✦ TRAINED ✦';
    } else if(canUpgrade) {
      const upgDef = getCard(id+'+');
      upLabel.style.color = 'var(--green2)'; upLabel.textContent = '▲ Train: ' + upgDef.name;
      const tip = document.createElement('div');
      tip.style.cssText = 'display:none;position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%);background:var(--panel);border:1px solid var(--green2);padding:.4rem .5rem;border-radius:3px;font-size:.5rem;z-index:200;color:var(--text);font-family:Crimson Pro,serif;font-style:italic;min-width:140px;max-width:180px;text-align:center;white-space:normal;';
      tip.innerHTML = '<span style="color:var(--green2);font-family:Cinzel,serif;font-size:.48rem;display:block;margin-bottom:2px;">'+upgDef.name+'</span>'+upgDef.desc;
      wrap.appendChild(tip);
      wrap.addEventListener('mouseenter', () => tip.style.display='block');
      wrap.addEventListener('mouseleave', () => tip.style.display='none');
    } else {
      upLabel.style.color = 'var(--text2)'; upLabel.textContent = '— max rank —';
    }
    wrap.appendChild(upLabel);
    grid.appendChild(wrap);
  });

  const summary = document.getElementById('deckSummary');
  if(summary) {
    const types = {};
    G.deck.forEach(id => { const d=getCard(id); types[d.type]=(types[d.type]||0)+1; });
    summary.textContent = G.deck.length + ' cards · ' + Object.entries(types).map(([t,n])=>n+' '+t).join(' · ');
  }
  modal.classList.add('open');
}

function closeDeckViewer() { document.getElementById('deckModal').classList.remove('open'); }

// ── Upgrade utility ──────────────────────────────────────────
function upgradeRandomCardInDeck() {
  const ups = G.deck.filter(id => ALL_CARDS.some(c => c.id === id+'+'));
  if(!ups.length) return;
  const chosen = pick(ups);
  G.deck[G.deck.indexOf(chosen)] = chosen + '+';
  addLog && addLog('Upgraded ' + getCard(chosen).name + '!');
}

// ── Relic rendering ──────────────────────────────────────────
function renderRelics(barId) {
  const bar = document.getElementById(barId); if(!bar) return;
  bar.innerHTML = '';
  if(!G.relics || !G.relics.length) return;
  G.relics.forEach(id => {
    const r = ALL_RELICS.find(x => x.id === id); if(!r) return;
    const pip = document.createElement('div');
    pip.className = `relic-pip ${r.rarity}`;
    pip.innerHTML = `<span class="relic-art">${r.art}</span><span>${r.name}</span><div class="relic-tooltip">${r.desc}</div>`;
    bar.appendChild(pip);
  });
}

function toggleRelicPanel() {
  const panel = document.getElementById('relicPanelDrawer');
  const btn = document.getElementById('relicToggleBtn');
  if(!panel) return;
  const opening = !panel.classList.contains('open');
  panel.classList.toggle('open');
  if(btn) btn.classList.toggle('active', opening);
  if(opening) renderRelicPanel();
}

function renderRelicPanel() {
  const list = document.getElementById('relicPanelList'); if(!list) return;
  list.innerHTML = '';
  if(!G.relics || !G.relics.length) {
    list.innerHTML = '<div style="color:var(--text2);font-style:italic;font-size:.7rem;padding:.3rem">No items carried.</div>';
    return;
  }
  G.relics.forEach(id => {
    const r = ALL_RELICS.find(x => x.id === id); if(!r) return;
    const row = document.createElement('div'); row.className = 'relic-panel-item';
    row.innerHTML = '<div class="relic-panel-art">'+r.art+'</div><div class="relic-panel-info"><div class="relic-panel-name">'+r.name+'</div><div class="relic-panel-rarity '+r.rarity+'">'+r.rarity+'</div><div class="relic-panel-desc">'+r.desc+'</div></div>';
    list.appendChild(row);
  });
}

// ── Relic combat triggers ────────────────────────────────────
function applyRelicsOnCombatStart() {
  G._cardsDrawnThisTurn = 0;
  if(hasRelic('healing_herb'))  { G.hp = Math.min(G.hpMax, G.hp + 3); addLog('Healing Herb: +3 HP.'); }
  if(hasRelic('runed_bracers')) { G.energyMax = 4; G.energy = 4; addLog('Runed Bracers: +1 Energy!'); }
  if(hasRelic('giak_skull') && !G._skullApplied) { G.hpMax += 10; G.hp += 10; G._skullApplied = true; }
  if(hasRelic('darkstone'))     { G.powers.strength = (G.powers.strength||0) + 2; addLog('Darkstone: +2 Strength.'); }
  if(hasRelic('kai_medallion')) { G._extraStartDraw = 2; }
  if(hasRelic('bone_ring'))     { G.focus = (G.focus||0) + 1; addLog('Bone Ring: +1 Focus.'); }
  if(hasRelic('kai_shroud'))    { const first = liveEnemies()[0]; if(first) { first.stunned = 1; addLog('Kai Shroud: '+first.name+' starts stunned!'); } }
  G._whetstone_used = false;
}

function applyRelicsOnTurnStart() {
  G._cardsDrawnThisTurn = 0;
  if(hasRelic('wolf_pelt') && G.round === 1) { G.block += 4; }
  if(hasRelic('iron_crown'))    { G.block += 1; }
  if(hasRelic('scroll_of_kai')) { drawCards(1); }
  if(hasRelic('whetstone'))     { G._whetstone_used = false; }
  if(hasRelic('war_horn') && liveEnemies().length >= 3) { G.energy += 2; addLog('War Horn: +2 Energy!'); }
}

function applyRelicsOnBlock(amt) { return hasRelic('stone_seal') ? amt + 1 : amt; }

function applyRelicsOnHeal(amt) {
  const healed = hasRelic('elder_amulet') ? Math.floor(amt * 1.5) : amt;
  if(hasRelic('kai_flame') && healed > 0) {
    const blockGain = Math.min(5, Math.floor(healed / 2));
    if(blockGain > 0) { G.block += blockGain; addLog('Kai Flame: +'+blockGain+' Block from healing.'); }
  }
  return healed;
}

function checkVordakEssence() {
  if(hasRelic('vordak_essence') && !G._essenceUsed && G.hp <= 0) {
    G.hp = 1; G._essenceUsed = true; addLog('✦ Vordak Essence saved you from death!'); return true;
  }
  return false;
}

// ── Item reward flow ─────────────────────────────────────────
let _itemCallback = null;

function showItemReward(source, subText, onClose) {
  _itemCallback = onClose || (() => { updateMapUI(); showScreen('map-screen'); });
  const pool = relicsForSource(source);
  if(!pool.length) { _itemCallback(); return; }
  const choices = shuffle(pool).slice(0, Math.min(2, pool.length));
  document.getElementById('item-reward-sub').textContent = subText || 'A Kai artefact awaits — choose one to carry.';
  const con = document.getElementById('itemChoices'); con.innerHTML = '';
  choices.forEach(r => {
    const div = document.createElement('div'); div.className = 'item-choice';
    div.innerHTML = `<div class="item-art">${r.art}</div><div class="item-name">${r.name}</div><div class="item-rarity ${r.rarity}">${r.rarity}</div><div class="item-desc">${r.desc}</div>`;
    div.onclick = () => { G.relics.push(r.id); showRelicZoom(r.id, _itemCallback); };
    con.appendChild(div);
  });
  showScreen('item-reward-screen');
}

function skipItemReward() { if(_itemCallback) _itemCallback(); }

// ── Card / relic zoom modals ──────────────────────────────────
function showCardZoom(cardId, opts) {
  opts = opts || {};
  const def = getCard(cardId);
  const baseId = cardId.endsWith('+') ? cardId.slice(0,-1) : cardId;
  const upgId  = baseId + '+';
  const upgDef = ALL_CARDS.find(c => c.id === upgId);
  const isUpgraded = cardId.endsWith('+');

  const modal = document.getElementById('cardZoomModal');
  const panels = document.getElementById('czPanels');
  document.getElementById('czHeader').textContent = opts.label || def.name.toUpperCase();
  document.getElementById('czHint').textContent = opts.hint || (upgDef && !isUpgraded ? '▲ Can be trained at a Refuge' : isUpgraded ? '✦ Already trained to full rank' : '— Maximum rank —');
  panels.innerHTML = '';

  const basePanel = document.createElement('div'); basePanel.className = 'card-zoom-panel';
  const baseLbl = document.createElement('div');
  baseLbl.className = 'card-zoom-label ' + (isUpgraded ? 'maxrank' : opts.isNew ? 'new-card' : 'base');
  baseLbl.textContent = opts.isNew ? '✦ NEW CARD' : isUpgraded ? '✦ TRAINED' : 'BASE';
  basePanel.appendChild(baseLbl); basePanel.appendChild(buildCard(def, false)); panels.appendChild(basePanel);

  if(upgDef && !isUpgraded) {
    const upgPanel = document.createElement('div'); upgPanel.className = 'card-zoom-panel';
    const upgLbl = document.createElement('div'); upgLbl.className = 'card-zoom-label trained'; upgLbl.textContent = '▲ TRAINED';
    upgPanel.appendChild(upgLbl); upgPanel.appendChild(buildCard(upgDef, false)); panels.appendChild(upgPanel);
  }

  const activeSc = document.querySelector('.screen.active');
  if(activeSc) { activeSc.style.visibility = 'hidden'; modal._bgScreen = activeSc; } else modal._bgScreen = null;
  modal.classList.add('open');
  modal._onClose = opts.onClose || null;
}

function closeCardZoom() {
  const modal = document.getElementById('cardZoomModal');
  modal.classList.remove('open');
  if(modal._bgScreen) { modal._bgScreen.style.visibility = ''; modal._bgScreen = null; }
  if(modal._onClose) { modal._onClose(); modal._onClose = null; }
}

function showRelicZoom(relicId, onClose) {
  const r = ALL_RELICS.find(x => x.id === relicId);
  if(!r) { if(onClose) onClose(); return; }
  const modal = document.getElementById('cardZoomModal');
  const panels = document.getElementById('czPanels');
  document.getElementById('czHeader').textContent = '✦ ITEM ACQUIRED';
  document.getElementById('czHint').textContent = r.desc;
  panels.innerHTML = '';
  const box = document.createElement('div');
  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:.6rem;padding:1.2rem 1.8rem;border:1px solid var(--border);border-radius:6px;background:var(--panel);min-width:160px;text-align:center;';
  box.innerHTML = `<div style="font-size:3.2rem;line-height:1">${r.art}</div><div style="font-family:Cinzel,serif;font-size:.85rem;letter-spacing:.1em;color:var(--gold)">${r.name}</div><div class="item-rarity ${r.rarity}" style="font-size:.6rem;letter-spacing:.2em;text-transform:uppercase">${r.rarity}</div><div style="font-size:.78rem;color:var(--text2);font-style:italic;line-height:1.5;max-width:220px">${r.desc}</div>`;
  panels.appendChild(box);
  const activeSc = document.querySelector('.screen.active');
  if(activeSc) { activeSc.style.visibility = 'hidden'; modal._bgScreen = activeSc; } else modal._bgScreen = null;
  modal.classList.add('open');
  modal._onClose = onClose || null;
}

function showNewCardZoom(cardId, onContinue) {
  showCardZoom(cardId, { label:'CARD ACQUIRED', hint:'Added to your deck', isNew:true, onClose:onContinue });
}

function showDiscPreview(discId) {
  const d = KAI_DISCIPLINES.find(x => x.id === discId); if(!d) return;
  const cardDef  = ALL_CARDS.find(c => c.id === d.flavorCard);
  const relicDef = ALL_RELICS.find(r => r.id === d.relic);
  const kaiRelic = ALL_RELICS.find(r => r.rarity === 'kai' && r.disc === discId);
  const modal = document.getElementById('cardZoomModal');
  const panels = document.getElementById('czPanels');
  document.getElementById('czHeader').textContent = d.icon + ' ' + d.name.toUpperCase();
  document.getElementById('czHint').textContent = d.hint;
  panels.innerHTML = '';

  if(cardDef) {
    const wrap = document.createElement('div'); wrap.className = 'card-zoom-panel';
    const lbl = document.createElement('div'); lbl.className = 'card-zoom-label base'; lbl.textContent = '📜 STARTING CARD';
    wrap.appendChild(lbl); wrap.appendChild(buildCard(cardDef, true)); panels.appendChild(wrap);
  }

  [relicDef, kaiRelic && kaiRelic.id !== relicDef?.id ? kaiRelic : null].filter(Boolean).forEach(r => {
    const box = document.createElement('div'); box.className = 'card-zoom-panel';
    const lbl = document.createElement('div'); lbl.className = 'card-zoom-label base'; lbl.textContent = '✦ STARTING ITEM';
    box.appendChild(lbl);
    const inner = document.createElement('div');
    inner.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:.5rem;padding:1rem 1.4rem;border:1px solid var(--border);border-radius:6px;background:var(--panel);min-width:120px;text-align:center;';
    inner.innerHTML = `<div style="font-size:2.6rem;line-height:1">${r.art}</div><div style="font-family:Cinzel,serif;font-size:.78rem;letter-spacing:.08em;color:var(--gold)">${r.name}</div><div style="font-size:.72rem;color:var(--text2);font-style:italic;line-height:1.45;max-width:180px">${r.desc}</div>`;
    box.appendChild(inner); panels.appendChild(box);
  });

  const activeSc = document.querySelector('.screen.active');
  if(activeSc) { activeSc.style.visibility = 'hidden'; modal._bgScreen = activeSc; } else modal._bgScreen = null;
  modal.classList.add('open'); modal._onClose = null;
}
