# 治愈系个人目标与进度管理 App（Lumina） 开发计划书 (终极完整版 + UI UX Pro Max 增强)

**技术栈概览**
* **后端**：Node.js + Hono.js (TypeScript) + SQLite (better-sqlite3)
* **前端**：uniapp (Vue3 + Vite) + uni-ui (深度定制) + ucharts + Lottie/SVG 动画
* **UI 风格**：莫兰迪色系、治愈手帐风、大圆角无边框、弱化数值焦虑

---

## 阶段一：后端工程 (Hono.js + SQLite)

### 任务 1：基础框架与固定 Token 鉴权
**给 AI 的指令：**
> 请帮我初始化一个 Hono.js (TypeScript) 项目。
> 1. 环境：Node.js。
> 2. 功能：实现一个全局中间件，检查请求头的 `Authorization` 是否为 `Bearer my_secure_token_2026`（Token 从 `.env` 读取）。
> 3. 错误处理：鉴权失败返回 401，并附带 JSON 错误信息。

### 任务 2：SQLite 数据库设计与 Mock 数据
**给 AI 的指令：**
> 在 Hono 项目中引入 `better-sqlite3`。
> 1. 创建 `goals` 表：`id` (PK), `title`, `type` (ENUM: 'accumulation', 'cycle', 'trend'), `target_value` (REAL), `current_value` (REAL), `unit` (TEXT), `status` (TEXT, 默认 'active'), `created_at`。
> 2. 创建 `records` 表：`id` (PK), `goal_id` (FK), `change_value` (REAL), `note` (TEXT), `reflection` (TEXT, 用于记录复盘感悟与碎碎念), `created_at`。
> 3. 初始化 Mock 数据：
>    - 目标1：‘攒钱大计’，累积型，目标 300000，当前 50000，单位‘元’。
>    - 目标2：‘身体管理’，趋势型，目标 60，当前 70，单位‘kg’。

### 任务 3：核心 API 接口与事务回滚
**给 AI 的指令：**
> 编写以下 Hono API 接口，要求全部返回 JSON 格式：
> 1. `GET /goals`：返回所有目标及其进度（支持 `?status=active` 过滤）。
> 2. `POST /records`：提交记录。**逻辑要求**：接收 `change_value` 和可选的 `reflection`。使用事务更新 `goals` 表。若更新后达到 `target_value`，自动将 `status` 更新为 'completed'。
> 3. `DELETE /records/:id`：**容错撤销机制**。使用事务删除记录并反向扣除（或恢复）`change_value`。
> 4. `PUT /goals/:id` & `DELETE /goals/:id`：编辑目标基础信息 / 级联删除目标。

### 任务 4：数据安全与本地备份
**给 AI 的指令：**
> 编写一个数据导出接口：
> 1. `GET /export`：读取 `goals`、`records` 和 `milestones` 表的所有数据。
> 2. 将三张表数据组装成一个 JSON 对象，并作为文件流返回。

---

## 阶段二：前端基础与核心 UI (uniapp) 

### 🌟 必读前置：全局设计与 AI 唤醒指令
*建议：在让 AI 开始写任何前端代码前，先发送这段指令，为其注入设计师大脑。*
**给 AI 的指令：**
> **【系统级设计指令】**在接下来的所有前端开发中，请你激活并严格遵循 **'UI UX Pro Max - Design Intelligence'** 的设计规范体系。具体配置如下：
> 1. **Tech Stack**：Vue 3 (Composition API) + uniapp。
> 2. **UI Style**：融合 **Minimalism (极简)** 与 **Glassmorphism (毛玻璃)**。彻底摒弃原生组件的生硬感，全局使用大圆角（24px），去除 1px 实线边框，改用基于不同 z-index 的 Soft Shadow (柔和阴影) 区分层级。
> 3. **Color Palette**：采用 Wellness / Journal 低饱和度莫兰迪色板。请全局统一定义 Design Token，包含 Background (#F9F8F4 燕麦色)、Primary (#8F9C82 鼠尾草绿) 及不同层级的 Text 颜色。
> 4. **UX Guidelines**：在状态变更、页面切换时，严格遵循你的动效规范，添加平滑的 CSS transition (如 `ease-in-out` 300ms)。产出的代码必须达到 Production Ready 的设计美学标准。

### 任务 5：项目初始化与全局网络层
**给 AI 的指令：**
> 遵循上述 UI UX Pro Max 规范，初始化 uniapp (Vue3 + Vite) 项目。
> 1. 将设计规范中的色彩配置为全局 CSS 变量。
> 2. 封装 `request.ts`：自动注入 Bearer Token，BaseURL 指向本地 Hono。
> 3. 引入 `uni-ui` 并对其进行样式覆盖，确保其符合我们设定的柔和无边框美学。

### 任务 6：核心组件：魔法光球（SVG 动画）
**给 AI 的指令：**
> 结合 UI UX Pro Max 数据库中的 **Glassmorphism** 规范，编写 `MagicOrb.vue` 进度组件。
> 1. 使用 SVG 和 CSS 滤镜（`backdrop-filter`）实现完美的毛玻璃半透明圆球，内部两层波浪代表进度。波浪动画需使用 CSS keyframes 保证平滑起伏。
> 2. **逆向算法**：如果是‘越小越好’的目标（如 70kg -> 60kg），自动将进度转化为 `0% -> 100%` 正向百分比。
> 3. **情绪彩蛋**：进度达 50% 和 100% 时，边缘触发小猫 SVG 动画（名叫 Gody）。

### 任务 7 & 8：首页看板与“新建目标”页面
**给 AI 的指令：**
> 1. **首页 (`pages/index/index.vue`)**：卡片布局展示进行中目标。右上角放“个人主页”入口。
> 2. **新建页 (`pages/create/create.vue`)**：采用‘手帐填空题’ UI 设计：“我想要在未来完成 \_\_\_\_，总共需要 \_\_\_\_ (数值) \_\_\_\_ (单位)”。确保输入框没有原生边框，仅有底部柔和下划线或轻微背景色。

---

## 阶段三：精细化交互与生命周期

### 任务 9：详情页、深度打卡与图表复盘
**给 AI 的指令：**
> 编写目标详情页 (`pages/detail/detail.vue`)。
> 1. **充能打卡区**：展示 `MagicOrb`。包含输入框、**‘今日碎碎念’(reflection) 多行文本框**和‘注入能量’按钮。
> 2. **历史轨迹**：下半部分展示历史记录，**需将 reflection 文本以手写体/斜体风格展示在打卡数值下方**。支持左滑撤销。
> 3. **右上角菜单**：包含【编辑】和【放弃/删除】选项。
> 4. **趋势折线图**：若是趋势型目标，引入 `ucharts` 绘制极简折线图，线条颜色需调用我们全局的 Primary Color。

---

## 阶段四：阶段性里程碑机制（情绪正反馈）

### 任务 10 & 11：后端与前端里程碑配置
**给 AI 的指令：**
> 1. **后端**：新建 `milestones` 表。修改 `POST /records`，若当前进度越过未达成里程碑，将该节点 `is_reached` 设为 true，并返回 `unlocked_milestone`。
> 2. **前端新建页**：增加‘+ 添加沿途风景’折叠面板，动态添加多个节点（数值 + 奖励文案）。

### 任务 12：详情页“心愿地图”与解锁特效
**给 AI 的指令：**
> 详情页 `MagicOrb` 下方新增横向滚动‘节点路线图’。未到达显灰色虚线；已到达点亮为鼠尾草绿。提交记录后若触发里程碑，屏幕中央弹出 Lottie 庆祝弹窗并显示奖励文案。

---

## 阶段五：全局设置与荣誉归档

### 任务 13 & 14：个人主页与荣誉墙
**给 AI 的指令：**
> 创建 `pages/profile/profile.vue`。
> 1. **荣誉墙**：调用 `GET /goals?status=completed`，将 100% 达成的目标以高亮勋章/满级光球形式陈列。
> 2. **数据备份**：点击“导出我的日记”按钮，请求后端 `GET /export` 并保存 JSON 到本地。

---

## 阶段六：进阶数据可视化与情绪呈现（深度完善）

### 任务 15：习惯连续性热力图 (Heatmap)
**给 AI 的指令：**
> 详情页历史记录上方增加‘年度能量分布图’组件。
> 1. 模仿 GitHub 贡献墙逻辑，用 SVG 绘制日历格子。
> 2. 颜色根据当天 `change_value` 大小，显示不同深浅的莫兰迪绿。无记录显示为浅燕麦色。

### 任务 16：手帐风分享海报生成 (Canvas)
**给 AI 的指令：**
> 在详情页右上角菜单增加“生成手帐海报”功能。
> 1. 严格使用 UI UX Pro Max 的美学排版规范，使用 uniapp `canvas` 获取当前目标的魔法光球截图、标题、‘已坚持 XX 天’、当前进度及最近复盘笔记。
> 2. 绘制成具有莫兰迪手帐背景的分享海报。支持 `uni.saveImageToPhotosAlbum` 保存到手机相册。