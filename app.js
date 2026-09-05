let items = load(KEYS.items, []);
let layout = load(KEYS.layout, null) || DEFAULT_LAYOUT;
let users = load(KEYS.users, null);
let pending = load(KEYS.pending, []);
let session = load(KEYS.session, null);

if (!users || !users.length) {
  users = [{ username: 'admin', password: 'admin123', role: 'admin', name: '系統管理員', mustChangePassword: true, createdAt: new Date().toISOString() }];
  save(KEYS.users, users);
}

let currentZoneId = layout.zones[0]?.id || '';
let currentFloor = 1, currentPage = 1, jumpMode = false;
let selectedSlotCode = null, sortKey = 'sku', sortDir = 'asc';

function role() { return session?.role || 'guest'; }
function isAdmin() { return role() === 'admin'; }
function canWrite() { return isAdmin() || role() === 'operator'; }

function escapeHtml(s) { return s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function daysUntil(dateStr) { if (!dateStr) return null; const d = new Date(dateStr), t = new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0); return Math.ceil((d - t) / 86400000); }
function slotCode(zoneName, floor, slotNum) { return String(zoneName || '') + floor + 'F-' + slotNum; }
function normLoc(code) { return String(code || '').trim().replace(/\s+/g, ''); }
function getItemsInSlot(code) { const c = normLoc(code); return items.filter(i => normLoc(i.location) === c); }

function getSlotStatus(code) {
  const list = getItemsInSlot(code);
  if (!list.length) return 'empty';
  const totalQty = list.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  if (list.some(i => { const d = daysUntil(i.expiryDate); return d !== null && d <= 15; })) return 'expired';
  if (totalQty <= 5) return 'low';
  return 'occupied';
}

function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  let user = users.find(x => x.username === u && x.password === p);
  if (!user) { alert('帳號或密碼錯誤'); return; }
  session = { username: user.username, role: user.role, name: user.name || user.username };
  save(KEYS.session, session);
  enterApp();
}

function enterAsGuest() {
  session = { username: 'guest', role: 'guest', name: '訪客' };
  save(KEYS.session, session);
  enterApp();
}

function doLogout() {
  session = null; localStorage.removeItem(KEYS.session);
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
}

function enterApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  applyPermissions();
  renderZoneTabs(); updateFloorSelect(); renderMap(); renderTable(); renderStats();
}

function applyPermissions() {
  const r = role();
  document.getElementById('userLabel').textContent = session.name || session.username;
  const badge = document.getElementById('roleBadge');
  badge.className = 'role-badge role-' + r;
  badge.textContent = r === 'admin' ? '管理員' : r === 'operator' ? '操作員' : '訪客';
}

function renderStats() {
  const totalQty = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  const lowStock = items.filter(i => Number(i.quantity) <= 5).length;
  const skuCount = new Set(items.map(i => i.sku)).size;
  document.getElementById('stats').innerHTML = `
    <div class="stat-box"><div class="num">${items.length}</div><div class="label">總筆數</div></div>
    <div class="stat-box"><div class="num">${skuCount}</div><div class="label">SKU</div></div>
    <div class="stat-box"><div class="num">${totalQty}</div><div class="label">總數量</div></div>
    <div class="stat-box"><div class="num" style="color:var(--danger)">${lowStock}</div><div class="label">低庫存</div></div>`;
}

function renderZoneTabs() {
  document.getElementById('zoneTabs').innerHTML = layout.zones.map(z => 
    `<button class="zone-tab ${z.id === currentZoneId ? 'active' : ''}" onclick="switchZone('${z.id}')">${escapeHtml(z.name)}</button>`
  ).join('');
}

function switchZone(id) { currentZoneId = id; currentFloor = 1; renderZoneTabs(); updateFloorSelect(); renderMap(); }

function updateFloorSelect() {
  const zone = layout.zones.find(z => z.id === currentZoneId);
  const sel = document.getElementById('floorSelect');
  if (!zone) return;
  sel.innerHTML = Array.from({ length: zone.floors }, (_, i) => `<option value="${i + 1}" ${currentFloor === i + 1 ? 'selected' : ''}>${i + 1}F</option>`).join('');
}

function onFloorChange() { currentFloor = Number(document.getElementById('floorSelect').value); renderMap(); }

function renderMap() {
  const zone = layout.zones.find(z => z.id === currentZoneId);
  const grid = document.getElementById('mapGrid');
  if (!zone) return;
  const n = zone.slotsPerFloor;
  grid.style.gridTemplateColumns = `repeat(auto-fill, minmax(80px, 1fr))`;
  let html = '';
  for (let s = 1; s <= n; s++) {
    const code = slotCode(zone.name, currentFloor, s);
    const status = getSlotStatus(code);
    const list = getItemsInSlot(code);
    html += `<div class="slot ${status}" onclick="onSlotClick('${escapeHtml(code)}')">
      <div class="slot-code">${s}</div>
      <div class="slot-qty">${list.length ? list[0].quantity + (list[0].unit || '個') : '空'}</div>
    </div>`;
  }
  grid.innerHTML = html;
}

function onSlotClick(code) {
  toast(`點選庫位：${code}`, 'info');
}

function renderTable() {
  const tbody = document.getElementById('tableBody');
  if (!items.length) {
    tbody.innerHTML = '';
    document.getElementById('emptyState').classList.remove('hidden');
    return;
  }
  document.getElementById('emptyState').classList.add('hidden');
  tbody.innerHTML = items.map(item => `
    <tr>
      <td class="chk"><input type="checkbox"></td>
      <td>${escapeHtml(item.sku)}</td>
      <td>${escapeHtml(item.location)}</td>
      <td>${escapeHtml(item.productName)}</td>
      <td class="qty">${item.quantity}</td>
      <td>${escapeHtml(item.unit)}</td>
      <td>${item.bulkQty || 0}</td>
      <td><span class="status-badge status-${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td>
      <td>${escapeHtml(item.batchNo || '-')}</td>
      <td>${escapeHtml(item.expiryDate || '-')}</td>
      <td>${escapeHtml(item.note || '-')}</td>
      <td><button class="secondary" onclick="alert('詳細資料：${item.sku}')">檢視</button></td>
    </tr>
  `).join('');
}

function applyMergedToUI() {
  renderZoneTabs(); updateFloorSelect(); renderMap(); renderTable(); renderStats(); updateCloudBadge();
}

window.onload = function() {
  initSupabaseClient();
  if (session) enterApp();
};
