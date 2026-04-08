import DataManager from '../modules/DataManager.js';
import CalendarEngine from '../modules/CalendarEngine.js';
import ModalManager from '../modules/ModalManager.js';

class ListView {
  constructor(container) {
    this.container = container;
  }

  render() {
    const items = DataManager.getAllRecordsSorted().reverse();

    if (items.length === 0) {
      this.container.innerHTML = `
        <div class="list-empty">
          <p>还没有任何记录</p>
          <p style="margin-top:8px;font-size:0.85rem;color:#9CA3AF;">在日历中点击日期来添加目标或记录</p>
        </div>`;
      return;
    }

    let html = '<div class="list-container">';
    items.forEach(item => {
      const displayDate = CalendarEngine.formatDisplayDate(item.date);
      const hasActual = item.record && item.record.actualWeight != null;
      const actualText = hasActual ? `${item.record.actualWeight}kg` : '未记录';
      const targetText = item.target ? `${item.target.targetWeight}kg` : '未设置';
      const summaryParts = [];
      if (item.record) {
        if (item.record.exercise) summaryParts.push(`动:${item.record.exercise.slice(0, 6)}`);
        if (item.record.diet) summaryParts.push(`食:${item.record.diet.slice(0, 6)}`);
        if (item.record.skinCare) summaryParts.push(`肤:${item.record.skinCare.slice(0, 6)}`);
      }
      const summary = summaryParts.join(' ');

      html += `
        <div class="list-item" data-date="${item.date}">
          <span class="list-item-date">${displayDate}</span>
          <div class="list-item-weights">
            <span class="list-item-target">目标 ${targetText}</span>
            <span class="list-item-actual ${hasActual ? '' : 'missing'}">${actualText}</span>
            ${summary ? `<span style="font-size:0.75rem;color:#9CA3AF;margin-top:2px;">${summary}</span>` : ''}
          </div>
        </div>`;
    });
    html += '</div>';

    this.container.innerHTML = html;
    this._bindEvents();
  }

  _bindEvents() {
    this.container.querySelectorAll('.list-item').forEach(el => {
      el.addEventListener('click', () => {
        const dateStr = el.dataset.date;
        const target = DataManager.getTarget(dateStr);
        const record = DataManager.getRecord(dateStr);
        if (target || record) {
          ModalManager.showRecordModal(dateStr, target ? target.targetWeight : null, record);
        }
      });
    });
  }
}

export default ListView;
