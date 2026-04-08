const STORAGE_KEY = 'loseweight_store';

class DataManager {
  constructor() {
    this.store = { targets: {}, records: {} };
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.store = {
          targets: parsed.targets || {},
          records: parsed.records || {}
        };
      }
    } catch (e) {
      console.warn('DataManager: Failed to load data', e);
      this.store = { targets: {}, records: {} };
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
      this._emitChange();
    } catch (e) {
      console.error('DataManager: Failed to save data', e);
    }
  }

  _emitChange() {
    window.dispatchEvent(new CustomEvent('data-changed', { detail: this.store }));
  }

  getTarget(dateStr) {
    return this.store.targets[dateStr] || null;
  }

  setTarget(dateStr, weight) {
    if (weight == null || weight <= 0) return false;
    this.store.targets[dateStr] = { targetWeight: parseFloat(weight.toFixed(1)) };
    this.save();
    return true;
  }

  deleteTarget(dateStr) {
    if (this.store.targets[dateStr]) {
      delete this.store.targets[dateStr];
      delete this.store.records[dateStr];
      this.save();
      return true;
    }
    return false;
  }

  getRecord(dateStr) {
    return this.store.records[dateStr] || null;
  }

  setRecord(dateStr, record) {
    this.store.records[dateStr] = {
      actualWeight: record.actualWeight != null ? parseFloat(record.actualWeight.toFixed(1)) : null,
      exercise: record.exercise || null,
      diet: record.diet || null,
      skinCare: record.skinCare || null
    };
    this.save();
    return true;
  }

  deleteRecord(dateStr) {
    if (this.store.records[dateStr]) {
      delete this.store.records[dateStr];
      this.save();
      return true;
    }
    return false;
  }

  getAllTargetsSorted() {
    return Object.keys(this.store.targets)
      .sort()
      .map(dateStr => ({
        date: dateStr,
        ...this.store.targets[dateStr],
        record: this.store.records[dateStr] || null
      }));
  }

  getValidChartData() {
    const result = [];
    for (const dateStr of Object.keys(this.store.targets).sort()) {
      const target = this.store.targets[dateStr];
      const record = this.store.records[dateStr];
      result.push({
        date: dateStr,
        targetWeight: target.targetWeight,
        actualWeight: record && record.actualWeight != null ? record.actualWeight : null
      });
    }
    return result;
  }

  clearAllTargets() {
    this.store.targets = {};
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
      this._emitChange();
      return true;
    } catch (e) {
      console.error('DataManager: Failed to clear targets', e);
      return false;
    }
  }

  clearAllRecords() {
    this.store.records = {};
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
      this._emitChange();
      return true;
    } catch (e) {
      console.error('DataManager: Failed to clear records', e);
      return false;
    }
  }

  clearAllData() {
    this.store = { targets: {}, records: {} };
    try {
      localStorage.removeItem(STORAGE_KEY);
      this._emitChange();
      return true;
    } catch (e) {
      console.error('DataManager: Failed to clear data', e);
      return false;
    }
  }

  getAllRecordsSorted() {
    const allDates = new Set([...Object.keys(this.store.targets), ...Object.keys(this.store.records)]);
    return Array.from(allDates)
      .sort()
      .map(dateStr => ({
        date: dateStr,
        target: this.store.targets[dateStr] || null,
        record: this.store.records[dateStr] || null
      }));
  }
}

export default new DataManager();
