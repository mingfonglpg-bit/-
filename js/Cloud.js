export class Cloud {
  constructor(config, onRealtimeChange) {
    this.cfg = config;
    this.sbClient = null;
    this.ready = false;
    this.onRealtimeChange = onRealtimeChange;
    this.init();
  }

  init() {
    if (!this.cfg.enabled || !this.cfg.url || !this.cfg.key) {
      this.ready = false;
      return;
    }
    try {
      this.sbClient = supabase.createClient(this.cfg.url.trim(), this.cfg.key.trim());
      this.ready = true;
      this.setupRealtime();
    } catch (e) {
      console.error('Supabase 初始化失敗', e);
      this.ready = false;
    }
  }

  setupRealtime() {
    if (!this.ready) return;
    this.sbClient
      .channel('wh_items_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouse_items' }, payload => {
        if (this.onRealtimeChange) this.onRealtimeChange(payload);
      })
      .subscribe();
  }

  async fetchItems() {
    if (!this.ready) return [];
    const { data, error } = await this.sbClient.from('warehouse_items').select('*');
    if (error) throw error;
    return data;
  }

  async upsertItems(rows) {
    if (!this.ready) return false;
    const { error } = await this.sbClient.from('warehouse_items').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    return true;
  }

  async deleteItems(ids) {
    if (!this.ready) return false;
    const { error } = await this.sbClient.from('warehouse_items').delete().in('id', ids);
    if (error) throw error;
    return true;
  }

  async saveMeta(key, value) {
    if (!this.ready) return;
    await this.sbClient.from('warehouse_meta').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  }
}
