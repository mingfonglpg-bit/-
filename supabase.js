let cloudCfg = load(KEYS.cloud, { enabled: false, url: '', key: '' });
let sbClient = null;
let cloudReady = false;
let syncing = false;

function getCloudCfg() { return cloudCfg || { enabled: false, url: '', key: '' }; }

function initSupabaseClient() {
  cloudReady = false; sbClient = null;
  const cfg = getCloudCfg();
  if (!cfg.enabled || !cfg.url || !cfg.key) { updateCloudBadge(); return false; }
  if (typeof supabase === 'undefined' || !supabase.createClient) {
    updateCloudBadge();
    return false;
  }
  try {
    sbClient = supabase.createClient(cfg.url.trim(), cfg.key.trim());
    cloudReady = true;
    updateCloudBadge();
    setupRealtime();
    return true;
  } catch (e) {
    console.error(e);
    cloudReady = false;
    updateCloudBadge();
    return false;
  }
}

function updateCloudBadge() {
  const el = document.getElementById('cloudBadge');
  if (!el) return;
  const cfg = getCloudCfg();
  if (cfg.enabled && cloudReady) {
    el.textContent = '☁ 已連線'; el.className = 'cloud-badge on';
  } else if (cfg.enabled) {
    el.textContent = '☁ 未連線'; el.className = 'cloud-badge off';
  } else {
    el.textContent = '☁ 本機'; el.className = 'cloud-badge off';
  }
}

function itemToRow(i) {
  return {
    id: i.id, sku: i.sku || '', location: i.location || '',
    product_name: i.productName || '', quantity: Number(i.quantity) || 0,
    unit: i.unit || '個', bulk_qty: Number(i.bulkQty) || 0,
    bulk_unit: i.bulkUnit || '個', status: i.status || '正常',
    batch_no: i.batchNo || '', expiry_date: i.expiryDate || '',
    note: i.note || '', reports: i.reports || [],
    created_at: i.createdAt || new Date().toISOString(),
    updated_at: i.updatedAt || new Date().toISOString()
  };
}

function rowToItem(r) {
  return {
    id: r.id, sku: r.sku || '', location: r.location || '',
    productName: r.product_name || '', quantity: Number(r.quantity) || 0,
    unit: r.unit || '個', bulkQty: Number(r.bulk_qty) || 0,
    bulkUnit: r.bulk_unit || '個', status: r.status || '正常',
    batchNo: r.batch_no || '', expiryDate: r.expiry_date || '',
    note: r.note || '', reports: r.reports || [],
    createdAt: r.created_at || null, updatedAt: r.updated_at || null
  };
}

function mergeItemsById(localList, cloudList) {
  const map = new Map();
  const put = (it) => {
    if (!it || !it.id) return;
    const prev = map.get(it.id);
    if (!prev) { map.set(it.id, it); return; }
    const t1 = new Date(prev.updatedAt || prev.createdAt || 0).getTime() || 0;
    const t2 = new Date(it.updatedAt || it.createdAt || 0).getTime() || 0;
    map.set(it.id, t2 >= t1 ? it : prev);
  };
  (cloudList || []).forEach(put);
  (localList || []).forEach(put);
  return Array.from(map.values());
}

async function mergeSyncWithCloud(silent) {
  if (!initSupabaseClient() || !sbClient) {
    if (!silent) toast('請先啟用並設定 Supabase', 'err');
    return false;
  }
  if (syncing) return false;
  syncing = true;
  try {
    if (!silent) toast('正在合併同步多裝置資料…', 'info', 5000);
    const { data: rows, error } = await sbClient.from('warehouse_items').select('*');
    if (error) throw error;
    
    const cloudItems = (rows || []).map(rowToItem);
    items = mergeItemsById(items, cloudItems);
    save(KEYS.items, items);

    const outRows = items.map(itemToRow);
    for (let i = 0; i < outRows.length; i += 200) {
      await sbClient.from('warehouse_items').upsert(outRows.slice(i, i + 200), { onConflict: 'id' });
    }

    if (typeof applyMergedToUI === 'function') applyMergedToUI();
    if (!silent) toast('合併同步完成（共 ' + items.length + ' 筆）', 'ok');
    return true;
  } catch (e) {
    console.error(e);
    if (!silent) toast('同步失敗：' + (e.message || e), 'err');
    return false;
  } finally {
    syncing = false;
  }
}

let realtimeChannel = null;
function setupRealtime() {
  if (realtimeChannel) {
    try { sbClient.removeChannel(realtimeChannel); } catch (e) {}
  }
  if (!cloudReady || !sbClient || !getCloudCfg().enabled) return;
  try {
    realtimeChannel = sbClient.channel('wh_items_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_items' }, () => {
        clearTimeout(window._rtPullTimer);
        window._rtPullTimer = setTimeout(() => mergeSyncWithCloud(true), 600);
      })
      .subscribe(status => { if (status === 'SUBSCRIBED') updateCloudBadge(); });
  } catch (e) { console.warn('realtime', e); }
}
