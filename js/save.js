// ═══════════════════════════════════════════════════════════════
// save.js  —  Cloud save, player identity, progress state
// ═══════════════════════════════════════════════════════════════

// ── Progress state ───────────────────────────────────────────
let PROGRESS = {
  booksCompleted: [],   // indices of completed books
  discUnlocks: 5,       // 5 + completed books (max 9)
  carryState: null,     // {deck, relics, disciplines, gold} — persists between books
};

// ── Player identity ──────────────────────────────────────────
function getOrCreatePlayerId() {
  let pid = localStorage.getItem('lw_player_id');
  if (!pid) {
    pid = 'LW-' + Math.random().toString(36).substr(2,5).toUpperCase()
              + '-' + Math.random().toString(36).substr(2,5).toUpperCase();
    localStorage.setItem('lw_player_id', pid);
  }
  return pid;
}

async function cloudLoad() {
  const pid = getOrCreatePlayerId();
  try {
    const res = await fetch(`${SB_URL}/rest/v1/saves?player_id=eq.${encodeURIComponent(pid)}&select=data`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' }
    });
    if (!res.ok) return _localBackupLoad(pid);
    const rows = await res.json();
    return rows.length ? rows[0].data : null;
  } catch(e) {
    return _localBackupLoad(pid);
  }
}

function _localBackupLoad(pid) {
  try {
    const backup = localStorage.getItem('lw_progress_' + pid) || localStorage.getItem('lw_progress_backup');
    return backup ? JSON.parse(backup) : null;
  } catch(e) { return null; }
}

async function cloudSave(progressData) {
  const pid = getOrCreatePlayerId();
  try { localStorage.setItem('lw_progress_' + pid, JSON.stringify(progressData)); } catch(e) {}
  setSaveStatus('saving');
  const headers = {
    'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`,
    'Content-Type': 'application/json', 'Prefer': 'return=minimal'
  };
  const body = JSON.stringify({ data: progressData, updated_at: new Date().toISOString() });
  try {
    const patch = await fetch(`${SB_URL}/rest/v1/saves?player_id=eq.${encodeURIComponent(pid)}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation,count=exact' },
      body
    });
    if (patch.ok) {
      const contentRange = patch.headers.get('Content-Range') || '';
      const count = parseInt(contentRange.split('/')[1] || '0', 10);
      if (count > 0) { setSaveStatus('saved'); return true; }
    }
    const pidHash = pid.split('').reduce((a,c) => Math.abs((a * 31 + c.charCodeAt(0)) | 0), 0);
    const post = await fetch(`${SB_URL}/rest/v1/saves`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ id: pidHash, player_id: pid, data: progressData, updated_at: new Date().toISOString() })
    });
    if (post.ok) { setSaveStatus('saved'); return true; }
    const errText = await post.text().catch(()=>'');
    setSaveStatus('error', `${post.status}`);
    return false;
  } catch(e) {
    setSaveStatus('error', 'network');
    return false;
  }
}

function setSaveStatus(state, detail) {
  const el = document.getElementById('cloud-save-status');
  if (!el) return;
  el.style.display = 'block';
  el.className = 'save-status ' + state;
  if (state === 'saving')      el.textContent = '☁ Saving…';
  else if (state === 'saved')  el.textContent = '✓ Saved to cloud';
  else {
    const hint = detail === 'network' ? '(offline?)' : detail ? `(${detail})` : '';
    el.textContent = `✗ Cloud unavailable ${hint} — saved locally`;
  }
  if (state !== 'saving') setTimeout(() => { if(el) el.style.display='none'; }, 5000);
}

async function loadProgress() {
  const pid = getOrCreatePlayerId();
  document.querySelectorAll('.player-id-val').forEach(el => el.textContent = pid);
  const sidebar = document.getElementById('sidebar-pid');
  if (sidebar) sidebar.textContent = pid;
  const data = await cloudLoad();
  if (data) {
    PROGRESS.booksCompleted = data.booksCompleted || [];
    PROGRESS.discUnlocks = 5 + PROGRESS.booksCompleted.length;
    PROGRESS.carryState = data.carryState || null;
  }
}

async function saveProgress() {
  return await cloudSave(PROGRESS);
}

async function manualSave() {
  const btn = document.getElementById('manual-save-btn');
  const msg = document.getElementById('pid-import-msg');
  if(btn) btn.textContent = '☁ Saving…';
  const ok = await saveProgress();
  if(btn) btn.textContent = '☁ Save';
  if(msg) {
    msg.textContent = ok ? '✓ Progress saved to cloud' : '✗ Save failed — check connection';
    msg.className = 'pid-import-msg ' + (ok ? 'ok' : 'err');
    setTimeout(() => { msg.textContent = ''; }, 4000);
  }
}

function copyPlayerId() {
  const pid = getOrCreatePlayerId();
  navigator.clipboard && navigator.clipboard.writeText(pid);
  const el = document.getElementById('copy-pid-btn');
  if(el) { const old = el.textContent; el.textContent = 'Copied!'; setTimeout(()=>el.textContent=old, 1500); }
}

async function importPlayerId() {
  const input = document.getElementById('pid-import-input');
  const msg   = document.getElementById('pid-import-msg');
  if(!input || !msg) return;
  const raw = input.value.trim().toUpperCase();
  if(!/^LW-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(raw)) {
    msg.textContent = 'Invalid code format'; msg.className = 'pid-import-msg err';
    setTimeout(() => msg.textContent = '', 3000); return;
  }
  msg.textContent = 'Loading…'; msg.className = 'pid-import-msg';
  try {
    const res = await fetch(`${SB_URL}/rest/v1/saves?player_id=eq.${encodeURIComponent(raw)}&select=data`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
    });
    if(!res.ok) throw new Error('Network error');
    const rows = await res.json();
    if(!rows.length) {
      msg.textContent = 'No save found for that code'; msg.className = 'pid-import-msg err';
      setTimeout(() => msg.textContent = '', 5000); return;
    }
    localStorage.setItem('lw_player_id', raw);
    const data = rows[0].data;
    PROGRESS.booksCompleted = data.booksCompleted || [];
    PROGRESS.discUnlocks = 5 + PROGRESS.booksCompleted.length;
    document.querySelectorAll('.player-id-val').forEach(el => el.textContent = raw);
    const sp = document.getElementById('sidebar-pid');
    if(sp) sp.textContent = raw;
    input.value = '';
    msg.textContent = '✓ Save loaded! ' + PROGRESS.booksCompleted.length + ' book(s) completed.';
    msg.className = 'pid-import-msg ok';
    renderBookGrid();
    setTimeout(() => msg.textContent = '', 4000);
  } catch(e) {
    try {
      const localBackup = localStorage.getItem('lw_progress_' + raw);
      if (localBackup) {
        const data = JSON.parse(localBackup);
        localStorage.setItem('lw_player_id', raw);
        PROGRESS.booksCompleted = data.booksCompleted || [];
        PROGRESS.discUnlocks = 5 + PROGRESS.booksCompleted.length;
        document.querySelectorAll('.player-id-val').forEach(el => el.textContent = raw);
        input.value = '';
        msg.textContent = '✓ Loaded from local backup.'; msg.className = 'pid-import-msg ok';
        renderBookGrid();
        setTimeout(() => msg.textContent = '', 4000); return;
      }
    } catch(e2) {}
    msg.textContent = 'Connection failed — no local backup found'; msg.className = 'pid-import-msg err';
    setTimeout(() => msg.textContent = '', 3000);
  }
}
