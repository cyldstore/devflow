# DevFlow

求职期前端开发者的**本地优先个人工作台**：把「今天做什么、在学什么、投到哪里、这周进展如何」收在一个应用里。

无后端、无账号、无云同步，所有数据保存在浏览器的 `localStorage` 中，可随时导出为 JSON 备份。

## 功能

- **概览**：今日聚焦、逾期提醒、本周学习目标、接下来（投递待办）、最近知识、久未备份提醒
- **任务**：今天/本周/全部筛选，分组列表，快速添加，完成与撤销，删除与 5 秒撤销，编辑抽屉
- **知识库**：笔记 / 面试题 / 代码片段三类，Markdown 详情渲染，编辑自动保存，置顶，删除二次确认，搜索，类型 / 掌握度 / 标签筛选
- **求职**：五阶段看板（收藏 → 已投递 → 面试中 → Offer → 已结束），拖拽与「移动到阶段」双入口，详情与时间线，渠道链接，下一步待办可完成/作废
- **复盘**：最近 7 / 30 天 KPI，学习投入与任务完成图表，投递分布，主题掌握度（薄弱优先）并跳转知识库
- **数据备份**：导出 / 导入 JSON，导入前确认与 10 秒撤销，未备份标记与提醒

## 技术栈

| 类别 | 选择 |
| --- | --- |
| 框架 | Vue 3.5（`<script setup>` + TypeScript）+ Vite 8 |
| 路由 | vue-router 4（History 模式） |
| 交互基础件 | Reka UI（Dialog / Drawer / Toast，按需引入） |
| 图标 | lucide-vue-next |
| Markdown | markdown-it + DOMPurify |
| 图表 | ECharts（按需注册 Bar / Line / Pie） |
| 样式 | 原生 CSS + CSS 变量，无 CSS 框架 |

## 本地开发

```bash
cd devflow
npm install
npm run dev        # http://localhost:5173
```

常用脚本：

```bash
npm run build      # vue-tsc -b && vite build
npm run preview    # 预览构建产物
npm run typecheck  # 类型检查
npm run lint       # ESLint
npm run format     # Prettier 写入
npm run format:check
```

## 数据与备份

- 主数据键：`devflow:db`（整库一个 JSON）
- 备份元信息：`devflow:backup-meta`（上次导出/修改时间、提醒开关，不随备份导出）
- 清除浏览器站点数据会**清空全部数据**，请定期在顶栏点击「导出」保存 JSON
- 导入会覆盖当前数据，导入前会展示数据量对比，并提供 10 秒撤销

## 目录结构

```
src/
├─ main.ts
├─ App.vue
├─ router/
├─ pages/            # 五个一级页面
├─ components/
│  ├─ layout/        # AppShell / Sidebar / Topbar / BottomNav / SettingsDialog / ImportBackup
│  └─ ui/            # Button / Card / Chip / Dialog / Drawer / Toast / BaseChart
├─ composables/
├─ stores/           # db / tasks / knowledge / applications / profile / backup / ui
├─ lib/              # storage / db / seed / backup / markdown / charts / insights / date ...
├─ styles/           # tokens.css / base.css / forms.css
└─ types/            # 实体类型定义
```

更完整的产品决策、交互规则与路线图见仓库根目录 `AGENTS.md`；设计交付物见 `design/`（只读参考，不参与构建）。

## 状态

C1–C7 已完成（工程底座、设计系统、数据层、任务、知识库、求职、复盘）。C8 打磨进行中：响应式与键盘走查、README、部署配置待完成。
