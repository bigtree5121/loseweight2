import DataManager from '../modules/DataManager.js';
import ChartEngine from '../modules/ChartEngine.js';

class ChartView {
  constructor(container) {
    this.container = container;
    this.showAll = false;
  }

  render() {
    const dataPoints = DataManager.getValidChartData();

    if (dataPoints.length === 0) {
      this.container.innerHTML = `
        <div class="chart-container">
          <div class="chart-empty">
            <p>暂无实际体重数据</p>
            <p style="margin-top:8px;font-size:0.85rem;">请在日历中记录体重后查看曲线对比</p>
          </div>
        </div>`;
      return;
    }

    const displayData = this.showAll ? dataPoints : this._filterRecent(dataPoints, 30);

    this.container.innerHTML = `
      <div class="chart-container">
        <div class="chart-header">
          <h3>目标 vs 实际</h3>
          <div class="chart-range-toggle">
            <button class="${!this.showAll ? 'active' : ''}" id="chartRange30">最近30天</button>
            <button class="${this.showAll ? 'active' : ''}" id="chartRangeAll">全部</button>
          </div>
        </div>
        <div class="chart-canvas-wrapper">
          <canvas id="chartCanvas"></canvas>
        </div>
        <div class="chart-legend">
          <span><i class="legend-line target"></i> 目标体重</span>
          <span><i class="legend-line actual"></i> 实际体重</span>
        </div>
      </div>`;

    const canvas = this.container.querySelector('#chartCanvas');
    ChartEngine.drawChart(canvas, displayData, { showAll: this.showAll });

    this._bindToggleEvents(dataPoints);
  }

  _filterRecent(points, days) {
    if (points.length === 0) return [];
    const now = new Date();
    const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);
    return points.filter(p => {
      const [y, m, d] = p.date.split('-').map(Number);
      const pd = new Date(y, m - 1, d);
      return pd >= cutoff;
    });
  }

  _bindToggleEvents(allData) {
    const btn30 = this.container.querySelector('#chartRange30');
    const btnAll = this.container.querySelector('#chartRangeAll');

    if (btn30) {
      btn30.onclick = () => {
        this.showAll = false;
        this.render();
      };
    }
    if (btnAll) {
      btnAll.onclick = () => {
        this.showAll = true;
        this.render();
      };
    }
  }
}

export default ChartView;
