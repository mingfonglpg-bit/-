export class Cloud {
  constructor(config, onRealtimeChange) {
    this.cfg = config || {};
    this.sbClient = null;
    this.ready = false;
    this.onRealtimeChange = onRealtimeChange;
    this.init();
  }

  init() {
    // 1. 嚴格檢查配置
    if (!this.cfg.enabled || !this.cfg.url || !this.cfg.key) {
      this.ready = false;
      this.sbClient = null;
      return;
    }

    // 2. 防禦 CDN 未載入完成的情況
    if (typeof supabase === 'undefined') {
      console.error('Supabase SDK 未載入，請確認 HTML 已引入 SDK CDN');
      this.ready = false;
      return;
    }

    try {
      this.sbClient = supabase.createClient(this.cfg.url.trim(), this.cfg.key.trim());
      this.ready = true;
      this.setupRealtime();
    } catch (e) {
      console.error('Supabase 初始化失敗:', e);
      this.ready = false;
    }
  }

  setupRealtime() {
    if (!this.isReady()) return;
    
    this.sbClient
      .channel('wh_items_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_items' }, payload => {
        if (typeof this.onRealtimeChange === 'function') {
          this.onRealtimeChange(payload);
        }
      })
      .subscribe();
  }

  async fetchItems() {
    if (!this.isReady()) return [];
    try {
      const { data, error } = await this.sbClient.from('warehouse_items').select('*');
      if (error) {
        console.error('抓取資料失敗:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.error('網路連線異常:', e);
      return [];
    }
  }

  async upsertItems(rows) {
    if (!this.isReady() || !rows || rows.length === 0) return false;
    try {
      const { error } = await this.sbClient.from('warehouse_items').upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('更新資料失敗:', e);
      return false;
    }
  }

  async deleteItems(ids) {
    if (!this.isReady() || !ids || ids.length === 0) return false;
    try {
      const { error } = await this.sbClient.from('warehouse_items').delete().in('id', ids);
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('刪除資料失敗:', e);
      return false;
    }
  }

  async saveMeta(key, value) {
    if (!this.isReady()) return false;
    try {
      const { error } = await this.sbClient.from('warehouse_meta').upsert(
        { key, value, updated_at: new Date().toISOString() }, 
        { onConflict: 'key' }
      );
      if (error) throw error;
      return true;
    } catch (e) {
      console.error('儲存 Meta 失敗:', e);
      return false;
    }
  }

  // 輔助方法：確保每次調用都同時檢查 ready 與 enabled
  isReady() {
    return this.ready && this.cfg && this.cfg.enabled;
  }
}
