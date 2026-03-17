// ═══════════════════════════════════════════════════════════════
// map.js  —  Free-play map rendering and node entry
// ═══════════════════════════════════════════════════════════════

function toggleFog() {
  fogMode = !fogMode;
  const btn = document.getElementById('fogToggle');
  if(btn) { btn.classList.toggle('active', !fogMode); btn.textContent = fogMode ? '👁 Farsight' : '🌫 Fog'; }
  updateMapUI();
}

function updateMapUI() {
  if(G && G.storyMode) { updateStoryMapUI(); return; }
  const fogBtn = document.getElementById('fogToggle'); if(fogBtn) fogBtn.style.display = '';
  document.getElementById('map-hp').textContent = G.hp+'/'+G.hpMax;
  document.getElementById('map-gold').textContent = G.gold;
  document.getElementById('map-floor').textContent = 'Section '+(G.floor+1||1);
  const discIcons = (G.disciplines||[]).map(id => { const d=KAI_DISCIPLINES.find(x=>x.id===id); return d?d.icon:''; }).join('');
  document.getElementById('map-disc').textContent = discIcons || 'Kai';
  document.getElementById('deck-count').textContent = G.deck.length;
  renderRelics('map-relics-bar');
  const btn = document.getElementById('fogToggle');
  if(btn) { btn.classList.toggle('active', !fogMode); btn.textContent = fogMode ? '👁 Farsight' : '🌫 Fog'; }

  const con = document.getElementById('mapNodes'); con.innerHTML = '';

  MAP.forEach((row, ri) => {
    if(ACT_STARTS.includes(ri)) {
      const div = document.createElement('div'); div.className = 'act-divider';
      div.innerHTML = '<span>'+ACT_NAMES[ACT_STARTS.indexOf(ri)]+'</span>';
      con.appendChild(div);
    }
    const rowEl = document.createElement('div'); rowEl.className = 'map-row';
    row.forEach((type, ci) => {
      const node = document.createElement('div');
      const isVisited   = ri < G.floor;
      const isAvailable = ri === G.floor;
      const isFog = fogMode && ri > G.floor + 1;
      const isNext = ri === G.floor + 1;
      const status = isVisited ? 'visited' : isAvailable ? 'available' : 'locked';
      let fogClass = '';
      if(fogMode && ri > G.floor + 1) fogClass = ' fog';
      else if(fogMode && isNext) fogClass = ' fog-near';

      const showType = !fogMode || ri <= G.floor + 1;
      node.className = `map-node ${showType?type:'event'} ${status}${fogClass}`;
      const T = NODE_INFO;
      if(isFog) node.innerHTML = '<span>?</span><span class="node-label">???</span>';
      else node.innerHTML = T[type].e+'<span class="node-label">'+T[type].l+'</span>';

      if(isAvailable) node.onclick = () => enterNode(ri, type);
      rowEl.appendChild(node);
    });
    con.appendChild(rowEl);
  });
}

function enterNode(ri, type) {
  G.floor = ri + 1;
  G.currentNodeType = type;
  if(type==='combat'||type==='elite'||type==='boss') startCombat(type, ri);
  else if(type==='rest') showRestScreen();
  else if(type==='shop') openShop();
  else if(type==='event') openEvent();
}
