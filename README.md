# Lumina - 治愈系个人目标与进度管理 App

## 项目介绍

Lumina 是一款治愈系个人目标与进度管理应用，采用手帐风格设计，帮助用户建立积极的生活习惯，记录成长轨迹，减轻目标焦虑。

## 技术栈

### 后端
- Node.js
- Hono.js (TypeScript)
- SQLite (better-sqlite3)

### 前端
- uniapp (Vue3 + Vite)
- uni-ui
- ucharts
- SVG 动画

## 项目结构

```
/workspace
├── backend/              # 后端项目
│   ├── src/
│   │   ├── index.ts      # 主入口文件
│   │   ├── db.ts         # 数据库管理
│   │   ├── types.ts      # 类型定义
│   │   └── middleware.ts # 认证中间件
│   ├── data/             # 数据库文件目录
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/             # 前端项目 (待创建)
└── project.md           # 原始项目需求文档
```

## 快速开始

### 后端启动

1. 进入后端目录:
   ```bash
   cd backend
   ```

2. 安装依赖:
   ```bash
   npm install
   ```

3. 启动开发服务器:
   ```bash
   npm run dev
   ```

后端服务将在 `http://localhost:3000` 启动。

### API 认证

所有 API 请求都需要在请求头中携带认证 Token:
```
Authorization: Bearer my_secure_token_2026
```

## API 接口

### 目标管理
- `GET /goals` - 获取所有目标
- `POST /goals` - 创建新目标
- `PUT /goals/:id` - 更新目标
- `DELETE /goals/:id` - 删除目标

### 记录管理
- `GET /goals/:id/records` - 获取目标的所有记录
- `POST /records` - 创建打卡记录
- `DELETE /records/:id` - 删除记录并回滚

### 里程碑
- `GET /goals/:id/milestones` - 获取目标的里程碑

### 数据导出
- `GET /export` - 导出所有数据为 JSON 文件
