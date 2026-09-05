import { Auth } from './Auth.js';
import { Cloud } from './Cloud.js';
import { OfflineQueue } from './OfflineQueue.js';
import { Items } from './Items.js';
import { MapUI } from './MapUI.js';

class App {
  constructor() {
    this.KEYS = {
      items: 'sw_items_v3',
      layout: 'sw_layout_v3',
      users: 'sw_users_v3',
      session: 'sw_session_v3',
      pending: 'sw_pending_v3',
      cloud: 'sw_cloud_cfg_v1'
    };

    this.auth = new Auth(this.KEYS);
    this.items = new Items(this.KEYS.items);
    this.mapUI = new MapUI('mapGrid', this.items);
    
    const cloudCfg = JSON.parse(localStorage.getItem(this.KEYS.cloud)) || {};
    this.cloud = new Cloud(cloudCfg, () => this.onRealtimeSync());
    this.offlineQueue = new OfflineQueue(this.cloud);

    window.addEventListener('online', () => this.offlineQueue.processQueue());
  }

  init() {
    if (this.auth.getCurrentUser()) {
      this.showApp();
    } else {
      this.showLogin();
    }
  }

  showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    this.render();
  }

  showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }

  onSlotClick(code) {
    console.log('點擊儲位:', code);
    // 協調 MapUI 與 視圖跳轉
  }

  async onRealtimeSync() {
    if (this.cloud.ready) {
      const cloudData = await this.cloud.fetchItems();
      this.items.mergeWithCloud(cloudData);
      this.render();
    }
  }

  render() {
    // 進行 MapUI 與 Table 的視圖渲染協調
  }
}

const app = new App();
window.app = app;
window.addEventListener('DOMContentLoaded', () => app.init());
