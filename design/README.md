# DevFlow · 产品设计交付

技术栈锁定：**Vue 3 + TypeScript + Vite**。本目录只包含设计物料，不含业务代码。

## 已定稿的产品决策

| 项 | 决策 |
|---|---|
| 学习计划 | 不单独设模块。任务增加“学习”分类，概览展示本周目标，复盘统计学习投入。 |
| 知识库 | 合并为一个知识库，内含笔记、面试题、代码片段三种类型，共用主题、标签、掌握度。 |
| 首版范围 | 5 个一级页面：概览、任务、知识库、求职、复盘。复盘为只读聚合页。 |
| 后续范围 | 全局搜索 / 命令面板、12 周热力图、AI 学习助手。 |
| 明确不做 | 登录、多用户、云同步、通知、独立学习计划页、独立面试题库、富文本编辑器。 |
| 数据策略 | 第一版本地优先，使用 localStorage；提供 JSON 导出 / 导入。 |
| 首次进入 | 3 步引导：称呼、目标岗位、每周学习目标；可选“载入示例数据”或“从空白开始”。 |

## 文件

```
design/
├─ index.html          # 设计图索引 / 画廊
├─ prototype.html      # 可点击静态原型（用顶部导航切换页面）
├─ styles.css          # 原型的全部样式
├─ exports/            # 导出的 PNG 设计图
│  ├─ 01-overview.png
│  ├─ 02-tasks.png
│  ├─ 03-knowledge.png
│  ├─ 04-jobs.png
│  ├─ 05-insights.png
│  └─ 06-states.png
└─ README.md
```

打开 `design/index.html` 浏览全部设计图；打开 `design/prototype.html` 可按顶部导航点击切换页面。

> 原型 HTML/CSS 仅用于设计评审，不接入 Vue，不写入 `src/`，不复用为业务组件。

## 页面与路由

| 页面 | 路由 | 主要任务 |
|---|---|---|
| 概览 | `/` | 今日聚焦、逾期提醒、本周学习目标、下一步投递、最近知识 |
| 任务 | `/tasks` | 今天 / 本周 / 全部、分组、筛选、快速添加、编辑抽屉 |
| 知识库 | `/knowledge` | 类型筛选、搜索、标签/主题/掌握度、阅读与编辑、自动保存 |
| 求职 | `/jobs` | 五阶段看板、添加投递、详情抽屉、阶段变更、跟进时间线 |
| 复盘 | `/insights` | KPI、学习投入、主题掌握度、求职漏斗、学习记录 |

设置使用全局弹窗，不作为一级路由。

## 核心交互规则

### 全局

- 桌面端左侧 236px 固定导航；移动端底部四项导航。
- 顶部常驻搜索框、主题切换、快速新建。
- 快速新建菜单包含：任务、笔记、面试题、学习记录、投递。
- 所有弹窗 / 抽屉：`Esc` 关闭，焦点锁定，关闭后焦点回到触发元素。
- 破坏性操作：任务删除用 5 秒撤销；知识、投递、清空数据必须二次确认。
- 拖拽改变投递阶段时，必须同时提供“移动到阶段”菜单，保证键盘与触屏可用。
- 本地保存状态：`正在保存` / `已保存` / `保存失败`。失败时保留内存中的修改，并提供重试与导出。

### 任务

- 快速添加：输入标题回车创建，默认日期为今天。
- 分组顺序：今天 → 本周稍后 → 以后 → 已完成（折叠）。
- 完成任务后出现“撤销”和“记录学习”两个动作。
- 逾期任务不得被今日任务掩盖；概览与任务页都有独立提醒。
- 筛选无结果时展示“清除筛选”，不出现空白页。

### 知识库

- 桌面端左右分栏；移动端列表 → 全屏详情。
- 新建先选类型，进入对应模板：
  - 笔记：标题、正文、标签、主题、掌握度。
  - 面试题：题目、我的答案、参考答案、追问、主题、掌握度。
  - 代码片段：标题、语言、代码、说明、标签。
- 保存时主题必填；掌握度可留空，留空不参与薄弱点分析。
- 编辑自动保存，离开页面前如有未保存内容必须拦截。
- 删除需要二次确认；搜索无结果保留关键词与清除入口。

### 求职

- 五列：收藏、已投递、面试中、Offer、已结束。
- 卡片必须包含：公司、岗位、下一步动作、下一步日期、优先级。
- 阶段变更自动写入时间线；时间线类型：阶段变更、面试、跟进、备注。
- 逾期跟进同时在高亮卡片和概览“接下来”中出现。
- 移动端不使用横向五列，改为阶段 Tab + 单列卡片。

### 复盘

- 时间范围：最近 7 天 / 最近 30 天。
- 指标：完成任务、学习时长、投递、面试。
- 主题掌握度“薄弱优先”，点击主题跳转知识库并自动筛选。
- 数据不足时不渲染空图表，改为“记录第一次学习”的引导。
- 记录学习后当前页数据即时刷新。

## 数据实体

```ts
type TaskCategory = 'learning' | 'job' | 'project' | 'life'
type Priority = 'P0' | 'P1' | 'P2'
type KnowledgeType = 'note' | 'question' | 'snippet'
type Mastery = 'rusty' | 'learning' | 'solid'

interface Task {
  id: string
  title: string
  note?: string
  date: string            // YYYY-MM-DD
  category: TaskCategory
  priority: Priority
  estimateMin?: number
  done: boolean
  completedAt?: string
  createdAt: string
  updatedAt: string
}

interface KnowledgeItem {
  id: string
  type: KnowledgeType
  title: string
  content: string         // Markdown
  topic: string
  tags: string[]
  mastery?: Mastery
  pinned: boolean
  createdAt: string
  updatedAt: string
}

type JobStage = 'saved' | 'applied' | 'interview' | 'offer' | 'closed'

interface Application {
  id: string
  company: string
  role: string
  city?: string
  salary?: string
  channel?: string
  stage: JobStage
  priority: Priority
  appliedAt?: string
  nextAction?: { label: string; date: string }
  note?: string
  timeline: TimelineEvent[]
  createdAt: string
  updatedAt: string
}

interface TimelineEvent {
  id: string
  type: 'stage' | 'interview' | 'followup' | 'note'
  text: string
  date: string
}

interface StudyLog {
  id: string
  date: string
  minutes: number
  topic: string
  activity: 'reading' | 'coding' | 'practice' | 'project'
  takeaway?: string
  knowledgeId?: string
}

interface Profile {
  name: string
  targetRole: string
  weeklyGoalHours: number
  theme: 'light' | 'dark' | 'system'
  onboardingDone: boolean
}
```

## 视觉 token

```css
--canvas: #f2f0e9;
--panel: #fbfaf6;
--ink: #171a16;
--muted: #73786d;
--line: #deddd4;
--sidebar: #141713;
--lime: #c8f56a;
--coral: #e85d3a;

/* type */
--font-sans: "Segoe UI Variable Display", "Segoe UI", "Microsoft YaHei UI", sans-serif;
--font-mono: "Cascadia Code", "Cascadia Mono", Consolas, monospace;

/* shape */
card-radius: 15px;
control-radius: 9px;
page-gutter: 34px;
```

响应式：

- `>= 1024px`：完整侧边栏 + 双栏 / 三栏布局。
- `768px – 1023px`：紧凑侧边栏，任务与知识库收为单栏。
- `< 768px`：底部导航，页面单栏，编辑抽屉全屏，任务列表使用悬浮新建按钮。

## 给代码阶段的建议顺序

1. **C1 工程底座**：Vite + Vue + TS、ESLint、Prettier、路由、App Shell。
2. **C2 设计系统**：CSS token、基础组件（Button、Card、Chip、Dialog、Drawer、Toast）。
3. **C3 数据层**：类型、localStorage repository、seed、导出/导入。
4. **C4 任务模块**：列表、快速添加、编辑、完成、撤销、筛选。
5. **C5 知识库**：列表 + 详情 + Markdown + 自动保存。
6. **C6 求职**：看板、详情、时间线、阶段变更。
7. **C7 复盘**：聚合数据、图表、空状态。
8. **C8 打磨**：响应式、键盘、错误态、测试、部署。

## 当前状态

设计阶段已完成，等待产品负责人确认。确认前不生成 Vue 业务代码。
