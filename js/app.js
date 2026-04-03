import DataManager from './modules/DataManager.js';
import CalendarView from './views/CalendarView.js';
import ListView from './views/ListView.js';
import ChartView from './views/ChartView.js';

const VIEWS = ['calendar', 'list', 'chart'];
let currentView = 'calendar';
let views = {};

function initApp() {
  views = {
    calendar: new CalendarView(document.getElementById('calendarView')),
    list: new ListView(document.getElementById('listView')),
    chart: new ChartView(document.getElementById('chartView'))
  };

  _setupRouting();
  _switchView(currentView);
  window.addEventListener('data-changed', _onDataChanged);
  window.addEventListener('resize', _debounce(_onResize, 250));
}

function _setupRouting() {
  const tabs = document.querySelectorAll('#viewTabs .tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view && view !== currentView) {
        _switchView(view);
      }
    });
  });
}

function _switchView(viewName) {
  currentView = viewName;

  document.querySelectorAll('#viewTabs .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });

  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.remove('active');
  });

  const targetSection = document.getElementById(`${viewName}View`);
  if (targetSection) targetSection.classList.add('active');

  if (views[viewName]) views[viewName].render();
}

function _onDataChanged() {
  Object.values(views).forEach(v => v.render());
}

function _onResize() {
  if (currentView === 'chart' && views.chart) {
    views.chart.render();
  }
}

function _debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

document.addEventListener('DOMContentLoaded', initApp);
