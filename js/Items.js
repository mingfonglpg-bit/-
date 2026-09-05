export class Items {
  constructor(storageKey) {
    this.key = storageKey;
    this.items = JSON.parse(localStorage.getItem(this.key)) || [];
    this.locationIndex = new Map();
    this.rebuildIndex();
  }

  rebuildIndex() {
    this.locationIndex.clear();
    this.items.forEach(item => {
      const loc = this.normLoc(item.location);
      if (!this.locationIndex.has(loc)) {
        this.locationIndex.set(loc, []);
      }
      this.locationIndex.get(loc).push(item);
    });
  }

  normLoc(code) {
    return String(code || '').trim().replace(/\s+/g, '');
  }

  getItemsInSlot(code) {
    return this.locationIndex.get(this.normLoc(code)) || [];
  }

  saveLocal() {
    localStorage.setItem(this.key, JSON.stringify(this.items));
    this.rebuildIndex();
  }

  mergeWithCloud(cloudItems) {
    const map = new Map();
    const put = (it) => {
      if (!it || !it.id) return;
      const prev = map.get(it.id);
      if (!prev) { map.set(it.id, it); return; }
      const t1 = new Date(prev.updatedAt || prev.createdAt || 0).getTime();
      const t2 = new Date(it.updatedAt || it.createdAt || 0).getTime();
      map.set(it.id, t2 >= t1 ? it : prev);
    };

    cloudItems.forEach(put);
    this.items.forEach(put);
    this.items = Array.from(map.values());
    this.saveLocal();
    return this.items;
  }
}
