class CalendarEngine {
  getMonthDays(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  getMonthStartWeekday(year, month, firstDayOfWeek = 1) {
    const day = new Date(year, month, 1).getDay();
    return (day - firstDayOfWeek + 7) % 7;
  }

  buildCalendarGrid(year, month, firstDayOfWeek = 1) {
    const daysInMonth = this.getMonthDays(year, month);
    const startOffset = this.getMonthStartWeekday(year, month, firstDayOfWeek);
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthDays = this.getMonthDays(prevYear, prevMonth);

    const grid = [];
    let row = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      row.push({ date: new Date(prevYear, prevMonth, prevMonthDays - i), isCurrentMonth: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      row.push({ date: new Date(year, month, d), isCurrentMonth: true });
      if (row.length === 7) {
        grid.push(row);
        row = [];
      }
    }

    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    let nextDay = 1;
    while (row.length > 0 && row.length < 7) {
      row.push({ date: new Date(nextYear, nextMonth, nextDay++), isCurrentMonth: false });
      if (row.length === 7) grid.push(row);
    }

    return grid;
  }

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  formatDisplayDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(m)}月${parseInt(d)}日`;
  }

  getWeekLabels(firstDayOfWeek = 1) {
    const labels = ['日', '一', '二', '三', '四', '五', '六'];
    if (firstDayOfWeek === 1) {
      return ['一', '二', '三', '四', '五', '六', '日'];
    }
    return labels;
  }

  isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }
}

export default new CalendarEngine();
