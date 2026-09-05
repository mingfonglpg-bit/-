const KEYS = {
  items: 'sw_items_v3',
  layout: 'sw_layout_v3',
  users: 'sw_users_v3',
  session: 'sw_session_v3',
  pending: 'sw_pending_v3',
  cloud: 'sw_cloud_cfg_v1'
};

const UNITS = ['個','包','片','KG','箱','袋','瓶','罐','盒','卷','組','打','其他'];
const REPORT_TYPES = ['報廢','異常','移位','出清','散貨','即期','補貨','正常'];
const PAGE_SIZE = 15;

const DEFAULT_LAYOUT = {
  zones: [
    {id: 'z_jr', name: '極冷庫-右', floors: 4, slotsPerFloor: 22},
    {id: 'z_jl', name: '極冷庫-左', floors: 4, slotsPerFloor: 22},
    {id: 'z_cr', name: '冷藏庫-右', floors: 2, slotsPerFloor: 15},
    {id: 'z_cl', name: '冷藏庫-左', floors: 2, slotsPerFloor: 15},
    {id: 'z_cw', name: '常溫區', floors: 4, slotsPerFloor: 5},
    {id: 'z_wl', name: '左走道區', floors: 2, slotsPerFloor: 21},
    {id: 'z_wr', name: '右走道區', floors: 1, slotsPerFloor: 5},
    {id: 'z_dry', name: '乾式熟成-左', floors: 1, slotsPerFloor: 5},
    {id: 'z_ov', name: '超儲區', floors: 2, slotsPerFloor: 14}
  ]
};

const SUPABASE_SQL = `-- 智慧倉儲 Supabase schema
create table if not exists warehouse_items (
  id text primary key,
  sku text,
  location text,
  product_name text,
  quantity numeric default 0,
  unit text default '個',
  bulk_qty numeric default 0,
  bulk_unit text default '個',
  status text default '正常',
  batch_no text,
  expiry_date text,
  note text,
  reports jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_wh_items_loc on warehouse_items(location);
create index if not exists idx_wh_items_sku on warehouse_items(sku);

create table if not exists warehouse_meta (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

alter table warehouse_items enable row level security;
alter table warehouse_meta enable row level security;
drop policy if exists "anon_all_items" on warehouse_items;
drop policy if exists "anon_all_meta" on warehouse_meta;
create policy "anon_all_items" on warehouse_items for all using (true) with check (true);
create policy "anon_all_meta" on warehouse_meta for all using (true) with check (true);
`;

function load(k, d) {
  try { const v = JSON.parse(localStorage.getItem(k)); return v != null ? v : d; } 
  catch { return d; }
}

function save(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)); } 
  catch (e) { console.error('localStorage 寫入失敗', e); }
}

function toast(msg, type = 'info', ms = 2800) {
  const wrap = document.getElementById('toastWrap');
  if (!wrap) { console.log(msg); return; }
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'info');
  el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, ms);
}
