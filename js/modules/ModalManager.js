import DataManager from './DataManager.js';
import CalendarEngine from './CalendarEngine.js';

class ModalManager {
  constructor() {
    this.currentOverlay = null;
  }

  showTargetModal(dateStr, existingWeight) {
    const displayDate = CalendarEngine.formatDisplayDate(dateStr);
    const weightValue = existingWeight != null ? existingWeight : '';

    const html = `
      <div class="modal-overlay" id="modalOverlay">
        <div class="modal-card">
          <div class="modal-handle"></div>
          <h2 class="modal-title">设定目标体重</h2>
          <p class="modal-date">${displayDate}</p>
          <div class="form-group">
            <label>目标体重（kg）</label>
            <input type="number" id="targetInput" value="${weightValue}" placeholder="例如：60.0" step="0.1" min="20" max="300">
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" id="modalCancel">取消</button>
            <button class="btn btn-primary" id="modalSave">保存目标</button>
          </div>
        </div>
      </div>`;

    this._createModal(html, () => {
      const input = document.getElementById('targetInput');
      input.focus();

      document.getElementById('modalSave').onclick = () => {
        const val = parseFloat(input.value);
        if (isNaN(val) || val <= 0) {
          input.style.borderColor = '#DC2626';
          return;
        }
        DataManager.setTarget(dateStr, val);
        this.closeModal();
      };

      document.getElementById('modalCancel').onclick = () => this.closeModal();
    });
  }

  showRecordModal(dateStr, targetWeight, existingRecord) {
    const displayDate = CalendarEngine.formatDisplayDate(dateStr);
    const rec = existingRecord || {};
    const hasExisting = existingRecord && (
      rec.actualWeight != null ||
      (rec.exercise && rec.exercise.trim()) ||
      (rec.diet && rec.diet.trim()) ||
      (rec.skinCare && rec.skinCare.trim())
    );

    const targetText = targetWeight != null ? `<strong id="targetWeightDisplay">${targetWeight}kg</strong> <button class="btn-link" id="editTargetBtn">修改</button>` : '未设置';

    const html = `
      <div class="modal-overlay" id="modalOverlay">
        <div class="modal-card">
          <div class="modal-handle"></div>
          <h2 class="modal-title">记录实际数据</h2>
          <p class="modal-date">${displayDate} · 目标：${targetText}</p>
          <div class="form-group">
            <label>实际体重（kg）</label>
            <input type="number" id="actualInput" value="${rec.actualWeight != null ? rec.actualWeight : ''}" placeholder="留空表示未称重" step="0.1" min="20" max="300">
          </div>
          <div class="form-group">
            <label>运动情况</label>
            <textarea id="exerciseInput" placeholder="今天运动了吗？" maxlength="100">${rec.exercise || ''}</textarea>
          </div>
          <div class="form-group">
            <label>饮食情况</label>
            <textarea id="dietInput" placeholder="今天的饮食..." maxlength="100">${rec.diet || ''}</textarea>
          </div>
          <div class="form-group">
            <label>护肤情况</label>
            <textarea id="skinCareInput" placeholder="护肤记录..." maxlength="100">${rec.skinCare || ''}</textarea>
          </div>
          <div class="form-actions">
            ${hasExisting ? '<button class="btn btn-danger" id="modalClear">清空记录</button>' : ''}
            <button class="btn btn-secondary" id="modalCancel">取消</button>
            <button class="btn btn-primary" id="modalSave">保存记录</button>
          </div>
        </div>
      </div>`;

    this._createModal(html, () => {
      document.getElementById('modalSave').onclick = () => {
        const actualVal = document.getElementById('actualInput').value;
        DataManager.setRecord(dateStr, {
          actualWeight: actualVal !== '' ? parseFloat(actualVal) : null,
          exercise: document.getElementById('exerciseInput').value.trim(),
          diet: document.getElementById('dietInput').value.trim(),
          skinCare: document.getElementById('skinCareInput').value.trim()
        });
        this.closeModal();
      };

      document.getElementById('modalCancel').onclick = () => this.closeModal();

      const editTargetBtn = document.getElementById('editTargetBtn');
      if (editTargetBtn) {
        editTargetBtn.onclick = () => {
          this.closeModal();
          setTimeout(() => {
            this.showTargetModal(dateStr, targetWeight);
          }, 50);
        };
      }

      const clearBtn = document.getElementById('modalClear');
      if (clearBtn) {
        clearBtn.onclick = () => {
          if (confirm('确定要清空当天的所有记录吗？')) {
            DataManager.deleteRecord(dateStr);
            this.closeModal();
          }
        };
      }
    });
  }

  showDeleteTargetConfirm(dateStr, callback) {
    const displayDate = CalendarEngine.formatDisplayDate(dateStr);
    const html = `
      <div class="modal-overlay" id="modalOverlay">
        <div class="modal-card">
          <div class="modal-handle"></div>
          <h2 class="modal-title">删除目标</h2>
          <p class="modal-date" style="margin-bottom:24px;">确定要删除 <strong>${displayDate}</strong> 的目标体重及所有记录吗？此操作不可撤销。</p>
          <div class="form-actions">
            <button class="btn btn-secondary" id="modalCancel">取消</button>
            <button class="btn btn-danger" id="modalConfirm">确认删除</button>
          </div>
        </div>
      </div>`;

    this._createModal(html, () => {
      document.getElementById('modalConfirm').onclick = () => {
        DataManager.deleteTarget(dateStr);
        if (callback) callback();
        this.closeModal();
      };
      document.getElementById('modalCancel').onclick = () => this.closeModal();
    });
  }

  _createModal(html, onReady) {
    this.closeModal();
    document.body.insertAdjacentHTML('beforeend', html);
    this.currentOverlay = document.getElementById('modalOverlay');

    this.currentOverlay.addEventListener('click', (e) => {
      if (e.target === this.currentOverlay) this.closeModal();
    });

    if (onReady) onReady();
  }

  closeModal() {
    if (this.currentOverlay) {
      this.currentOverlay.remove();
      this.currentOverlay = null;
    }
  }
}

export default new ModalManager();
