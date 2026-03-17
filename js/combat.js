// ═══════════════════════════════════════════════════════════════
// combat.js  —  Combat engine
// ═══════════════════════════════════════════════════════════════

function pickEnemyGroup(type, ri) {
  if(type==='boss') {
    const base = ri<=4?BOSSES[0]:ri<=9?BOSSES[1]:ri<=13?BOSSES[2]:BOSSES[3];
    const e = JSON.parse(JSON.stringify(base));
    e.hpMax=e.hp;e.block=0;e.statuses={};e.actionIdx=0;e.pinned=0;e.marked=0;e.stunned=0;e.hasActed=false;
    return [e];
  }
  if(type==='elite') {
    const base = JSON.parse(JSON.stringify(pick(ELITES)));
    const scale = 1+ri*0.04;
    base.hp=Math.round(base.hp*scale);base.hpMax=base.hp;
    base.block=0;base.statuses={};base.actionIdx=0;base.pinned=0;base.marked=0;base.hasActed=false;
    return [base];
  }
  const ai = ri<5?0:ri<10?1:ri<14?2:3;
  if(Math.random()<0.65) {
    const groupPool = ENCOUNTER_GROUPS.filter(g => ri>=g.floors[0] && ri<=g.floors[1]);
    if(groupPool.length) {
      const grp = JSON.parse(JSON.stringify(pick(pick(groupPool).enemies)));
      const scale = 1+ri*0.04;
      return grp.map(e=>{e.hp=Math.round(e.hp*scale);e.hpMax=e.hp;e.block=0;e.statuses={};e.actionIdx=0;e.pinned=0;e.marked=0;e.stunned=0;e.hasActed=false;return e;});
    }
  }
  const base = JSON.parse(JSON.stringify(pick(ENEMY_POOLS[ai]||ENEMY_POOLS[2])));
  const scale = 1+ri*0.045;
  base.hp=Math.round(base.hp*scale);base.hpMax=base.hp;
  base.block=0;base.statuses={};base.actionIdx=0;base.pinned=0;base.marked=0;base.hasActed=false;
  return [base];
}

function renderCombatTitle(badgeLabel) {
  const el = document.getElementById('combat-title');
  if(!el) return;
  el.innerHTML = '';
  if(badgeLabel) {
    const badge = document.createElement('span');
    badge.style.cssText='font-family:Cinzel,serif;font-size:.58rem;letter-spacing:.15em;color:var(--red2);border:1px solid var(--red2);padding:.1rem .35rem;border-radius:2px;flex-shrink:0;';
    badge.textContent = badgeLabel;
    el.appendChild(badge);
  }
  G.enemies.forEach(e => {
    const chip = document.createElement('span');
    chip.style.cssText='font-family:Cinzel,serif;font-size:.6rem;color:var(--text2);display:flex;align-items:center;gap:.2rem;';
    chip.innerHTML=`<span style="font-size:.9rem;line-height:1">${e.sprite||'👹'}</span><span>${e.name}</span>`;
    el.appendChild(chip);
    if(e!==G.enemies[G.enemies.length-1]){const dot=document.createElement('span');dot.style.cssText='color:var(--border);font-size:.7rem;';dot.textContent='·';el.appendChild(dot);}
  });
}

function startCombat(type, ri) {
  G.enemies = pickEnemyGroup(type, ri ?? G.floor-1);
  if(!G.enemies||!G.enemies.length){
    const fb=JSON.parse(JSON.stringify(ENEMY_POOLS[0][0]));
    fb.hpMax=fb.hp;fb.block=0;fb.statuses={};fb.actionIdx=0;fb.pinned=0;fb.marked=0;fb.hasActed=false;
    G.enemies=[fb];
  }
  G.targetIdx=0;G.round=0;G.powers={};G.combatActive=true;G.block=0;G.statuses={};
  G.energyMax=3;G.energy=3;G.focus=0;
  G.drawPile=shuffle([...G.deck]);
  G.hand=[];G.discardPile=[];G.exhaustPile=[];
  G._extraStartDraw=0;G._pendingTarget=null;
  applyRelicsOnCombatStart();
  const isBoss=G.enemies[0]&&G.enemies[0].isBoss;
  renderCombatTitle(isBoss?'⚠ BOSS':type==='elite'?'★ ELITE':null);
  document.getElementById('c-floor').textContent='Section '+G.floor;
  showScreen('combat-screen');
  renderRelics('combat-relics-bar');
  renderCombatUI();
  if(document.getElementById('relicPanelDrawer')?.classList.contains('open')) renderRelicPanel();
  startPlayerTurn();
}

function liveEnemies(){return G.enemies.filter(e=>e.hp>0);}
function getTarget(){return G.enemies[G.targetIdx]||liveEnemies()[0];}

function startPlayerTurn(){
  G.round++;
  G.block=0;G.energy=G.energyMax;G._pathfinderUsed=false;
  if(G.powers.metallicize) gainBlock(G.powers.metallicize,'player');
  applyRelicsOnTurnStart();
  if(G.discipline==='healing'&&G.round>1){G.hp=Math.min(G.hpMax,G.hp+1);}
  const extraDraw=(G.round===1&&G._extraStartDraw)?G._extraStartDraw:0;
  drawCards(5+extraDraw);
  clearTargetingMode();
  renderCombatUI();
  addLog('─ Round '+G.round+' ─');
  document.getElementById('end-turn-btn').disabled=false;
}

function drawCards(n){
  for(let i=0;i<n;i++){
    if(G.hand.length>=10) break;
    if(!G.drawPile.length){
      if(!G.discardPile.length) break;
      G.drawPile=shuffle([...G.discardPile]);G.discardPile=[];
      addLog('Reshuffled discard.');
    }
    G.hand.push(G.drawPile.pop());
    if(G.combatActive){
      G._cardsDrawnThisTurn=(G._cardsDrawnThisTurn||0)+1;
      if(hasRelic('beast_covenant')){G.block+=2;}
      if(hasRelic('flint_pouch')&&G._cardsDrawnThisTurn>5){G.block+=1;addLog('Flint Pouch: +1 Block.');}
    }
  }
}

function renderCombatUI(){
  document.getElementById('c-hp').textContent=G.hp+'/'+G.hpMax;
  document.getElementById('draw-count').textContent=G.drawPile.length;
  document.getElementById('disc-count').textContent=G.discardPile.length;
  const orbs=document.getElementById('manaOrbs');orbs.innerHTML='';
  for(let i=0;i<G.energyMax;i++){const o=document.createElement('div');o.className='mana-orb'+(i<G.energy?' filled':'');orbs.appendChild(o);}
  const fb=document.getElementById('focus-bar');const fc=document.getElementById('focus-count');
  if(G.focus>0){fb.style.display='flex';fc.textContent=G.focus;}else fb.style.display='none';
  document.getElementById('player-hp-fill').style.width=Math.max(0,G.hp/G.hpMax*100)+'%';
  document.getElementById('player-hp-text').textContent=G.hp+' / '+G.hpMax;
  const pb=document.getElementById('player-block');
  if(G.block>0){pb.style.display='flex';pb.textContent=G.block;}else pb.style.display='none';
  renderStatuses('player-statuses',G.statuses,true);
  renderEnemies();renderTargetBar();renderHand();
}

function renderEnemies(){
  const side=document.getElementById('enemiesSide');
  side.innerHTML='';
  side.classList.toggle('crowded',G.enemies.length>=3);
  G.enemies.forEach((e,i)=>{
    const card=document.createElement('div');
    card.className='enemy-card'+(e.hp<=0?' dead':'')+(i===G.targetIdx&&e.hp>0?' targeted':'');
    card.dataset.idx=i;
    const a=e.actions[e.actionIdx%e.actions.length];
    const icons={attack:'⚔️',block:'🛡️',debuff:'💀'};
    const intentEl=document.createElement('div');
    intentEl.className='intent-display';
    intentEl.style.cssText='position:static;transform:none;margin-bottom:2px;font-size:.6rem;padding:.2rem .5rem;';
    if(e.pinned>0) intentEl.innerHTML=`<span>⛓️</span><span style="color:#888">Pinned (${e.pinned})</span>`;
    else if(e.stunned>0) intentEl.innerHTML=`<span>😵</span><span style="color:#888">Stunned</span>`;
    else if(hasRelic('sense_ward')||e.hasActed) intentEl.innerHTML=`<span>${icons[a.type]||'❓'}</span><span class="intent-val" style="font-size:.6rem">${a.label}</span>`;
    else intentEl.innerHTML=`<span>👁️</span><span style="font-size:.6rem;color:var(--text2);font-style:italic">Sensing…</span>`;
    card.appendChild(intentEl);
    const sp=document.createElement('div');sp.className='entity-sprite';sp.id='enemy-sprite-'+i;sp.textContent=e.sprite;card.appendChild(sp);
    const nm=document.createElement('div');nm.className='entity-name';nm.style.fontSize='.58rem';nm.textContent=e.name;card.appendChild(nm);
    if(e.type){const tt=document.createElement('div');tt.style.cssText='font-size:.42rem;color:var(--text2);font-family:Cinzel,serif;letter-spacing:.08em;text-transform:uppercase;';tt.textContent='['+e.type+']';card.appendChild(tt);}
    const hpCon=document.createElement('div');hpCon.className='hp-bar-container';
    const pct=Math.max(0,e.hp/e.hpMax*100);
    hpCon.innerHTML=`<div class="hp-bar-track"><div class="hp-bar-fill enemy-fill" style="width:${pct}%"></div></div><div class="hp-text">${e.hp}/${e.hpMax}</div>`;
    if(e.block>0){const bb=document.createElement('div');bb.className='block-badge';bb.textContent=e.block;hpCon.appendChild(bb);}
    card.appendChild(hpCon);
    if(e.marked>0){const mk=document.createElement('div');mk.style.cssText='font-size:.5rem;color:#e0a020;font-family:Cinzel,serif;';mk.textContent='🔍 Marked';card.appendChild(mk);}
    const stEl=document.createElement('div');stEl.className='status-effects';renderStatusesInto(stEl,e.statuses,false);card.appendChild(stEl);
    if(e.hp>0){
      card.onclick=()=>{
        if(_targetingCardIdx!==null){const ci=_targetingCardIdx;G.targetIdx=i;_targetingCardIdx=null;playCard(ci,i);}
        else{G.targetIdx=i;renderCombatUI();}
      };
    }
    side.appendChild(card);
  });
}

function renderStatuses(elId,st,isPlayer){
  const el=document.getElementById(elId);el.innerHTML='';
  renderStatusesInto(el,st,isPlayer);
  if(isPlayer){
    for(const[k,v] of Object.entries(G.powers)){
      const p=document.createElement('div');
      p.className='status-pip '+(k==='metallicize'?'metallicize':'strength');
      p.textContent=k[0].toUpperCase()+k.slice(1)+' '+v;el.appendChild(p);
    }
    if(G.statuses.endure>0){
      const p=document.createElement('div');p.className='status-pip';p.style.borderColor='#5ab4f5';p.style.color='#5ab4f5';p.textContent='Endure '+G.statuses.endure;el.appendChild(p);
    }
  }
}
function renderStatusesInto(el,st,isPlayer){
  for(const[k,v] of Object.entries(st)){
    if(!v||v<=0) continue;
    const p=document.createElement('div');p.className='status-pip '+k;p.textContent=k[0].toUpperCase()+k.slice(1)+' '+v;el.appendChild(p);
  }
}

function renderHand(){
  const area=document.getElementById('handArea');area.innerHTML='';
  G.hand.forEach((id,i)=>{
    const def=getCard(id);
    const bladeCov=hasRelic('blade_covenant')&&G.focus>0&&def.type==='attack';
    const effectiveCost=bladeCov?Math.max(0,def.cost-1):def.cost;
    const ok=G.energy>=effectiveCost&&!def.effect.unplayable;
    const displayDef=bladeCov?{...def,cost:effectiveCost}:def;
    const el=buildCard(displayDef,ok);
    if(ok){
      el.onclick=()=>{
        if(cardNeedsTarget(def)) enterTargetingMode(i);
        else playCard(i,null);
      };
    }
    area.appendChild(el);
  });
}

function buildCard(def,canPlay=true){
  if(!def) def=ALL_CARDS[0];
  const eff=def.effect||{};
  const el=document.createElement('div');
  el.className=`card ${def.type}-type${canPlay?'':' unplayable'}`;
  const badges=[];
  if(eff.focusCost||eff.focusGain||eff.focusAllBonus) badges.push('<div class="focus-badge">✦ FOCUS ✦</div>');
  else if(eff.stalk) badges.push('<div class="stalk-badge">◈ STALK ◈</div>');
  else if(eff.dmgAll!==undefined||eff.dmgAll===0) badges.push('<div class="aoe-badge">◉ ALL ENEMIES ◉</div>');
  else if(def.type==='kai') badges.push('<div class="kai-badge">✦ KAI ✦</div>');
  el.innerHTML=`<div class="card-cost">${def.cost}</div><div class="card-type-tag">${def.type}</div><div class="card-art">${def.art}</div><div class="card-divider"></div><div class="card-name">${def.name}</div><div class="card-desc">${def.desc}</div>${badges.join('')}`;
  return el;
}

function cardNeedsTarget(def){
  const e=(def&&def.effect)?def.effect:{};
  if(e.unplayable) return false;
  if(e.dmgAll!==undefined||e.weakAll||e.vulnAll||e.markAll) return false;
  if(e.focusCost&&e.focusCost.dmgAll!==undefined) return false;
  return !!(e.dmg||e.psychicDmg||e.vuln||e.weak||e.pin||e.mark||e.stalk||e.loreUndead||e.loreBeast||e.loreDarklord||e.focusCost?.dmg);
}

let _targetingCardIdx=null;
function enterTargetingMode(cardIdx){_targetingCardIdx=cardIdx;renderTargetBar();renderEnemies();renderHand();}
function clearTargetingMode(){_targetingCardIdx=null;renderTargetBar();}
function renderTargetBar(){
  const bar=document.getElementById('targetBar');if(!bar) return;
  bar.innerHTML='';
  if(_targetingCardIdx!==null){
    const prompt=document.createElement('div');prompt.className='targeting-prompt';prompt.textContent='▶ CHOOSE TARGET ◀';
    const cancel=document.createElement('button');cancel.className='cancel-target-btn';cancel.textContent='✕ Cancel';
    cancel.onclick=()=>{clearTargetingMode();renderCombatUI();};
    bar.appendChild(prompt);bar.appendChild(cancel);
  }
}

function playCard(handIdx,targetOverride){
  const id=G.hand[handIdx];
  const def=getCard(id);
  if(G.energy<def.cost||def.effect.unplayable) return;
  const bladeCovDisc=hasRelic('blade_covenant')&&G.focus>0&&def.type==='attack'?1:0;
  if(bladeCovDisc){G.focus=Math.max(0,G.focus-1);addLog('Blade Covenant: Focus consumed.');}
  G.energy-=Math.max(0,def.cost-bladeCovDisc);
  G.hand.splice(handIdx,1);
  clearTargetingMode();
  const eff=def.effect;
  const target=(targetOverride!==null&&targetOverride!==undefined)?G.enemies[targetOverride]:getTarget();
  if(eff.focusCost){
    const fc=eff.focusCost;
    if(G.focus>=fc.amt){
      G.focus-=fc.amt;
      if(fc.dmg) dealDmgToEnemy(target,fc.dmg);
      if(fc.dmgAll!==undefined) dealDmgAll(fc.dmgAll);
      addLog(def.name+': Focus-powered!');
      G.discardPile.push(id);checkAllEnemiesDead();return;
    }else{addLog(def.name+': No Focus — weak version.');}
  }
  let focusBonus=0;
  if(eff.focusAllBonus&&G.focus>0){focusBonus=G.focus*eff.focusAllBonus;addLog('Spent '+G.focus+' Focus: +'+focusBonus+' bonus!');G.focus=0;}
  const useStalk=eff.stalk&&target&&!target.hasActed;
  let effToUse=useStalk?{...eff,...eff.stalk}:eff;
  if(useStalk){
    addLog('Stalk bonus!');
    if(hasRelic('predator_lens')&&eff.stalk.dmg!==undefined){
      const bonus=(eff.stalk.dmg-eff.dmg);
      effToUse={...effToUse,dmg:eff.stalk.dmg+bonus};addLog('Predator Lens: Stalk doubled!');
    }
  }
  if(effToUse.dmgAll!==undefined){const times=effToUse.times||1;for(let t=0;t<times;t++) dealDmgAll(effToUse.dmgAll);addLog(def.name+': '+effToUse.dmgAll*(effToUse.times||1)+' to all.');}
  if((effToUse.dmg>0)||effToUse.psychicDmg){
    const str=G.powers.strength||0;
    const relicStr=(hasRelic('kai_talisman')?2:0)+(hasRelic('whetstone')&&!G._whetstone_used?3:0);
    if(hasRelic('whetstone')&&!G._whetstone_used){G._whetstone_used=true;}
    const vuln=target&&target.statuses.vulnerable>0?1.5:1;
    let total=0;
    if(effToUse.dmg>0){
      const times=effToUse.times||1;
      for(let t=0;t<times;t++){
        let d=Math.floor((effToUse.dmg+str+relicStr+focusBonus)*vuln);
        if(eff.loreDarklord&&target&&target.type==='darklord') d=Math.floor((eff.loreDarklord.dmg+str+relicStr)*vuln);
        if(eff.loreBeast&&target&&target.type==='beast') d=Math.floor((eff.loreBeast.dmg+str+relicStr)*vuln);
        if(hasRelic('sommerswerd_shard')&&target){if(target.type==='darklord') d+=4;if(target.type==='undead') d+=6;}
        if(target) dealDmgToEnemy(target,d);
        total+=d;focusBonus=0;
      }
      addLog(def.name+': '+total+' dmg.');
    }
    if(effToUse.psychicDmg){
      const pBonus=hasRelic('iron_grimoire')?4:0;
      let pd=effToUse.psychicDmg+pBonus;
      if(eff.loreUndead&&target&&target.type==='undead') pd=eff.loreUndead.psychicDmg+pBonus;
      if(target){target.hp=Math.max(0,target.hp-pd);floatNum(pd,target,'#a855f7');}
      addLog('Psychic: '+pd+' dmg (ignores Block).');
    }
    animateAttack('player-sprite');
  }
  if(effToUse.block) gainBlock(effToUse.block,'player');
  if(eff.blockPerEnemy){const bpe=liveEnemies().length*eff.blockPerEnemy;gainBlock(bpe,'player');}
  if(eff.draw) drawCards(eff.draw);
  if(eff.energy){G.energy+=eff.energy;addLog('+'+eff.energy+' Energy.');}
  if(eff.heal){const healed=applyRelicsOnHeal(eff.heal);G.hp=Math.min(G.hpMax,G.hp+healed);addLog('Healed '+healed+' HP.');}
  if(eff.selfDmg){G.hp=Math.max(0,G.hp-eff.selfDmg);addLog('Lost '+eff.selfDmg+' HP.');}
  if(effToUse.vuln&&target){target.statuses.vulnerable=(target.statuses.vulnerable||0)+effToUse.vuln;addLog(target.name+' Vulnerable +'+effToUse.vuln);}
  if(effToUse.weak&&target){target.statuses.weak=(target.statuses.weak||0)+effToUse.weak;addLog(target.name+' Weakened +'+effToUse.weak);}
  if(eff.weakAll){liveEnemies().forEach(e=>{e.statuses.weak=(e.statuses.weak||0)+eff.weakAll;});addLog('All enemies Weakened.');}
  if(eff.vulnAll){liveEnemies().forEach(e=>{e.statuses.vulnerable=(e.statuses.vulnerable||0)+eff.vulnAll;});addLog('All enemies Vulnerable.');}
  if(effToUse.pin&&target){target.pinned=(target.pinned||0)+effToUse.pin;addLog(target.name+' Pinned '+effToUse.pin+'.');}
  if(effToUse.mark&&target){target.marked=(target.marked||0)+effToUse.mark;addLog(target.name+' Marked.');}
  if(eff.markAll){liveEnemies().forEach(e=>{e.marked=(e.marked||0)+1;});addLog('All enemies Marked.');}
  if(eff.focusGain){G.focus+=eff.focusGain;addLog('Focus +'+eff.focusGain+' → '+G.focus+'.');if(hasRelic('pathfinder_stone')&&!G._pathfinderUsed){G._pathfinderUsed=true;drawCards(1);addLog('Pathfinder Stone: drew 1.');}}
  if(eff.endure){G.statuses.endure=(G.statuses.endure||0)+eff.endure;addLog('Endure +'+eff.endure+'.');}
  if(eff.power){
    if(eff.power==='strength'){G.powers.strength=(G.powers.strength||0)+eff.val;addLog('Strength +'+eff.val+'.');}
    if(eff.power==='metallicize'){G.powers.metallicize=(G.powers.metallicize||0)+eff.val;addLog('Fortitude: gain '+eff.val+' Block/turn.');}
    if(eff.power==='predator'){G.powers.predator=(G.powers.predator||0)+eff.val;addLog('Predator: draw 2 on kill.');}
    if(eff.power==='ironhide'){G.powers.ironhide=(G.powers.ironhide||0)+eff.val;addLog('Iron Hide: -'+eff.val+' dmg.');}
    if(eff.power==='bloodfever'){G.powers.bloodfever=(G.powers.bloodfever||0)+eff.val;addLog('Blood Fever active.');}
  }
  if(eff.exhaust&&G.hand.length>0){G.exhaustPile.push(G.hand.splice(rand(0,G.hand.length-1),1)[0]);}
  if(eff.exhaustSelf){G.exhaustPile.push(id);checkAllEnemiesDead();return;}
  if(eff.addWound){for(let w=0;w<eff.addWound;w++) G.discardPile.push('curse_card');addLog('Curse added to discard.');}
  if(eff.upgradeRandom) upgradeRandomCardInDeck();
  if(eff.cycleDraw){G.discardPile.push(...G.hand);G.hand=[];drawCards(eff.cycleDraw);addLog('Cycled hand, drew '+eff.cycleDraw+'.');}
  if(eff.wolf_fang&&target){target.statuses.weak=(target.statuses.weak||0)+(eff.weak||2);}
  G.discardPile.push(id);
  if(def.type==='skill'&&hasRelic('blood_vial')){G.hp=Math.min(G.hpMax,G.hp+2);addLog('Blood Vial: +2 HP.');}
  checkAllEnemiesDead();
}

function dealDmgAll(baseDmg){
  const str=G.powers.strength||0;const relicStr=hasRelic('kai_talisman')?2:0;
  liveEnemies().forEach(e=>{const vuln=e.statuses.vulnerable>0?1.5:1;const d=Math.floor((baseDmg+str+relicStr)*vuln);dealDmgToEnemy(e,d);});
}
function dealDmgToEnemy(enemy,dmg){
  let d=dmg;
  if(hasRelic('hunters_brand')&&enemy.marked>0) d+=3;
  if(enemy.marked>0){enemy.marked=Math.max(0,enemy.marked-1);addLog('Mark: ignored '+enemy.name+"'s block!");}
  else{if(enemy.block>=d){enemy.block-=d;d=0;}else{d-=enemy.block;enemy.block=0;}}
  enemy.hp=Math.max(0,enemy.hp-d);
  floatNum(d,enemy,'#c0392b');
}
function dealDmgPlayer(dmg){
  let d=dmg;
  if(G.statuses.vulnerable>0) d=Math.floor(d*1.5);
  if(hasRelic('darklord_shard')) d=Math.max(1,d-1);
  if(hasRelic('spirit_cloak')&&G.hp<G.hpMax/2) d=Math.max(0,d-2);
  if(G.powers.ironhide) d=Math.max(0,d-G.powers.ironhide);
  if(G.statuses.endure>0){d=Math.max(0,d-5);G.statuses.endure--;addLog('Endure absorbed! ('+G.statuses.endure+' left)');}
  if(G.block>=d){G.block-=d;d=0;}else{d-=G.block;G.block=0;}
  G.hp=Math.max(0,G.hp-d);
  floatNum(d,null,'#c0392b');
  if(d>0){const ps=document.getElementById('player-sprite');ps.classList.add('shake');setTimeout(()=>ps.classList.remove('shake'),500);}
  checkVordakEssence();
}
function gainBlock(amt,target){
  if(target==='player'){const actual=applyRelicsOnBlock(amt);G.block+=actual;addLog('Gained '+actual+' Block.');}
  else{target.block=(target.block||0)+amt;}
}
function animateAttack(spriteId){
  const el=document.getElementById(spriteId);if(!el) return;
  el.classList.add('attack-anim');setTimeout(()=>el.classList.remove('attack-anim'),500);
}
function floatNum(val,enemyObj,color){
  if(!val&&val!==0) return;
  const field=document.querySelector('.combat-arena');if(!field) return;
  const rect=field.getBoundingClientRect();
  let srEl;
  if(enemyObj){const idx=G.enemies.indexOf(enemyObj);srEl=document.getElementById('enemy-sprite-'+idx);}
  else srEl=document.getElementById('player-sprite');
  if(!srEl) return;
  const sr=srEl.getBoundingClientRect();
  const el=document.createElement('div');el.className='dmg-float';el.style.color=color;
  el.style.left=(sr.left-rect.left+sr.width/2-15)+'px';
  el.style.top=(sr.top-rect.top+10)+'px';
  el.textContent=val>0?'-'+val:'+'+Math.abs(val);
  field.style.position='relative';
  field.appendChild(el);
  setTimeout(()=>el.remove(),1200);
}
function floatNumGold(val){
  const field=document.querySelector('.combat-arena');if(!field) return;
  const srEl=document.getElementById('player-sprite');if(!srEl) return;
  const rect=field.getBoundingClientRect();const sr=srEl.getBoundingClientRect();
  const el=document.createElement('div');el.className='dmg-float';el.style.color='#ddb84a';
  el.style.left=(sr.left-rect.left+sr.width/2-15)+'px';el.style.top=(sr.top-rect.top-10)+'px';
  el.textContent='+'+val+'💰';field.style.position='relative';field.appendChild(el);
  setTimeout(()=>el.remove(),1400);
}
function addLog(msg){
  const log=document.getElementById('turnLog');if(!log) return;
  const e=document.createElement('div');e.className='log-entry';e.textContent=msg;
  log.appendChild(e);
  while(log.children.length>40) log.removeChild(log.firstChild);
  log.scrollTop=log.scrollHeight;
}

function checkAllEnemiesDead(){
  if(G.hp<=0){playerDied();return;}
  const dead=G.enemies.filter(e=>e.hp<=0&&!e._killedProcessed);
  dead.forEach(e=>{
    e._killedProcessed=true;G.kills++;addLog(e.name+' defeated!');
    if(G.powers.predator){drawCards(2);addLog('Predator: drew 2!');}
    if(G.powers.bloodfever){G.powers.strength=(G.powers.strength||0)+G.powers.bloodfever;addLog('Blood Fever: +'+G.powers.bloodfever+' Str!');}
    if(hasRelic('battle_salve')){G.hp=Math.min(G.hpMax,G.hp+4);addLog('Battle Salve: +4 HP.');}
    if(hasRelic('giak_coin')){G.gold+=10;addLog('Giak Coin: +10 gold.');}
    if(hasRelic('kai_compass')){G.gold+=15;}
    if(e.type==='humanoid'){const loot=rand(3,12);G.gold+=loot;addLog('Looted '+loot+' gold!');floatNumGold(loot);}
  });
  if(G.enemies[G.targetIdx]&&G.enemies[G.targetIdx].hp<=0){
    const live=liveEnemies();G.targetIdx=live.length?G.enemies.indexOf(live[0]):0;
  }
  if(liveEnemies().length===0){
    G.combatActive=false;G.energyMax=3;
    const isBoss=G.enemies[0]&&G.enemies[0].isBoss;
    const isLastSection=G.storyMode&&G.floor>=BOOKS[G.bookIdx].sections.length-1;
    if(isBoss&&(G.floor===17||isLastSection)){
      G.hp=G.hpMax;
      if(G.storyMode){setTimeout(()=>showBookVictory(),1200);}
      else{setTimeout(()=>{document.getElementById('win-kills').textContent=G.kills;document.getElementById('win-cards').textContent=G.deck.length;showScreen('win-screen');},1200);}
      return;
    }
    if(isBoss){G.hp=G.hpMax;addLog('✦ BOSS DEFEATED — Full HP Restored! ✦');setTimeout(()=>showItemReward('boss','Boss defeated! HP fully restored. Claim a powerful item.',()=>showReward()),800);return;}
    if(G.currentNodeType==='elite'){setTimeout(()=>showItemReward('elite','Elite enemy defeated. Claim a special item.',()=>showReward()),800);return;}
    setTimeout(showReward,800);return;
  }
  renderCombatUI();
}

function endTurn(){
  document.getElementById('end-turn-btn').disabled=true;
  clearTargetingMode();
  G.discardPile.push(...G.hand);G.hand=[];
  for(const k in G.statuses){if(k!=='endure'&&G.statuses[k]>0) G.statuses[k]--;}
  G.enemies.forEach(e=>{
    if(e.hp<=0) return;
    for(const k in e.statuses) if(e.statuses[k]>0) e.statuses[k]--;
    if((e.statuses.poison||0)>0){e.hp=Math.max(0,e.hp-e.statuses.poison);addLog('Poison: '+e.name+' -'+e.statuses.poison+' HP.');e.statuses.poison=Math.max(0,e.statuses.poison-1);}
  });
  setTimeout(()=>{
    G.enemies.forEach(e=>{e.hasActed=false;});
    const alive=liveEnemies();let delay=0;
    alive.forEach(e=>{
      setTimeout(()=>{
        if(e.hp<=0) return;
        const sprEl=document.getElementById('enemy-sprite-'+G.enemies.indexOf(e));
        if(sprEl){sprEl.classList.add('attack-anim');setTimeout(()=>sprEl.classList.remove('attack-anim'),500);}
        e.block=0;
        if(e.stunned>0){e.stunned--;addLog(e.name+' is Stunned — skips action!');}
        else if(e.pinned>0){e.pinned--;addLog(e.name+' is Pinned — skips action.');}
        else{enemyAct(e);}
        e.actionIdx++;e.hasActed=true;
        if(G.hp<=0){playerDied();return;}
        renderCombatUI();
      },delay);
      delay+=350;
    });
    setTimeout(()=>{if(G.hp>0){checkAllEnemiesDead();if(liveEnemies().length>0) setTimeout(startPlayerTurn,200);}},delay+100);
  },400);
}

const DEBUFFS={
  'Weaken':    g=>{if(hasRelic('iron_mind')){addLog('Iron Mind blocked!');return;}g.statuses=g.statuses||{};g.statuses.weak=(g.statuses.weak||0)+2;addLog('Weakened 2.');},
  'Fear':      g=>{if(hasRelic('iron_mind')){addLog('Iron Mind blocked!');return;}g.statuses.weak=(g.statuses.weak||0)+1;addLog('Fear! Weakened 1.');},
  'Curse':     g=>{if(hasRelic('iron_mind')){addLog('Iron Mind blocked!');return;}g.discardPile.push('curse_card');addLog('Curse added.');},
  'Hex':       g=>{g.discardPile.push('curse_card');addLog('Hex! Curse added.');},
  'Venom':     g=>{if(hasRelic('iron_mind')){addLog('Iron Mind blocked!');return;}g.statuses.poison=(g.statuses.poison||0)+3;addLog('Poisoned 3!');},
  'Poison':    g=>{if(hasRelic('iron_mind')){addLog('Iron Mind blocked!');return;}g.statuses.poison=(g.statuses.poison||0)+3;addLog('Poisoned 3!');},
  'Vulnerable':g=>{if(hasRelic('mind_fortress')){addLog('Mind Fortress blocked!');return;}g.statuses.vulnerable=(g.statuses.vulnerable||0)+2;addLog('Vulnerable 2!');},
  'Darken':    g=>{if(hasRelic('mind_fortress')){addLog('Mind Fortress blocked!');return;}g.statuses.vulnerable=(g.statuses.vulnerable||0)+2;addLog('Darkened.');},
  'Intimidate':g=>{if(hasRelic('iron_mind')){addLog('Iron Mind blocked!');return;}g.statuses.weak=(g.statuses.weak||0)+1;addLog('Intimidated!');},
  "Darklord's Curse":g=>{g.statuses.weak=(g.statuses.weak||0)+2;g.discardPile.push('curse_card');addLog("Darklord's Curse: Weak 2 + Curse.");},
  'Soul Curse':g=>{if(hasRelic('mind_fortress')){addLog('Mind Fortress blocked!');return;}g.statuses.vulnerable=(g.statuses.vulnerable||0)+3;addLog('Soul Curse: Vulnerable 3.');},
  'Disorder':  g=>{g.discardPile.push('curse_card');addLog('Disorder: Curse added.');},
  'Aim':       g=>{g.statuses.vulnerable=(g.statuses.vulnerable||0)+1;addLog('Aimed — Vulnerable 1.');},
  'Pinpoint':  g=>{g.statuses.vulnerable=(g.statuses.vulnerable||0)+1;addLog('Pinned — Vulnerable 1.');},
};

function enemyAct(e){
  const a=e.actions[e.actionIdx%e.actions.length];
  if(a.type==='attack'){let dmg=a.val;if(e.statuses.weak>0) dmg=Math.floor(dmg*0.75);dealDmgPlayer(dmg);addLog(e.name+': '+a.label);}
  else if(a.type==='block'){gainBlock(a.val,e);addLog(e.name+': '+a.label);}
  else if(a.type==='debuff'){const fn=DEBUFFS[a.key||a.label]||DEBUFFS['Weaken'];fn(G);addLog(e.name+': '+a.label);}
}

function playerDied(){
  G.combatActive=false;
  if(G.storyMode){storyPlayerDied();return;}
  document.getElementById('go-story-restart-btn').style.display='none';
  document.getElementById('go-restart-btn').style.display='inline-block';
  document.getElementById('go-floor').textContent=G.floor;
  document.getElementById('go-kills').textContent=G.kills;
  document.getElementById('go-cards').textContent=G.deck.length;
  const msgs=['The wolf falls silent in the night.','The Darklords claim another soul.','Sommerlund awaits a hero who never came.','The Kai Order ends with you.','Darkness swallows the path.'];
  document.getElementById('go-msg').textContent=pick(msgs);
  showScreen('gameover-screen');
}
