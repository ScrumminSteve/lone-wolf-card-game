// ═══════════════════════════════════════════════════
// data.js  —  All static game data
// ═══════════════════════════════════════════════════

// ── Supabase config ──────────────────────────────────────────
// Anon keys are intentionally public — security is enforced by
// Row Level Security (RLS) policies on the Supabase side.
const SB_URL = 'https://daorgvbbgnemwjcmqvtw.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhb3JndmJiZ25lbXdqY21xdnR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mjk2NjIsImV4cCI6MjA4ODQwNTY2Mn0.AiW-atLunf3ySJTkziT_06F3OFibgw9BKu70NrRTGR8';

// ── Fog of war state ─────────────────────────────────────────
let fogMode = true;

// ── Node display info ────────────────────────────────────────
const NODE_INFO = {
  combat:{e:'⚔️',l:'Skirmish'}, elite:{e:'💀',l:'Warband'},
  rest:{e:'🔥',l:'Refuge'},    shop:{e:'💰',l:'Peddler'},
  event:{e:'📜',l:'Encounter'},boss:{e:'👁️',l:'DARKNESS'},
};

// ── Free-play map layout ─────────────────────────────────────
const MAP = [
  ['combat','combat','event'],
  ['combat','rest','combat'],
  ['event','combat','combat'],
  ['combat','shop','combat'],
  ['boss'],
  ['combat','combat','rest'],
  ['elite','combat','combat'],
  ['rest','event','combat'],
  ['combat','shop','elite'],
  ['boss'],
  ['combat','rest','combat'],
  ['elite','combat','shop'],
  ['combat','event','combat'],
  ['boss'],
  ['combat','elite','combat'],
  ['rest','combat','shop'],
  ['boss'],
];
const ACT_STARTS = [0,5,10,14];
const ACT_NAMES  = ['I: The Wildlands','II: The Darklands','III: Darklord\'s Domain','IV: Gates of Helgedad'];


// ── Card definitions ─────────────────────────────────────────
const ALL_CARDS = [
  // STARTER
  {id:'lw_strike',  name:'Kai Strike',    type:'attack',  cost:1,art:'⚔️',desc:'Deal 6 dmg.',                                        effect:{dmg:6}},
  {id:'lw_strike+', name:'Kai Strike+',   type:'attack',  cost:1,art:'⚔️',desc:'Deal 9 dmg.',                                        effect:{dmg:9}},
  {id:'lw_defend',  name:'Iron Will',     type:'skill',   cost:1,art:'🛡️',desc:'Gain 5 Block.',                                       effect:{block:5}},
  {id:'lw_defend+', name:'Iron Will+',    type:'skill',   cost:1,art:'🛡️',desc:'Gain 8 Block.',                                       effect:{block:8}},
  // ATTACKS
  {id:'broadsword',   name:'Broadsword',      type:'attack',cost:1,art:'🗡️',desc:'Deal 10 dmg.',                                     effect:{dmg:10}},
  {id:'broadsword+',  name:'Broadsword+',     type:'attack',cost:1,art:'🗡️',desc:'Deal 14 dmg.',                                     effect:{dmg:14}},
  {id:'axe_blow',     name:'Axe Blow',        type:'attack',cost:2,art:'🪓',desc:'Deal 16 dmg.',                                      effect:{dmg:16}},
  {id:'axe_blow+',    name:'Axe Blow+',       type:'attack',cost:2,art:'🪓',desc:'Deal 22 dmg.',                                      effect:{dmg:22}},
  {id:'shadow_step',  name:'Shadow Step',     type:'attack',cost:1,art:'🌑',desc:'Deal 8 dmg. Gain 3 Block.',                         effect:{dmg:8,block:3}},
  {id:'shadow_step+', name:'Shadow Step+',    type:'attack',cost:1,art:'🌑',desc:'Deal 12 dmg. Gain 5 Block.',                        effect:{dmg:12,block:5}},
  {id:'wolf_fang',    name:"Wolf's Fang",     type:'attack',cost:1,art:'🐺',desc:'Deal 7 dmg. Apply 2 Weak to target.',               effect:{dmg:7,weak:2}},
  {id:'wolf_fang+',   name:"Wolf's Fang+",    type:'attack',cost:1,art:'🐺',desc:'Deal 10 dmg. Apply 3 Weak.',                        effect:{dmg:10,weak:3}},
  {id:'iron_wave',    name:'Shield Surge',    type:'attack',cost:1,art:'🌊',desc:'Deal 6 dmg. Gain 6 Block.',                         effect:{dmg:6,block:6}},
  {id:'iron_wave+',   name:'Shield Surge+',   type:'attack',cost:1,art:'🌊',desc:'Deal 9 dmg. Gain 9 Block.',                         effect:{dmg:9,block:9}},
  {id:'berserker',    name:'Kai Fury',         type:'attack',cost:1,art:'😤',desc:'Deal 15 dmg. Lose 4 HP.',                          effect:{dmg:15,selfDmg:4}},
  {id:'berserker+',   name:'Kai Fury+',        type:'attack',cost:1,art:'😤',desc:'Deal 20 dmg. Lose 3 HP.',                          effect:{dmg:20,selfDmg:3}},
  {id:'warhammer',    name:'Warhammer',        type:'attack',cost:2,art:'🔨',desc:'Deal 11 dmg. Apply 2 Vulnerable.',                 effect:{dmg:11,vuln:2}},
  {id:'warhammer+',   name:'Warhammer+',       type:'attack',cost:2,art:'🔨',desc:'Deal 15 dmg. Apply 3 Vulnerable.',                 effect:{dmg:15,vuln:3}},
  {id:'savage_blow',  name:'Giak Assault',     type:'attack',cost:2,art:'💥',desc:'Deal 6 dmg three times.',                          effect:{dmg:6,times:3}},
  {id:'savage_blow+', name:'Giak Assault+',    type:'attack',cost:2,art:'💥',desc:'Deal 9 dmg three times.',                          effect:{dmg:9,times:3}},
  {id:'dagger',       name:'Dagger Strike',    type:'attack',cost:0,art:'🔪',desc:'Deal 5 dmg.',                                      effect:{dmg:5}},
  {id:'dagger+',      name:'Dagger Strike+',   type:'attack',cost:0,art:'🔪',desc:'Deal 8 dmg.',                                      effect:{dmg:8}},
  {id:'kai_surge',    name:'Kai Surge',        type:'attack',cost:2,art:'⚡',desc:'Deal 14 dmg. Draw 2.',                             effect:{dmg:14,draw:2}},
  {id:'kai_surge+',   name:'Kai Surge+',       type:'attack',cost:2,art:'⚡',desc:'Deal 18 dmg. Draw 2.',                             effect:{dmg:18,draw:2}},
  {id:'darksword',    name:'Black Sword',      type:'attack',cost:1,art:'🖤',desc:'Deal 11 dmg. Add a Curse to enemy discard.',       effect:{dmg:11,addWound:1}},
  {id:'spear_thrust', name:'Spear Thrust',     type:'attack',cost:1,art:'🔱',desc:'Deal 8 dmg. Apply 1 Vulnerable.',                  effect:{dmg:8,vuln:1}},
  {id:'spear_thrust+',name:'Spear Thrust+',    type:'attack',cost:1,art:'🔱',desc:'Deal 11 dmg. Apply 2 Vulnerable.',                 effect:{dmg:11,vuln:2}},
  // STALK
  {id:'first_strike', name:'First Strike',     type:'attack',cost:1,art:'🏹',desc:'Deal 8 dmg. Stalk: deal 14 instead.',              effect:{dmg:8,stalk:{dmg:14}}},
  {id:'first_strike+',name:'First Strike+',    type:'attack',cost:1,art:'🏹',desc:'Deal 10 dmg. Stalk: deal 18 instead.',             effect:{dmg:10,stalk:{dmg:18}}},
  {id:'ambush',       name:'Ambush',           type:'attack',cost:2,art:'🌿',desc:'Deal 12 dmg. Stalk: deal 22 + gain 8 Block.',      effect:{dmg:12,stalk:{dmg:22,block:8}}},
  {id:'ambush+',      name:'Ambush+',          type:'attack',cost:1,art:'🌿',desc:'Deal 14 dmg. Stalk: deal 26 + gain 8 Block.',      effect:{dmg:14,stalk:{dmg:26,block:8}}},
  {id:'hunting_shot', name:'Hunting Shot',     type:'attack',cost:1,art:'🎯',desc:'Deal 7 dmg. Stalk: also apply 3 Vulnerable.',      effect:{dmg:7,stalk:{dmg:7,vuln:3}}},
  {id:'hunting_shot+',name:'Hunting Shot+',    type:'attack',cost:1,art:'🎯',desc:'Deal 10 dmg. Stalk: also apply 3 Vulnerable.',     effect:{dmg:10,stalk:{dmg:10,vuln:3}}},
  // AOE
  {id:'war_shout',    name:'Battlecry',        type:'attack',cost:2,art:'📯',desc:'Deal 7 dmg to ALL enemies.',                       effect:{dmgAll:7}},
  {id:'war_shout+',   name:'Battlecry+',       type:'attack',cost:2,art:'📯',desc:'Deal 10 dmg to ALL enemies.',                      effect:{dmgAll:10}},
  {id:'kai_blast',    name:'Kai Psifire',       type:'attack',cost:2,art:'💫',desc:'Deal 8 dmg to ALL enemies. Apply 1 Weak to all.', effect:{dmgAll:8,weakAll:1}},
  {id:'kai_blast+',   name:'Kai Psifire+',      type:'attack',cost:2,art:'💫',desc:'Deal 12 dmg to ALL. Apply 1 Weak to all.',        effect:{dmgAll:12,weakAll:1}},
  {id:'whirlwind',    name:'Kai Tempest',       type:'attack',cost:3,art:'🌀',desc:'Deal 6 dmg to ALL enemies twice.',                 effect:{dmgAll:6,times:2}},
  {id:'storm_blade',  name:'Maelstrom Blade',   type:'attack',cost:2,art:'⛈️',desc:'Deal 5 dmg to ALL enemies. Draw 1.',              effect:{dmgAll:5,draw:1}},
  {id:'storm_blade+', name:'Maelstrom Blade+',  type:'attack',cost:2,art:'⛈️',desc:'Deal 8 dmg to ALL enemies. Draw 1.',              effect:{dmgAll:8,draw:1}},
  // PIN & MARK
  {id:'nerve_strike', name:'Nerve Strike',      type:'attack',cost:1,art:'✋',desc:'Deal 6 dmg. Pin: target skips next action.',      effect:{dmg:6,pin:1}},
  {id:'nerve_strike+',name:'Nerve Strike+',     type:'attack',cost:1,art:'✋',desc:'Deal 9 dmg. Pin: target skips next action.',      effect:{dmg:9,pin:1}},
  {id:'hamstring',    name:'Crippling Strike',  type:'attack',cost:2,art:'🦵',desc:'Deal 10 dmg. Pin target for 2 actions.',          effect:{dmg:10,pin:2}},
  {id:'hunters_mark', name:"Hunter's Mark",     type:'attack',cost:1,art:'🔍',desc:"Deal 5 dmg. Mark target — next hit ignores Block.",effect:{dmg:5,mark:1}},
  {id:'hunters_mark+',name:"Hunter's Mark+",    type:'attack',cost:0,art:'🔍',desc:"Deal 5 dmg. Mark target — next hit ignores Block.",effect:{dmg:5,mark:1}},
  // SKILLS
  {id:'evasion',      name:'Evasion',           type:'skill', cost:1,art:'💨',desc:'Gain 10 Block.',                                   effect:{block:10}},
  {id:'evasion+',     name:'Evasion+',          type:'skill', cost:1,art:'💨',desc:'Gain 15 Block.',                                   effect:{block:15}},
  {id:'forest_lore',  name:'Forest Lore',       type:'skill', cost:1,art:'🌲',desc:'Gain 7 Block. Draw 1.',                            effect:{block:7,draw:1}},
  {id:'forest_lore+', name:'Forest Lore+',      type:'skill', cost:1,art:'🌲',desc:'Gain 11 Block. Draw 1.',                           effect:{block:11,draw:1}},
  {id:'endurance',    name:'Endurance',         type:'skill', cost:0,art:'💪',desc:'Gain 3 Block.',                                    effect:{block:3}},
  {id:'endurance+',   name:'Endurance+',        type:'skill', cost:0,art:'💪',desc:'Gain 5 Block.',                                    effect:{block:5}},
  {id:'sixth_sense',  name:'Sixth Sense',       type:'skill', cost:1,art:'👁️',desc:'Draw 3 cards.',                                  effect:{draw:3}},
  {id:'sixth_sense+', name:'Sixth Sense+',      type:'skill', cost:0,art:'👁️',desc:'Draw 3 cards.',                                  effect:{draw:3}},
  {id:'meditation',   name:'Deep Meditation',   type:'skill', cost:1,art:'🧘',desc:'Exhaust 1 card. Gain 12 Block.',                  effect:{block:12,exhaust:1}},
  {id:'meditation+',  name:'Deep Meditation+',  type:'skill', cost:1,art:'🧘',desc:'Exhaust 1 card. Gain 18 Block.',                  effect:{block:18,exhaust:1}},
  {id:'camouflage',   name:'Camouflage',        type:'skill', cost:1,art:'🌿',desc:'Gain 8 Block. Exhaust.',                          effect:{block:8,exhaustSelf:true}},
  {id:'camouflage+',  name:'Camouflage+',       type:'skill', cost:0,art:'🌿',desc:'Gain 8 Block. Exhaust.',                          effect:{block:8,exhaustSelf:true}},
  {id:'tact_retreat', name:'Elude',             type:'skill', cost:1,art:'🔄',desc:'Discard hand. Draw 4.',                           effect:{cycleDraw:4}},
  {id:'tact_retreat+',name:'Tactical Retreat+', type:'skill', cost:0,art:'🔄',desc:'Discard hand. Draw 5.',                           effect:{cycleDraw:5}},
  {id:'war_cry',      name:'War Cry',           type:'skill', cost:0,art:'😤',desc:'Apply 2 Vulnerable to ALL enemies.',              effect:{vulnAll:2}},
  {id:'war_cry+',     name:'War Cry+',          type:'skill', cost:0,art:'😤',desc:'Apply 3 Vulnerable to ALL enemies.',              effect:{vulnAll:3}},
  {id:'bloodlust',    name:'Kai Bloodrage',     type:'skill', cost:0,art:'🩸',desc:'Lose 3 HP. Gain 2 Energy.',                      effect:{selfDmg:3,energy:2}},
  {id:'rally',        name:"Warrior's Heart",   type:'skill', cost:1,art:'🔆',desc:'Gain 5 Block. Draw 1. Upgrade a random card.',   effect:{block:5,draw:1,upgradeRandom:1}},
  {id:'kai_heal',     name:'Kai Healing',       type:'skill', cost:2,art:'✨',desc:'Heal 10 HP.',                                    effect:{heal:10}},
  {id:'kai_heal+',    name:'Kai Healing+',      type:'skill', cost:2,art:'✨',desc:'Heal 16 HP.',                                    effect:{heal:16}},
  // SURVIVAL
  {id:'field_dressing',name:'Kai Mending',      type:'survival',cost:1,art:'🩹',desc:'Heal 6 HP. Draw 1.',                           effect:{heal:6,draw:1}},
  {id:'field_dressing+',name:'Kai Mending+',    type:'survival',cost:1,art:'🩹',desc:'Heal 9 HP. Draw 2.',                           effect:{heal:9,draw:2}},
  {id:'pathfinding',  name:'Pathfinding',       type:'survival',cost:0,art:'🧭',desc:'Draw 2. Gain 1 Focus.',                        effect:{draw:2,focusGain:1}},
  {id:'pathfinding+', name:'Pathfinding+',      type:'survival',cost:0,art:'🧭',desc:'Draw 3. Gain 1 Focus.',                        effect:{draw:3,focusGain:1}},
  {id:'endure',       name:'Endure',            type:'survival',cost:1,art:'🪨',desc:'Endure 3: absorb next 3 hits reducing each by 5.',effect:{endure:3}},
  {id:'endure+',      name:'Endure+',           type:'survival',cost:1,art:'🪨',desc:'Endure 5: absorb next 5 hits reducing each by 5.',effect:{endure:5}},
  {id:'track_prey',   name:'Track Prey',        type:'survival',cost:1,art:'🐾',desc:'Mark ALL enemies. Gain 2 Focus.',               effect:{markAll:true,focusGain:2}},
  {id:'track_prey+',  name:'Track Prey+',       type:'survival',cost:0,art:'🐾',desc:'Mark ALL enemies. Gain 2 Focus.',               effect:{markAll:true,focusGain:2}},
  {id:'rally_cry',    name:'Last Stand',        type:'survival',cost:2,art:'🎺',desc:'Gain 12 Block. Apply 2 Weak to all enemies.',  effect:{block:12,weakAll:2}},
  {id:'battle_prep',  name:'Kai Readiness',     type:'survival',cost:1,art:'📋',desc:'Draw 2. Gain 2 Block per enemy alive.',        effect:{draw:2,blockPerEnemy:2}},
  {id:'rest_moment',  name:'Refuge',            type:'survival',cost:2,art:'🏕️',desc:'Heal 8 HP. Gain 6 Block.',                   effect:{heal:8,block:6}},
  {id:'rest_moment+', name:'Refuge+',           type:'survival',cost:2,art:'🏕️',desc:'Heal 12 HP. Gain 9 Block.',                  effect:{heal:12,block:9}},
  // POWERS
  {id:'kai_fort',     name:'Kai Fortitude',     type:'power',cost:1,art:'🏔️',desc:'Start each turn with 3 Block.',                 effect:{power:'metallicize',val:3}},
  {id:'kai_fort+',    name:'Kai Fortitude+',    type:'power',cost:1,art:'🏔️',desc:'Start each turn with 5 Block.',                 effect:{power:'metallicize',val:5}},
  {id:'kai_strength', name:'Kai Strength',      type:'power',cost:1,art:'🔥',desc:'Gain 2 Strength permanently.',                  effect:{power:'strength',val:2}},
  {id:'kai_strength+',name:'Kai Strength+',     type:'power',cost:1,art:'🔥',desc:'Gain 3 Strength permanently.',                  effect:{power:'strength',val:3}},
  {id:'battle_fury',  name:'Kai Wrath',         type:'power',cost:2,art:'😡',desc:'Gain 4 Strength permanently.',                  effect:{power:'strength',val:4}},
  {id:'battle_fury+', name:'Kai Wrath+',        type:'power',cost:2,art:'😡',desc:'Gain 5 Strength permanently.',                  effect:{power:'strength',val:5}},
  {id:'predator',     name:"Hunter's Instinct", type:'power',cost:2,art:'🐆',desc:'On kill: draw 2 cards.',                        effect:{power:'predator',val:1}},
  {id:'predator+',    name:"Hunter's Instinct+",type:'power',cost:1,art:'🐆',desc:'On kill: draw 2 cards.',                        effect:{power:'predator',val:1}},
  {id:'iron_hide',    name:'Kai Resilience',    type:'power',cost:1,art:'⚙️',desc:'Take 1 less dmg from all attacks.',             effect:{power:'ironhide',val:1}},
  {id:'iron_hide+',   name:'Kai Resilience+',   type:'power',cost:1,art:'⚙️',desc:'Take 2 less dmg from all attacks.',             effect:{power:'ironhide',val:2}},
  {id:'blood_fever',  name:'Kai Bloodlust',     type:'power',cost:0,art:'🩸',desc:'Gain 1 Strength each time you kill an enemy.',  effect:{power:'bloodfever',val:1}},
  // KAI / FOCUS
  {id:'mindblast',    name:'Mindblast',         type:'kai',  cost:1,art:'🧠',desc:'Deal 10 psychic dmg (ignores Block).',          effect:{psychicDmg:10}},
  {id:'mindblast+',   name:'Mindblast+',        type:'kai',  cost:1,art:'🧠',desc:'Deal 15 psychic dmg (ignores Block).',          effect:{psychicDmg:15}},
  {id:'animal_bond',  name:'Animal Bond',       type:'kai',  cost:1,art:'🦅',desc:'Draw 2. Gain 4 Block. Gain 1 Focus.',           effect:{draw:2,block:4,focusGain:1}},
  {id:'animal_bond+', name:'Animal Bond+',      type:'kai',  cost:1,art:'🦅',desc:'Draw 3. Gain 6 Block. Gain 1 Focus.',           effect:{draw:3,block:6,focusGain:1}},
  {id:'focus_strike', name:'Kai Focus Strike',  type:'kai',  cost:1,art:'🔵',desc:'Spend 1 Focus: deal 12 dmg. Otherwise: deal 4 dmg.',effect:{dmg:4,focusCost:{amt:1,dmg:12}}},
  {id:'focus_strike+',name:'Kai Focus Strike+', type:'kai',  cost:1,art:'🔵',desc:'Spend 1 Focus: deal 16 dmg. Otherwise: deal 6 dmg.',effect:{dmg:6,focusCost:{amt:1,dmg:16}}},
  {id:'focus_channel',name:'Inner Flame',       type:'kai',  cost:0,art:'🌀',desc:'Gain 3 Focus.',                                 effect:{focusGain:3}},
  {id:'focus_channel+',name:'Inner Flame+',     type:'kai',  cost:0,art:'🌀',desc:'Gain 4 Focus.',                                 effect:{focusGain:4}},
  {id:'kai_sight',    name:'Kai Sight',         type:'kai',  cost:1,art:'👁️',desc:'Spend 2 Focus: deal 12 dmg to ALL enemies.',   effect:{focusCost:{amt:2,dmgAll:12}}},
  {id:'kai_sight+',   name:'Kai Sight+',        type:'kai',  cost:1,art:'👁️',desc:'Spend 2 Focus: deal 16 dmg to ALL enemies.',   effect:{focusCost:{amt:2,dmgAll:16}}},
  {id:'kai_surge_p',  name:'Surge of Kai',      type:'kai',  cost:2,art:'🌟',desc:'Deal 10 dmg. Gain 10 Block.',                  effect:{dmg:10,block:10}},
  {id:'kai_surge_p+', name:'Surge of Kai+',     type:'kai',  cost:2,art:'🌟',desc:'Deal 14 dmg. Gain 14 Block.',                  effect:{dmg:14,block:14}},
  {id:'darklord_bane',name:"Darklord's Bane",   type:'kai',  cost:3,art:'☀️',desc:'Deal 30 dmg. Spend all Focus: +10 per Focus point.',effect:{dmg:30,focusAllBonus:10}},
  {id:'darklord_bane+',name:"Darklord's Bane+", type:'kai',  cost:2,art:'☀️',desc:'Deal 30 dmg. Spend all Focus: +10 per Focus point.',effect:{dmg:30,focusAllBonus:10}},
  {id:'wolf_spirit',  name:'Spirit of Wolf',    type:'kai',  cost:2,art:'🐺',desc:'Gain 3 Strength & 5 Block. Gain 2 Focus.',     effect:{power:'strength',val:3,block:5,focusGain:2}},
  {id:'wolf_spirit+', name:'Spirit of Wolf+',   type:'kai',  cost:1,art:'🐺',desc:'Gain 4 Strength & 7 Block. Gain 2 Focus.',     effect:{power:'strength',val:4,block:7,focusGain:2}},
  {id:'kai_mastery',  name:'Kai Mastery',       type:'kai',  cost:3,art:'⭐',desc:'Gain 5 Strength & 8 Block. Gain 5 Focus.',     effect:{power:'strength',val:5,block:8,focusGain:5}},
  // LORE
  {id:'spirit_ward',  name:'Spirit Ward',       type:'lore', cost:1,art:'🪬',desc:'Gain 8 Block. vs Undead: also deal 10 psychic dmg.',  effect:{block:8,loreUndead:{psychicDmg:10}}},
  {id:'spirit_ward+', name:'Spirit Ward+',      type:'lore', cost:1,art:'🪬',desc:'Gain 12 Block. vs Undead: also deal 14 psychic dmg.', effect:{block:12,loreUndead:{psychicDmg:14}}},
  {id:'beast_lore',   name:'Beast Lore',        type:'lore', cost:1,art:'🐗',desc:'Deal 8 dmg. vs Beast: deal 18 instead.',             effect:{dmg:8,loreBeast:{dmg:18}}},
  {id:'beast_lore+',  name:'Beast Lore+',       type:'lore', cost:1,art:'🐗',desc:'Deal 10 dmg. vs Beast: deal 24 instead.',            effect:{dmg:10,loreBeast:{dmg:24}}},
  {id:'dark_knowledge',name:'Dark Knowledge',   type:'lore', cost:2,art:'📚',desc:'Deal 14 dmg. vs Darklord: deal 25 + apply Vulnerable.',effect:{dmg:14,loreDarklord:{dmg:25,vuln:2}}},
  {id:'sommerswerd',  name:'Sommerswerd',       type:'lore', cost:3,art:'🌟',desc:'Deal 20 dmg. vs Darklord: deal 40 dmg instead.',     effect:{dmg:20,loreDarklord:{dmg:40}}},
  {id:'sommerswerd+', name:'Sommerswerd+',      type:'lore', cost:2,art:'🌟',desc:'Deal 22 dmg. vs Darklord: deal 45 dmg instead.',     effect:{dmg:22,loreDarklord:{dmg:45}}},
  {id:'banishment',   name:'Banishment',        type:'lore', cost:2,art:'✝️',desc:'Deal 12 psychic dmg. vs Undead: deal 22 instead.',   effect:{psychicDmg:12,loreUndead:{psychicDmg:22}}},
  {id:'banishment+',  name:'Banishment+',       type:'lore', cost:1,art:'✝️',desc:'Deal 14 psychic dmg. vs Undead: deal 28 instead.',   effect:{psychicDmg:14,loreUndead:{psychicDmg:28}}},
  // CURSES
  {id:'curse_card',   name:'Curse',             type:'attack',cost:0,art:'💀',desc:'Unplayable. Clogs your hand.',                      effect:{unplayable:true}},
  {id:'wound_card',   name:'Wound',             type:'attack',cost:0,art:'🩸',desc:'Unplayable. A festering injury.',                   effect:{unplayable:true}},
];

const CARD_POOL = ALL_CARDS.filter(c => !c.id.endsWith('+') && !['curse_card','wound_card','lw_strike','lw_defend'].includes(c.id));

function getCardPool() {
  const hasSommerswerd = PROGRESS.booksCompleted && PROGRESS.booksCompleted.includes(1);
  if(hasSommerswerd) return CARD_POOL;
  return CARD_POOL.filter(c => c.id !== 'sommerswerd');
}

// ── Relics ───────────────────────────────────────────────────
const ALL_RELICS = [
  // COMMON
  {id:'kai_talisman',  name:'Kai Talisman',   art:'🔮',rarity:'common',  desc:'All attacks deal +2 damage.',source:['elite','boss','shop','combat']},
  {id:'iron_grimoire', name:'Iron Grimoire',  art:'📕',rarity:'common',  desc:'Mindblast and psychic damage +4.',source:['elite','boss','event']},
  {id:'wolf_pelt',     name:'Wolf Pelt',      art:'🐺',rarity:'common',  desc:'Start each combat with 4 Block.',source:['combat','elite','shop']},
  {id:'healing_herb',  name:'Healing Herb',   art:'🌿',rarity:'common',  desc:'Heal 3 HP at the start of each combat.',source:['event','shop']},
  {id:'giak_skull',    name:'Giak Skull',     art:'💀',rarity:'common',  desc:'Gain +10 max HP.',source:['elite','boss','combat']},
  {id:'flint_pouch',   name:'Flint Pouch',    art:'🪨',rarity:'common',  desc:'Gain 1 Block whenever you draw beyond 5 cards in a turn.',source:['event','shop','combat']},
  {id:'ration_pack',   name:'Ration Pack',    art:'🍖',rarity:'common',  desc:'Heal 5 HP when you use a Rest action.',source:['shop','event','combat']},
  {id:'giak_coin',     name:'Giak Coin Pouch',art:'🪙',rarity:'common',  desc:'+10 gold after every combat.',source:['combat','shop']},
  // UNCOMMON
  {id:'runed_bracers', name:'Runed Bracers',  art:'⚙️',rarity:'uncommon',desc:'Gain 1 extra Energy each combat.',source:['boss','elite','shop']},
  {id:'blood_vial',    name:'Blood Vial',     art:'🩸',rarity:'uncommon',desc:'Heal 2 HP whenever you play a Skill card.',source:['elite','event']},
  {id:'iron_crown',    name:'Iron Crown',     art:'👑',rarity:'uncommon',desc:'Start each turn with 1 extra Block.',source:['boss','shop']},
  {id:'scroll_of_kai', name:'Scroll of Kai',  art:'📜',rarity:'uncommon',desc:'Draw 1 extra card at the start of each turn.',source:['elite','boss','shop']},
  {id:'darklord_shard',name:'Darklord Shard', art:'🖤',rarity:'uncommon',desc:'Enemy attacks deal 1 less damage (min 1).',source:['boss','elite']},
  {id:'kai_compass',   name:'Kai Compass',    art:'🧭',rarity:'uncommon',desc:'+15 gold after each combat victory.',source:['event','shop','elite']},
  {id:'whetstone',     name:'Whetstone',      art:'🗡️',rarity:'uncommon',desc:'First attack each turn deals +3 damage.',source:['shop','elite','combat']},
  {id:'battle_salve',  name:'Battle Salve',   art:'🧴',rarity:'uncommon',desc:'Heal 4 HP at the end of each combat.',source:['event','shop']},
  {id:'bone_ring',     name:'Bone Ring',      art:'💍',rarity:'uncommon',desc:'Gain 1 Focus at the start of each combat.',source:['elite','event']},
  // RARE
  {id:'stone_seal',    name:'Stone Seal',       art:'🪨',rarity:'rare',desc:'Whenever you gain Block, gain 1 extra.',source:['boss','elite']},
  {id:'sommerswerd_shard',name:'Sommerswerd Shard',art:'☀️',rarity:'rare',desc:'Attacks deal +4 vs Darklords. +6 vs Undead.',source:['boss']},
  {id:'kai_medallion', name:'Kai Medallion',    art:'🏅',rarity:'rare',desc:'At the start of combat, draw 2 extra cards.',source:['boss','elite']},
  {id:'vordak_essence',name:'Vordak Essence',   art:'👻',rarity:'rare',desc:'Once per run: survive a killing blow at 1 HP.',source:['boss']},
  {id:'elder_amulet',  name:'Elder Amulet',     art:'💎',rarity:'rare',desc:'All healing effects heal 50% more.',source:['boss','shop']},
  {id:'darkstone',     name:'Darkstone',        art:'🌑',rarity:'rare',desc:'Gain 2 Strength at the start of each combat.',source:['boss','elite']},
  {id:'spirit_cloak',  name:'Spirit Cloak',     art:'🌀',rarity:'rare',desc:'Reduce all incoming damage by 2 when below half HP.',source:['boss','elite']},
  {id:'war_horn',      name:'War Horn',         art:'📯',rarity:'rare',desc:'At round start with 3+ enemies alive: gain 2 Energy.',source:['boss','elite']},
  // KAI (discipline relics — granted at start, never dropped)
  {id:'sense_ward',      name:'Sense Ward',        art:'👁️',rarity:'kai',disc:'sixthsense',  desc:'Sixth Sense: enemies reveal their next action before acting.',source:['discipline']},
  {id:'hunters_brand',   name:"Hunter's Brand",    art:'🐾',rarity:'kai',disc:'tracking',    desc:'Tracking: marked enemies take +3 damage from all sources.',source:['discipline']},
  {id:'kai_shroud',      name:'Kai Shroud',         art:'🌿',rarity:'kai',disc:'camouflage',  desc:'Camouflage: the first enemy each combat starts Stunned.',source:['discipline']},
  {id:'predator_lens',   name:'Predator Lens',      art:'🏹',rarity:'kai',disc:'hunting',     desc:'Hunting: Stalk bonus attacks deal double bonus damage.',source:['discipline']},
  {id:'kai_flame',       name:'Kai Flame',          art:'✨',rarity:'kai',disc:'healing',     desc:'Healing: heal cards also grant 1 Block per 2 HP healed (max 5).',source:['discipline']},
  {id:'mind_fortress',   name:'Mind Fortress',      art:'🧠',rarity:'kai',disc:'mindblast',   desc:'Mindblast: psychic damage cannot be reduced by Block.',source:['discipline']},
  {id:'pathfinder_stone',name:'Pathfinder Stone',   art:'🧭',rarity:'kai',disc:'pathsmanship',desc:'Pathsmanship: draw 1 extra card whenever you gain Focus.',source:['discipline']},
  {id:'blade_covenant',  name:'Blade Covenant',     art:'⚔️',rarity:'kai',disc:'weaponskill', desc:'Weaponskill: Attack cards spend 1 Focus on play (free cost reduction). No effect without Focus.',source:['discipline']},
  {id:'iron_mind',       name:'Iron Mind',          art:'🛡️',rarity:'kai',disc:'mindshield',  desc:'Mind Shield: immune to Weaken and Curse status effects.',source:['discipline']},
  {id:'beast_covenant',  name:'Beast Covenant',     art:'🦅',rarity:'kai',disc:'animalkinship',desc:'Animal Kinship: gain 2 Block every time you draw a card in combat.',source:['discipline']},
];

function hasRelic(id){ return G.relics && G.relics.includes(id); }

function relicsForSource(source) {
  const owned = G.relics || [];
  const discPool = G.discRelicPool || [];
  const playerDiscs = G.disciplines || [];

  // Standard pool: non-kai relics for this source, not already owned
  const standard = ALL_RELICS.filter(r =>
    r.rarity !== 'kai' &&
    r.source.includes(source) &&
    !owned.includes(r.id)
  );

  // Discipline-gated pool: relics the player didn't start with,
  // only available if they have the matching discipline
  const gated = discPool
    .filter(entry => playerDiscs.includes(entry.disc) && !owned.includes(entry.id))
    .map(entry => ALL_RELICS.find(r => r.id === entry.id))
    .filter(Boolean);

  // Merge, deduplicate
  const seen = new Set();
  return [...standard, ...gated].filter(r => { if(seen.has(r.id)) return false; seen.add(r.id); return true; });
}
function pickRelic(source) {
  const pool = relicsForSource(source);
  if(!pool.length) return null;
  const weighted = [];
  pool.forEach(r => {
    const w = r.rarity==='common'?6 : r.rarity==='uncommon'?3 : r.rarity==='rare'?1 : 0;
    for(let i=0;i<w;i++) weighted.push(r);
  });
  return pick(weighted);
}

// ── Kai Disciplines ──────────────────────────────────────────
const KAI_DISCIPLINES = [
  {id:'camouflage',  name:'Camouflage',     icon:'🌿',hint:'Move unseen through hostile lands',       flavorCard:'camouflage', relic:'wolf_pelt',     desc:'Gain 8 Block. Exhaust.'},
  {id:'hunting',     name:'Hunting',        icon:'🏹',hint:'Track and fell prey with deadly precision',flavorCard:'first_strike',relic:'kai_talisman',  desc:'Stalk bonus attacks'},
  {id:'tracking',    name:'Tracking',       icon:'🐾',hint:'Read the land; nothing escapes your notice',flavorCard:'track_prey',relic:'kai_compass',   desc:'Mark all enemies, gain Focus'},
  {id:'healing',     name:'Healing',        icon:'✨',hint:'Channel the Kai to mend wounds',           flavorCard:'kai_heal',   relic:'healing_herb',  desc:'Heal 10 HP'},
  {id:'mindblast',   name:'Mindblast',      icon:'🧠',hint:'Project psychic force against foes',       flavorCard:'mindblast',  relic:'iron_grimoire', desc:'10 psychic dmg, ignores Block'},
  {id:'sixthsense',  name:'Sixth Sense',    icon:'👁️',hint:'Perceive danger before it strikes',       flavorCard:'sixth_sense',relic:'scroll_of_kai', desc:'Draw 3 cards'},
  {id:'pathsmanship',name:'Pathsmanship',   icon:'🧭',hint:'Never lost in any terrain',                flavorCard:'pathfinding',relic:'iron_crown',    desc:'Draw 2, gain 1 Focus'},
  {id:'weaponskill', name:'Weaponskill',    icon:'⚔️',hint:'Master every blade and bow',               flavorCard:'broadsword', relic:'kai_talisman',  desc:'Deal 10 dmg'},
  {id:'mindshield',  name:'Mind Shield',    icon:'🛡️',hint:'Guard your thoughts against dark powers',  flavorCard:'endure',     relic:'darklord_shard',desc:'Endure: absorb 3 hits'},
  {id:'animalkinship',name:'Animal Kinship',icon:'🦅',hint:'Communicate with beasts of the wild',      flavorCard:'animal_bond',relic:'wolf_pelt',     desc:'Draw 2, gain Block & Focus'},
];

let selectedDiscs = ['camouflage','hunting','tracking','healing','mindblast'];

const DISC_LABEL = {};
KAI_DISCIPLINES.forEach(d => { DISC_LABEL[d.id] = d.icon + ' ' + d.name; });

// ── Enemy pools ──────────────────────────────────────────────
const ENEMY_POOLS = [
  [
    {name:'Giak Raider',    sprite:'👺',hp:22,type:'beast',   actions:[{type:'attack',val:6,label:'Hack 6'},{type:'attack',val:8,label:'Slash 8'},{type:'block',val:4,label:'Shield Up'}]},
    {name:'Drakkar Spy',    sprite:'🗡️',hp:28,type:'humanoid',actions:[{type:'attack',val:8,label:'Lunge 8'},{type:'debuff',key:'Weaken',label:'Weaken'},{type:'attack',val:10,label:'Drive 10'}]},
    {name:'Gourgaz Whelp',  sprite:'😈',hp:20,type:'beast',   actions:[{type:'attack',val:5,label:'Bite 5'},{type:'attack',val:5,label:'Snap 5'},{type:'attack',val:9,label:'Pounce 9'}]},
    {name:'Darkland Scout', sprite:'🪖',hp:26,type:'humanoid',actions:[{type:'block',val:5,label:'Brace'},{type:'attack',val:9,label:'Spear 9'},{type:'attack',val:7,label:'Thrust 7'}]},
    {name:'Bone Wraith',    sprite:'💀',hp:24,type:'undead',  actions:[{type:'attack',val:7,label:'Claw 7'},{type:'debuff',key:'Curse',label:'Death Touch'},{type:'attack',val:9,label:'Rend 9'}]},
  ],
  [
    {name:'Drakkarim Guard', sprite:'🛡️',hp:42,type:'humanoid',actions:[{type:'attack',val:12,label:'Sword 12'},{type:'block',val:8,label:'Brace'},{type:'attack',val:14,label:'Heavy Cut 14'}]},
    {name:'Gourgaz Brute',   sprite:'👹',hp:50,type:'beast',   actions:[{type:'attack',val:10,label:'Maul 10'},{type:'attack',val:10,label:'Maul 10'},{type:'debuff',key:'Fear',label:'Roar'},{type:'attack',val:15,label:'Rend 15'}]},
    {name:'Kraan Rider',     sprite:'🦅',hp:36,type:'beast',   actions:[{type:'attack',val:9,label:'Dive 9'},{type:'attack',val:9,label:'Dive 9'},{type:'attack',val:13,label:'Talon 13'}]},
    {name:'Helghast',        sprite:'👻',hp:40,type:'undead',  actions:[{type:'debuff',key:'Curse',label:'Touch of Death'},{type:'attack',val:11,label:'Soul Drain 11'},{type:'attack',val:14,label:'Wail 14'}]},
    {name:'Vordak',          sprite:'🌫️',hp:46,type:'undead',  actions:[{type:'attack',val:14,label:'Shriek 14'},{type:'debuff',key:'Weaken',label:'Weaken'},{type:'block',val:10,label:'Phase'}]},
  ],
  [
    {name:'Darklord Liege',  sprite:'🦇',hp:68,type:'darklord',actions:[{type:'attack',val:16,label:'Dark Blade 16'},{type:'block',val:12,label:'Shadow Ward'},{type:'attack',val:20,label:'Obliterate 20'},{type:'debuff',key:'Vulnerable',label:'Darken'}]},
    {name:'Chaos Mage',      sprite:'🌀',hp:74,type:'humanoid',actions:[{type:'debuff',key:'Curse',label:'Hex'},{type:'attack',val:18,label:'Chaos Bolt 18'},{type:'attack',val:14,label:'Disorder 14'},{type:'block',val:15,label:'Warp Shield'}]},
    {name:'Iron Warrior',    sprite:'🤖',hp:82,type:'humanoid',actions:[{type:'block',val:18,label:'Fortress'},{type:'attack',val:20,label:'Iron Slam 20'},{type:'attack',val:16,label:'Crush 16'}]},
    {name:'Vordak Wraith',   sprite:'👿',hp:60,type:'undead',  actions:[{type:'debuff',key:'Weaken',label:'Haunt'},{type:'attack',val:15,label:'Terror 15'},{type:'attack',val:20,label:'Soul Shatter 20'},{type:'block',val:12,label:'Ethereal'}]},
  ],
  [
    {name:'Shadow Mage',     sprite:'🧙',hp:88,type:'darklord',actions:[{type:'attack',val:18,label:'Shadow Lance 18'},{type:'debuff',key:'Weaken',label:'Weaken'},{type:'attack',val:22,label:'Oblivion 22'},{type:'block',val:16,label:'Dark Shield'}]},
    {name:'Death Knight',    sprite:'💀',hp:98,type:'undead',  actions:[{type:'attack',val:20,label:'Soul Strike 20'},{type:'block',val:20,label:'Bone Ward'},{type:'attack',val:25,label:'Death Blow 25'}]},
    {name:'Darklord Guard',  sprite:'🔱',hp:92,type:'darklord',actions:[{type:'attack',val:16,label:'Sentinel Strike 16'},{type:'attack',val:16,label:'Sentinel Strike 16'},{type:'block',val:18,label:'Iron Aegis'},{type:'attack',val:22,label:'Execute 22'}]},
  ],
];

const ENCOUNTER_GROUPS = [
  {floors:[0,4],enemies:[
    [{name:'Giak Scout',sprite:'👺',hp:18,type:'beast',actions:[{type:'attack',val:5,label:'Stab 5'},{type:'attack',val:7,label:'Slash 7'}]},{name:'Giak Archer',sprite:'🏹',hp:15,type:'beast',actions:[{type:'attack',val:6,label:'Arrow 6'},{type:'debuff',key:'Weaken',label:'Aim'},{type:'attack',val:8,label:'Volley 8'}]}],
    [{name:'Bone Wraith',sprite:'💀',hp:22,type:'undead',actions:[{type:'attack',val:7,label:'Claw 7'},{type:'attack',val:9,label:'Rend 9'}]},{name:'Giak Grunt',sprite:'👺',hp:18,type:'beast',actions:[{type:'block',val:4,label:'Guard'},{type:'attack',val:7,label:'Bash 7'}]}],
  ]},
  {floors:[5,9],enemies:[
    [{name:'Drakkarim Soldier',sprite:'🛡️',hp:38,type:'humanoid',actions:[{type:'attack',val:12,label:'Sword 12'},{type:'block',val:8,label:'Brace'}]},{name:'Drakkarim Marksman',sprite:'🏹',hp:30,type:'humanoid',actions:[{type:'attack',val:10,label:'Bolt 10'},{type:'debuff',key:'Vulnerable',label:'Pinpoint'},{type:'attack',val:12,label:'Volley 12'}]}],
    [{name:'Helghast',sprite:'👻',hp:35,type:'undead',actions:[{type:'debuff',key:'Curse',label:'Death Touch'},{type:'attack',val:11,label:'Drain 11'}]},{name:'Vordak',sprite:'🌫️',hp:28,type:'undead',actions:[{type:'attack',val:9,label:'Wail 9'},{type:'debuff',key:'Weaken',label:'Haunt'},{type:'attack',val:13,label:'Shriek 13'}]}],
    [{name:'Kraan',sprite:'🦅',hp:30,type:'beast',actions:[{type:'attack',val:8,label:'Dive 8'},{type:'attack',val:10,label:'Talon 10'}]},{name:'Kraan',sprite:'🦅',hp:30,type:'beast',actions:[{type:'attack',val:8,label:'Dive 8'},{type:'attack',val:10,label:'Talon 10'}]},{name:'Giak Rider',sprite:'🪖',hp:22,type:'humanoid',actions:[{type:'attack',val:7,label:'Lance 7'},{type:'block',val:6,label:'Guard'}]}],
  ]},
  {floors:[10,13],enemies:[
    [{name:'Iron Warrior',sprite:'🤖',hp:70,type:'humanoid',actions:[{type:'block',val:16,label:'Fortress'},{type:'attack',val:18,label:'Slam 18'}]},{name:'Vordak Wraith',sprite:'👿',hp:50,type:'undead',actions:[{type:'debuff',key:'Weaken',label:'Haunt'},{type:'attack',val:15,label:'Terror 15'}]}],
    [{name:'Chaos Mage',sprite:'🌀',hp:60,type:'humanoid',actions:[{type:'debuff',key:'Curse',label:'Hex'},{type:'attack',val:16,label:'Chaos Bolt 16'}]},{name:'Chaos Acolyte',sprite:'🌀',hp:40,type:'humanoid',actions:[{type:'attack',val:12,label:'Bolt 12'},{type:'block',val:10,label:'Warp Ward'}]}],
  ]},
  {floors:[14,16],enemies:[
    [{name:'Death Knight',sprite:'💀',hp:85,type:'undead',actions:[{type:'attack',val:18,label:'Soul Strike 18'},{type:'block',val:18,label:'Bone Ward'}]},{name:'Shadow Mage',sprite:'🧙',hp:70,type:'darklord',actions:[{type:'attack',val:16,label:'Shadow Lance 16'},{type:'debuff',key:'Weaken',label:'Weaken'}]}],
    [{name:'Darklord Guard',sprite:'🔱',hp:80,type:'darklord',actions:[{type:'attack',val:15,label:'Sentinel Strike 15'},{type:'block',val:16,label:'Iron Aegis'}]},{name:'Darklord Guard',sprite:'🔱',hp:80,type:'darklord',actions:[{type:'attack',val:15,label:'Sentinel Strike 15'},{type:'block',val:16,label:'Iron Aegis'}]},{name:'Shadow Mage',sprite:'🧙',hp:60,type:'darklord',actions:[{type:'attack',val:14,label:'Dark Lance 14'},{type:'debuff',key:'Curse',label:'Hex'}]}],
  ]},
];

const ELITES = [
  {name:'Helghast Lord',     sprite:'👿',hp:68,type:'undead',  actions:[{type:'attack',val:14,label:'Soul Drain 14'},{type:'debuff',key:'Curse',label:'Death Curse'},{type:'attack',val:18,label:'Wail 18'},{type:'block',val:10,label:'Phase'}]},
  {name:'Drakkarim Warlord', sprite:'⚔️',hp:78,type:'humanoid',actions:[{type:'attack',val:16,label:'Cleave 16'},{type:'block',val:14,label:'Iron Guard'},{type:'attack',val:20,label:'Warlord Strike 20'}]},
  {name:'Gourgaz Elder',     sprite:'🦎',hp:72,type:'beast',   actions:[{type:'attack',val:12,label:'Rake 12'},{type:'attack',val:12,label:'Rake 12'},{type:'debuff',key:'Venom',label:'Venom'},{type:'attack',val:18,label:'Devour 18'}]},
  {name:'Vordak Ancient',    sprite:'🌪️',hp:82,type:'undead',  actions:[{type:'debuff',key:'Vulnerable',label:'Terror'},{type:'attack',val:16,label:'Soul Rend 16'},{type:'attack',val:21,label:'Oblivion 21'},{type:'block',val:12,label:'Ethereal'}]},
  {name:'Chaos Champion',    sprite:'🌀',hp:90,type:'humanoid',actions:[{type:'attack',val:18,label:'Chaos Blade 18'},{type:'debuff',key:'Weaken',label:'Disorder'},{type:'attack',val:22,label:'Maelstrom 22'}]},
  {name:"Nza'Pok Shaman",    sprite:'🧿',hp:76,type:'humanoid',actions:[{type:'debuff',key:'Curse',label:'Bone Hex'},{type:'attack',val:14,label:'Bone Bolt 14'},{type:'block',val:16,label:'Spirit Veil'},{type:'attack',val:20,label:'Death Hex 20'}]},
];

const BOSSES = [
  {name:'GOURGAZ WAR-KING',       sprite:'👹',hp:90, type:'beast',   isBoss:true,actions:[{type:'attack',val:12,label:'War Smash 12'},{type:'block',val:10,label:'War Paint'},{type:'attack',val:16,label:'Berserk Charge 16'},{type:'debuff',key:'Weaken',label:'Battle Roar'}]},
  {name:'DRAKKARIM IRON-MARSHAL', sprite:'🛡️',hp:130,type:'humanoid',isBoss:true,actions:[{type:'attack',val:18,label:'Marshal Strike 18'},{type:'block',val:15,label:'Form Ranks'},{type:'attack',val:22,label:'Iron Tide 22'},{type:'attack',val:16,label:'Hammer Formation 16'}]},
  {name:'DARKLORD HAAKON',        sprite:'🦇',hp:175,type:'darklord',isBoss:true,actions:[{type:'attack',val:22,label:'Dark Tempest 22'},{type:'block',val:18,label:'Shadow Shroud'},{type:'attack',val:28,label:'Soul Rend 28'},{type:'debuff',key:'Curse',label:"Darklord's Curse"},{type:'attack',val:20,label:'Void Blade 20'}]},
  {name:'ZAGARNA THE DARKLORD',   sprite:'👁️',hp:230,type:'darklord',isBoss:true,actions:[{type:'attack',val:26,label:'Annihilation 26'},{type:'block',val:25,label:"Darklord's Aegis"},{type:'attack',val:32,label:'Oblivion 32'},{type:'debuff',key:'Vulnerable',label:'Soul Curse'},{type:'attack',val:24,label:'Dark Reckoning 24'},{type:'attack',val:30,label:'Apocalypse 30'}]},
];

// ── Free-play events ─────────────────────────────────────────
const EVENTS = [
  {title:'Wounded Soldier',art:'🪖',text:'A Sommerlund soldier lies wounded on the road. Your Kai senses warn this could be a trap — or a genuine survivor.',
   choices:[
    {label:'Heal him (Lose 5 HP, gain a card)',desc:'Draw on your Kai gift. He gifts you his last technique scroll.',effect:g=>{g.hp=Math.max(1,g.hp-5);gainRandomCard(g,'Gained: technique scroll!')}},
    {label:'Leave him and press on',desc:'You cannot afford to linger.',effect:g=>{}},
    {label:'Search him (50%: +30 gold or −8 HP)',desc:'Check for hidden dangers.',effect:g=>{if(Math.random()<.5){g.gold+=30;G._emsg='Hidden gold: +30!'}else{g.hp=Math.max(1,g.hp-8);G._emsg='A trap! −8 HP'}}},
  ]},
  {title:'Ancient Kai Shrine',art:'🏛️',text:'Deep in the forest, untouched by the Darklords, stands an ancient Kai shrine.',
   choices:[
    {label:'Meditate (Heal 15 HP)',desc:'Commune with the spirits of the fallen Kai.',effect:g=>{g.hp=Math.min(g.hpMax,g.hp+15);G._emsg='Restored 15 HP.'}},
    {label:'Study the inscriptions (Gain a Kai card)',desc:'Ancient techniques preserved in stone.',effect:g=>{gainRandomKaiCard(g,'Ancient Kai technique learned!')}},
    {label:'Leave it undisturbed',desc:'Some things should not be touched.',effect:g=>{G._emsg='You leave the shrine intact.'}},
  ]},
  {title:'Fallen Kai Warrior',art:'⚔️',text:'The body of a Kai warrior lies here, his equipment still intact. He bears a familiar Kai medallion.',
   choices:[
    {label:'Take his equipment (gain special item)',desc:'He would want you to continue the fight.',effect:g=>{G._pendingItemReward='event'}},
    {label:'Bury him (Heal 8 HP)',desc:'Give the fallen Kai a proper burial. You feel renewed.',effect:g=>{g.hp=Math.min(g.hpMax,g.hp+8);G._emsg='You bury your kin. +8 HP.'}},
  ]},
  {title:'Dark Ritual Site',art:'🕯️',text:'A dark Darklord ritual circle pulses with foul energy. You could absorb it — at a cost.',
   choices:[
    {label:'Absorb the power (+5 Strength, −10 HP)',desc:'Dangerous energy floods through you.',effect:g=>{g.powers=g.powers||{};g.powers.strength=(g.powers.strength||0)+5;g.hp=Math.max(1,g.hp-10);G._emsg='+5 Strength, −10 HP'}},
    {label:'Destroy the ritual (+10 HP)',desc:'You shatter the dark sigils.',effect:g=>{g.hp=Math.min(g.hpMax,g.hp+10);G._emsg='Ritual destroyed. +10 HP'}},
    {label:'Leave it alone',desc:'Best not to meddle with dark magic.',effect:g=>{G._emsg='You leave the cursed ground.'}},
  ]},
  {title:'Border Peddler',art:'🧳',text:'A nervous merchant has strayed into dangerous territory. He offers to sell you supplies cheaply.',
   choices:[
    {label:'Buy healing salve (−15 gold, +20 HP)',desc:'A rare healing mixture.',effect:g=>{if(g.gold>=15){g.gold-=15;g.hp=Math.min(g.hpMax,g.hp+20);G._emsg='Salve used: +20 HP.'}else{G._emsg='Not enough gold.'}}},
    {label:'Buy a technique scroll (−20 gold, gain card)',desc:'Stolen from a Kai monastery.',effect:g=>{if(g.gold>=20){g.gold-=20;gainRandomCard(g,'Scroll purchased!')}else{G._emsg='Not enough gold.'}}},
    {label:'Send him on his way',desc:'The road is dangerous for merchants.',effect:g=>{G._emsg='You wish him luck.'}},
  ]},
];

// ── Story Books ──────────────────────────────────────────────
// ⚠ PASTE STEP: Open your original index.html.
// Find the line:  const BOOKS = [
// Find the line:  ]; // end BOOKS
// Copy everything from  const BOOKS = [  to  ]; // end BOOKS  (inclusive)
// Paste it here, replacing this comment block.

const BOOKS = []; // ← REPLACE THIS LINE with your BOOKS array paste
