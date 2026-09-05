import { Auth } from './Auth.js';
import { Cloud } from './Cloud.js';
import { OfflineQueue } from './OfflineQueue.js';
import { Items } from './Items.js';
import { MapUI } from './MapUI.js';

export class App {
  constructor() {
    this.KEYS = {
      items: 'sw_items_v3',
      layout: 'sw_layout_v3',
      users: 'sw_users_v3',
      session: 'sw_session_v3',
      pending: 'sw_pending_v3',
      cloud: 'sw_cloud_cfg_v1'
    };

    // 初始化各子模組
    this.auth = new Auth(this.KEYS);
    this.items = new Items(this.KEYS.items);
    this.mapUI = new MapUI('mapGrid', this.items);
    
    const cloudCfg = JSON.parse(localStorage.getItem(this.KEYS.cloud)) || {};
    this.cloud = new Cloud(cloudCfg, () => this.onRealtimeSync());
    this.offlineQueue = new OfflineQueue(this.cloud);

    // 監聽離線轉連線事件
    window.addEventListener('online', () => this.offlineQueue.processQueue());
  }

  /**
   * 系統初始化入口點 (改為 async 確保帳號資料建立完成)
   */
  async init() {
    // 確保預設帳號已經建立完成
    if (typeof this.auth.initDefaultUser === 'function') {
      await this.auth.initDefaultUser();
    }

    if (this.auth.getCurrentUser()) {
      this.showApp();
    } else {
      this.showLogin();
    }
  }

  showApp() {
    const loginEl = document.getElementById('loginScreen');
    const appEl = document.getElementById('app');

    if (loginEl) loginEl.classList.add('hidden');
    if (appEl) appEl.classList.remove('hidden');

    // 顯示當前登入者資訊
    const currentUser = this.auth.getCurrentUser();
    const userInfoEl = document.getElementById('userInfo');
    if (currentUser && userInfoEl) {
      userInfoEl.innerText = `登入者：${currentUser.name || currentUser.username} (${currentUser.role})`;
    }

    this.render();
  }

  showLogin() {
    const loginEl = document.getElementById('loginScreen');
    const appEl = document.getElementById('app');

    if (loginEl) loginEl.classList.remove('hidden');
    if (appEl) appEl.classList.add('hidden');
  }

  onSlotClick(code) {
    console.log('點擊儲位:', code);
    const list = this.items.getItemsInSlot(code);
    if (list.length === 0) {
      alert(`儲位 [${code}] 目前為空`);
    } else {
      const info = list.map(i => `- ${i.name || '未命名項目'} (數量: ${i.quantity || 1})`).join('\n');
      alert(`儲位 [${code}] 存放物品:\n${info}`);
    }
  }

  async onRealtimeSync() {
    if (this.cloud.isReady && this.cloud.isReady()) {
      const cloudData = await this.cloud.fetchItems();
      this.items.mergeWithCloud(cloudData);
      this.render();
    }
  }

  render() {
    // 取得暫存的格局設定，若無則給予預設圖譜格局 (例如 A 區 8 個儲位)
    const savedLayout = JSON.parse(localStorage.getItem(this.KEYS.layout)) || { name: 'A', slotsPerFloor: 8 };
    const currentFloor = 1;

    // 呼叫 MapUI 繪製平面圖
    if (this.mapUI && typeof this.mapUI.renderMap === 'function') {
      this.mapUI.renderMap(savedLayout, currentFloor);
    }
  }
}

// 確保 DOM 載入後才實例化並綁定全域變數
window.addEventListener('DOMContentLoaded', async () => {
  const app = new App();
  window.app = app; // 掛載至全域，讓 HTML 中的 onclick 可以讀取
  await app.init();
});
