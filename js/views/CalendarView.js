import DataManager from '../modules/DataManager.js';
import CalendarEngine from '../modules/CalendarEngine.js';
import ModalManager from '../modules/ModalManager.js';

class CalendarView {
  constructor(container) {
    this.container = container;
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth();
    this.firstDayOfWeek = 1;
    this.today = new Date();
  }

  render() {
    const grid = CalendarEngine.buildCalendarGrid(this.currentYear, this.currentMonth, this.firstDayOfWeek);
    const weekLabels = CalendarEngine.getWeekLabels(this.firstDayOfWeek);

    let html = `
      <div class="calendar-nav">
        <button id="prevMonth" aria-label="上个月">&lsaquo;</button>
        <h2>${this.currentYear}年 ${this.currentMonth + 1}月</h2>
        <button id="nextMonth" aria-label="下个月">&rsaquo;</button>
      </div>
      <div class="calendar-grid">
        ${weekLabels.map(l => `<div class="calendar-weekday">${l}</div>`).join('')}
    `;

    grid.forEach(row => {
      row.forEach(cell => {
        const dateStr = CalendarEngine.formatDate(cell.date);
        const isToday = CalendarEngine.isSameDay(cell.date, this.today);
        const target = DataManager.getTarget(dateStr);
        const record = DataManager.getRecord(dateStr);
        const hasRecord = record && (
          record.actualWeight != null ||
          (record.exercise && record.exercise.trim()) ||
          (record.diet && record.diet.trim()) ||
          (record.skinCare && record.skinCare.trim())
        );

        let indicatorHtml = '';
        let weightHint = '';
        if (target && hasRecord) {
          indicatorHtml = '<div class="day-indicator has-record"></div>';
          if (record.actualWeight != null) {
            weightHint = `<span class="day-weight-hint">${record.actualWeight}</span>`;
          }
        } else if (target) {
          indicatorHtml = '<div class="day-indicator target-only"></div>';
          weightHint = `<span class="day-weight-hint">${target.targetWeight}</span>`;
        } else if (hasRecord) {
          indicatorHtml = '<div class="day-indicator has-record"></div>';
          if (record.actualWeight != null) {
            weightHint = `<span class="day-weight-hint">${record.actualWeight}</span>`;
          }
        }

        html += `
          <div class="calendar-day${!cell.isCurrentMonth ? ' other-month' : ''}${isToday ? ' today' : ''}"
               data-date="${dateStr}">
            <span class="day-num">${cell.date.getDate()}</span>
            ${indicatorHtml}
            ${weightHint}
          </div>`;
      });
    });

    html += `
      </div>
      <div style="display:flex;justify-content:center;gap:8px;margin-top:14px;flex-wrap:wrap;">
        <button class="calendar-nav calendar-today-btn" id="todayBtn">回到今天</button>
        <button class="calendar-nav calendar-today-btn" id="clearTargetsBtn" style="background:#FEE2E2;color:#DC2626;">清除所有目标</button>
        <button class="calendar-nav calendar-today-btn" id="clearRecordsBtn" style="background:#FEF3C7;color:#D97706;">清除所有记录</button>
      </div>`;

    this.container.innerHTML = html;
    this._bindEvents();
  }

  _bindEvents() {
    this.container.querySelectorAll('.calendar-day').forEach(el => {
      el.addEventListener('click', () => {
        const dateStr = el.dataset.date;
        const target = DataManager.getTarget(dateStr);
        const record = DataManager.getRecord(dateStr);
        const hasRecord = record && (
          record.actualWeight != null ||
          (record.exercise && record.exercise.trim()) ||
          (record.diet && record.diet.trim()) ||
          (record.skinCare && record.skinCare.trim())
        );
        if (target || hasRecord) {
          ModalManager.showRecordModal(dateStr, target ? target.targetWeight : null, record);
        } else {
          ModalManager.showTargetModal(dateStr, null);
        }
      });
    });

    const prevBtn = this.container.querySelector('#prevMonth');
    const nextBtn = this.container.querySelector('#nextMonth');
    const todayBtn = this.container.querySelector('#todayBtn');
    const clearTargetsBtn = this.container.querySelector('#clearTargetsBtn');
    const clearRecordsBtn = this.container.querySelector('#clearRecordsBtn');

    if (prevBtn) prevBtn.addEventListener('click', () => this._changeMonth(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this._changeMonth(1));
    if (todayBtn) todayBtn.addEventListener('click', () => this._goToday());
    if (clearTargetsBtn) clearTargetsBtn.addEventListener('click', this._handleClearTargets.bind(this));
    if (clearRecordsBtn) clearRecordsBtn.addEventListener('click', this._handleClearRecords.bind(this));
  }

  _changeMonth(delta) {
    this.currentMonth += delta;
    if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
    if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
    this.render();
  }

  _goToday() {
    const t = new Date();
    this.currentYear = t.getFullYear();
    this.currentMonth = t.getMonth();
    this.render();
  }

  _handleClearTargets() {
    if (confirm('确定要清除所有目标体重吗？此操作不会影响实际记录，不可撤销。')) {
      DataManager.clearAllTargets();
      this.render();
    }
  }

  _handleClearRecords() {
    if (confirm('确定要清除所有实际记录吗？此操作不会影响目标体重，不可撤销。')) {
      DataManager.clearAllRecords();
      this.render();
    }
  }
} 

export default CalendarView;
