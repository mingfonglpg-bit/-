export class OfflineQueue {
  constructor(cloudInstance, storageKey = 'sw_offline_queue_v1') {
    this.cloud = cloudInstance;
    this.key = storageKey;
    this.queue = JSON.parse(localStorage.getItem(this.key)) || [];
  }

  enqueue(action, payload) {
    this.queue.push({
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      action, // 'upsert' | 'delete'
      payload,
      retries: 0
    });
    this.save();
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.queue));
  }

  async processQueue() {
    if (!this.cloud.ready || this.queue.length === 0) return;

    const currentBatch = [...this.queue];
    for (const item of currentBatch) {
      try {
        if (item.action === 'upsert') {
          await this.cloud.upsertItems(item.payload);
        } else if (item.action === 'delete') {
          await this.cloud.deleteItems(item.payload);
        }
        // 成功後移除
        this.queue = this.queue.filter(q => q.id !== item.id);
      } catch (e) {
        item.retries += 1;
        if (item.retries >= 8) {
          console.error(`佇列項目 ${item.id} 超過最大重試次數 (8次)，將自動註銷`, item);
          this.queue = this.queue.filter(q => q.id !== item.id);
        }
      }
    }
    this.save();
  }
}
