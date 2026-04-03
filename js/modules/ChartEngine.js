class ChartEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.dataPoints = [];
    this.options = {};
    this.hoveredIndex = -1;
    this._rafId = null;
  }

  drawChart(canvasElement, dataPoints, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.dataPoints = dataPoints;
    this.options = {
      width: options.width || canvasElement.parentElement.clientWidth,
      height: options.height || 220,
      padding: options.padding || { top: 28, right: 20, bottom: 32, left: 44 },
      colorTarget: options.colorTarget || '#9CA3AF',
      colorActual: options.colorActual || '#2C7A4D',
      showAll: options.showAll || false,
      ...options
    };

    const dpr = window.devicePixelRatio || 1;
    const w = this.options.width;
    const h = this.options.height;
    canvasElement.width = w * dpr;
    canvasElement.height = h * dpr;
    canvasElement.style.width = w + 'px';
    canvasElement.style.height = h + 'px';
    this.ctx.scale(dpr, dpr);

    this._render();

    canvasElement.onmousemove = (e) => this._handleHover(e);
    canvasElement.onmouseleave = () => this._handleLeave();
  }

  _render() {
    const ctx = this.ctx;
    const { width, height, padding } = this.options;
    const points = this.dataPoints;

    ctx.clearRect(0, 0, width, height);

    if (!points || points.length === 0) return;

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const allWeights = points.flatMap(p => [p.targetWeight, p.actualWeight]);
    let minW = Math.min(...allWeights);
    let maxW = Math.max(...allWeights);
    const range = maxW - minW || 2;
    const margin = Math.max(range * 0.12, 0.5);
    minW -= margin;
    maxW += margin;

    this._drawYAxis(ctx, minW, maxW, padding, chartH);
    this._drawXAxis(ctx, points, padding, chartW, chartH);

    const getX = (i) => padding.left + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
    const getY = (val) => padding.top + chartH - ((val - minW) / (maxW - minW)) * chartH;

    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    const targetLine = points.map((p, i) => ({ x: getX(i), y: getY(p.targetWeight) }));
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = this.options.colorTarget;
    ctx.beginPath();
    targetLine.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
    ctx.stroke();
    ctx.setLineDash([]);

    const actualLine = points.map((p, i) => ({ x: getX(i), y: getY(p.actualWeight) }));
    ctx.strokeStyle = this.options.colorActual;
    ctx.beginPath();
    actualLine.forEach((pt, i) => i === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
    ctx.stroke();

    points.forEach((p, i) => {
      const tx = getX(i);
      const ty = getY(p.targetWeight);
      ctx.beginPath();
      ctx.arc(tx, ty, 4, 0, Math.PI * 2);
      ctx.strokeStyle = this.options.colorTarget;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      const ax = getX(i);
      const ay = getY(p.actualWeight);
      ctx.beginPath();
      ctx.arc(ax, ay, 4, 0, Math.PI * 2);
      ctx.fillStyle = this.options.colorActual;
      ctx.fill();

      if (i === this.hoveredIndex) {
        ctx.beginPath();
        ctx.arc(ax, ay, 7, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(44,122,77,0.15)';
        ctx.fill();
      }
    });
  }

  _drawYAxis(ctx, minW, maxW, padding, chartH) {
    const steps = 5;
    const stepVal = (maxW - minW) / steps;
    ctx.font = '11px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#9CA3AF';

    for (let i = 0; i <= steps; i++) {
      const val = minW + stepVal * i;
      const y = padding.top + chartH - (i / steps) * chartH;
      ctx.fillText(val.toFixed(1), padding.left - 8, y);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + 3, y);
      ctx.strokeStyle = '#E5E5E0';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  _drawXAxis(ctx, points, padding, chartW, chartH) {
    const showEvery = points.length > 12 ? Math.ceil(points.length / 8) : 1;
    ctx.font = '11px -apple-system, "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#9CA3AF';

    points.forEach((p, i) => {
      if (i % showEvery === 0 || i === points.length - 1) {
        const x = padding.left + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
        const parts = p.date.split('-');
        ctx.fillText(`${parts[1]}/${parts[2]}`, x, padding.top + chartH + 10);
      }
    });
  }

  _handleHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const { padding } = this.options;
    const chartW = this.canvas.clientWidth - padding.left - padding.right;
    const points = this.dataPoints;
    if (!points || points.length === 0) return;

    let closest = -1;
    let minDist = Infinity;
    points.forEach((_, i) => {
      const px = padding.left + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
      const dist = Math.abs(mx - px);
      if (dist < minDist && dist < 30) {
        minDist = dist;
        closest = i;
      }
    });

    if (closest !== this.hoveredIndex) {
      this.hoveredIndex = closest;
      this._render();
      this._showTooltip(e, points[closest]);
    } else if (closest >= 0) {
      this._moveTooltip(e);
    }
  }

  _showTooltip(e, point) {
    this._removeTooltip();
    if (!point) return;
    const el = document.createElement('div');
    el.className = 'tooltip-popup';
    el.id = 'chartTooltip';
    el.innerHTML = `<strong>${point.date}</strong><br>目标: ${point.targetWeight}kg &nbsp; 实际: ${point.actualWeight}kg`;
    document.body.appendChild(el);
    this._positionTooltip(e, el);
  }

  _moveTooltip(e) {
    const el = document.getElementById('chartTooltip');
    if (el) this._positionTooltip(e, el);
  }

  _positionTooltip(e, el) {
    const rect = this.canvas.getBoundingClientRect();
    el.style.left = (e.clientX + 12) + 'px';
    el.style.top = (rect.top - 60) + 'px';
  }

  _handleLeave() {
    this.hoveredIndex = -1;
    this._render();
    this._removeTooltip();
  }

  _removeTooltip() {
    const el = document.getElementById('chartTooltip');
    if (el) el.remove();
  }

  debounceRedraw(delay = 150) {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(() => {
      setTimeout(() => {
        if (this.canvas && this.dataPoints) this.drawChart(this.canvas, this.dataPoints, this.options);
      }, delay);
    });
  }
}

export default new ChartEngine();
