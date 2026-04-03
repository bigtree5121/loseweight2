# 技术设计文档（TDD）：轻记 · 极简体重记录工具

| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|----------|
| v1.0 | 2026-04-03 | 技术负责人 | 初始版本 |

## 1. 设计概述

### 1.1 文档目的
本文档描述“轻记”前端应用的技术架构、模块划分、数据流、关键算法及实现约束，用于指导开发人员实现 PRD v1.1 中的所有功能。

### 1.2 技术范围
- 纯前端单页应用（SPA），无后端服务。
- 数据持久化采用浏览器 `localStorage`。
- 零外部依赖（自绘图表、原生 DOM 操作），保证体积轻量和离线可用。

### 1.3 设计原则
- **极简优先**：不引入任何框架（React/Vue/Angular），仅使用原生 HTML/CSS/JS（ES6）。
- **模块化解耦**：将日历、图表、弹窗、存储等逻辑封装为独立模块。
- **响应式设计**：移动优先，桌面自适应。
- **可测试性**：核心逻辑（日期处理、数据筛选、图表坐标计算）应易于单元测试。

## 2. 整体架构

### 2.1 架构图（文字描述）
┌─────────────────────────────────────────────┐
│ UI 层（DOM） │
│ ┌─────────┐ ┌─────────┐ ┌───────────────┐ │
│ │ 日历视图 │ │ 列表视图 │ │ 曲线图视图 │ │
│ └────┬────┘ └────┬────┘ └───────┬───────┘ │
│ │ │ │ │
│ ▼ ▼ ▼ │
│ ┌──────────────────────────────────────┐ │
│ │ 事件总线 / 观察者模式 │ │
│ └────────────────┬─────────────────────┘ │
│ ▼ │
│ ┌──────────────────────────────────────┐ │
│ │ 业务逻辑层（模块） │ │
│ │ • DataManager (存储读写) │ │
│ │ • CalendarEngine (日期计算) │ │
│ │ • ChartEngine (曲线绘制) │ │
│ │ • ModalManager (弹窗控制) │ │
│ └────────────────┬─────────────────────┘ │
│ ▼ │
│ ┌──────────────────────────────────────┐ │
│ │ localStorage 持久化层 │ │
│ └──────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

### 2.2 数据流
1. 页面加载 → `DataManager` 读取 `localStorage` → 初始化全局 `store`（包含 targets 和 records）。
2. 用户操作（点击日期、保存表单）→ 触发对应模块 → 调用 `DataManager` 更新 `store` 并写回 `localStorage` → 发布“数据变更”事件。
3. 视图模块（日历、列表、曲线图）订阅“数据变更”事件 → 重新渲染自身。

## 3. 技术选型

| 类型         | 选型                        | 理由                                       |
|--------------|-----------------------------|--------------------------------------------|
| 语言         | JavaScript (ES6+)           | 原生支持，无需编译。                         |
| 样式         | CSS3 (Flex/Grid)            | 实现响应式布局，无预处理器。                 |
| 图表绘制     | Canvas 2D API 自绘           | 零依赖，可控性好，体积小。                  |
| 日期处理     | 原生 `Date` 对象 + 辅助函数   | 无需引入 moment.js，减少体积。              |
| 模块化       | IIFE / ES6 模块（使用 `<script type="module">`） | 现代浏览器支持，避免全局污染。 |
| 构建工具     | 无（直接编写 HTML/CSS/JS）    | 符合极简原则，无需打包。                    |

## 4. 模块设计

### 4.1 DataManager（数据管理层）
**职责**：统一读写 `localStorage`，维护内存中的 `store`，提供数据查询接口。

**接口**：
- `loadData()`：从 localStorage 加载，返回 `{ targets, records }`。
- `saveData(data)`：保存数据到 localStorage。
- `getTarget(date)`：获取某日目标体重。
- `setTarget(date, weight)`：设置目标，返回是否成功。
- `deleteTarget(date)`：删除目标（同时删除对应实际记录）。
- `getRecord(date)`：获取某日实际记录。
- `setRecord(date, record)`：设置实际记录（合并字段）。
- `deleteRecord(date)`：清空某日实际记录。
- `getAllTargetsSorted()`：返回按日期升序的所有目标。
- `getValidChartData()`：返回可用于绘图的 `[{ date, targetWeight, actualWeight }]`（仅包含既有目标又有实际体重的日期）。

**实现要点**：
- 使用 `try-catch` 处理 `localStorage` 异常。
- 数据变更后触发自定义事件 `"data-changed"`。

### 4.2 CalendarEngine（日历引擎）
**职责**：计算某月的天数、起始星期，生成日历格子的数据模型。

**接口**：
- `getMonthDays(year, month)`：返回当月天数。
- `getMonthStartWeekday(year, month)`：返回当月第一天是周几（0=周日，6=周六，可配置周一为起始）。
- `buildCalendarGrid(year, month, firstDayOfWeek = 1)`：返回一个二维数组，每个元素包含 `{ date: Date, isCurrentMonth: bool }`。

**实现要点**：
- 不依赖任何第三方库，纯原生 `Date` 计算。
- 注意处理时区问题：统一使用 `new Date(year, month, 1)` 避免 UTC 偏移。

### 4.3 ChartEngine（曲线图绘制引擎）
**职责**：在 Canvas 上绘制目标与实际体重的折线图。

**接口**：
- `drawChart(canvasElement, dataPoints, options)`：
  - `dataPoints`：`[{ date, targetWeight, actualWeight }]` 数组，按日期升序。
  - `options`：包含 `width`, `height`, `padding`, `colorTarget`, `colorActual`, `showAll` 等。

**内部算法**：
1. 计算纵轴范围：`minWeight = min(all weights) - margin`, `maxWeight = max(all weights) + margin`，margin 取范围的 10%。
2. 横轴映射：每个数据点等间距分布（按索引，不按实际时间间隔，因用户可能不连续）。
3. 绘制坐标轴（细线）、刻度标签、网格线（可选，极简风格可省略网格）。
4. 绘制两条折线：
   - 目标：虚线（`setLineDash([5, 5])`），灰色。
   - 实际：实线，绿色。
5. 绘制数据点圆形标记，并绑定 `tooltip`（通过 `canvas` 的 `mousemove` 事件进行 hit test）。

**性能**：仅在数据变化或窗口 `resize` 时重绘，使用 `requestAnimationFrame` 防抖。

### 4.4 ModalManager（弹窗管理器）
**职责**：创建、显示、销毁模态框，处理表单提交。

**接口**：
- `showTargetModal(date, existingWeight)`：显示目标体重编辑弹窗。
- `showRecordModal(date, targetWeight, existingRecord)`：显示实际记录弹窗（含四个字段）。
- `closeModal()`：关闭当前弹窗。

**实现**：
- 动态创建遮罩和卡片 DOM，插入 `body`，关闭时移除。
- 表单数据校验（目标体重为正数，实际体重可为空或正数）。
- 保存时调用 `DataManager` 对应方法，关闭弹窗后触发视图刷新。

### 4.5 Views（视图模块）
#### 4.5.1 CalendarView
- 根据当前 `year`/`month` 渲染日历表格。
- 从 `DataManager` 获取每个日期的目标体重和是否有实际记录。
- 绑定日期单元格点击事件。
- 提供切换月份、回到今天的控件。

#### 4.5.2 ListView
- 渲染所有已设定目标的日期列表（倒序）。
- 每行显示日期、目标体重、实际体重（若无则显示“未记录”）、运动/饮食/护肤摘要。
- 点击行弹出对应的实际记录弹窗。

#### 4.5.3 ChartView
- 持有 `<canvas>` 元素，监听 `data-changed` 和 `window resize`。
- 调用 `ChartEngine.drawChart()` 更新图表。
- 提供“最近30天/全部”切换按钮，控制传递给 `drawChart` 的数据子集。

## 5. 数据模型详解

### 5.1 存储结构
沿用 PRD 中的 JSON 格式：

```typescript
interface Store {
  targets: Record<string, { targetWeight: number }>;
  records: Record<string, {
    actualWeight?: number | null;
    exercise?: string | null;
    diet?: string | null;
    skinCare?: string | null;
  }>;
}