export class MapUI {
  constructor(containerId, itemsModule) {
    this.container = document.getElementById(containerId);
    this.itemsModule = itemsModule;
    this.carouselIndex = {};
  }

  renderMap(zone, currentFloor, slotColors = {}) {
    if (!zone) {
      this.container.innerHTML = '<div class="empty">請設定格局</div>';
      return;
    }

    const n = zone.slotsPerFloor;
    let html = '';

    for (let s = 1; s <= n; s++) {
      const code = `${zone.name}${currentFloor}F-${s}`;
      const list = this.itemsModule.getItemsInSlot(code);
      const status = this.calculateSlotStatus(list);
      
      const customColor = slotColors[code] ? `style="background: ${slotColors[code]}"` : '';

      html += `
        <div class="slot ${status}" ${customColor} data-code="${code}" onclick="app.onSlotClick('${code}')">
          <div class="slot-code">${s}</div>
          <div class="slot-qty">${list.length > 0 ? list.reduce((a,b) => a + Number(b.quantity), 0) : '空'}</div>
          <div class="slot-count">共 ${list.length} 件</div>
        </div>
      `;
    }
    this.container.innerHTML = html;
  }

  calculateSlotStatus(list) {
    if (!list.length) return 'empty';
    const totalQty = list.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    if (totalQty <= 5) return 'low';
    return 'occupied';
  }
}
