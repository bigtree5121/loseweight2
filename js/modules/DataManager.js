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
    if (!this.store.targets[dateStr]) return false;
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
      if (target && record && record.actualWeight != null) {
        result.push({
          date: dateStr,
          targetWeight: target.targetWeight,
          actualWeight: record.actualWeight
        });
      }
    }
    return result;
  }
}

export default new DataManager();
