# 药品储藏仓库管理系统

一个前后端分离的药品管理系统，支持药品信息管理、过期提醒、入库出库记录、统计报表和扫码录入功能。

## 功能特性

- 药品信息管理（增删改查）
- 条形码/二维码扫描录入
- 入库/出库管理
- 过期提醒（系统通知 + 微信推送）
- 库存预警
- 统计报表与可视化图表
- 多用户支持与权限管理

## 技术栈

### 前端
- React 18 + TypeScript + Vite
- Ant Design
- React Router
- Zustand (状态管理)
- ECharts (图表)
- html5-qrcode (扫码)

### 后端
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL
- JWT 认证
- node-cron (定时任务)

## 快速开始

### 前置要求

- Node.js >= 18
- PostgreSQL 数据库
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <repository-url>
cd medicine-inventory-system
```

### 2. 后端设置

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库连接等

# 生成 Prisma Client
npm run prisma:generate

# 运行数据库迁移
npm run prisma:migrate

# 启动开发服务器
npm run dev
```

后端服务将在 http://localhost:3001 启动

### 3. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```

前端服务将在 http://localhost:5173 启动

### 4. 首次使用

1. 访问 http://localhost:5173
2. 注册管理员账号
3. 开始添加药品

## 环境变量说明

### 后端 (.env)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/medicine_inventory"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
SERVERCHAN_KEY="your-serverchan-key"  # 微信通知（可选）
```

### 前端 (.env)

```env
VITE_API_URL=http://localhost:3001/api
```

## 部署指南

### 免费部署方案

#### 前端 - Vercel

1. Fork 本项目到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 设置根目录为 `frontend`
4. 添加环境变量 `VITE_API_URL`
5. 部署完成，获得 Vercel 域名

#### 后端 - Render

1. 在 [Render](https://render.com) 注册并连接 GitHub
2. 创建新的 Web Service
3. 设置根目录为 `backend`
4. 配置构建命令：`npm run build`
5. 配置启动命令：`npm start`
6. 添加环境变量
7. 部署完成

#### 数据库 - Supabase

1. 在 [Supabase](https://supabase.com) 创建项目
2. 获取数据库连接字符串
3. 在后端 .env 中配置 `DATABASE_URL`

## 项目结构

```
medicine-inventory-system/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 通用组件
│   │   ├── api/             # API 封装
│   │   ├── stores/          # 状态管理
│   │   └── utils/           # 工具函数
│   └── package.json
│
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── routes/          # 路由
│   │   ├── controllers/     # 控制器
│   │   ├── services/        # 业务逻辑
│   │   ├── middleware/      # 中间件
│   │   ├── jobs/            # 定时任务
│   │   └── config/          # 配置
│   ├── prisma/              # 数据库 schema
│   └── package.json
│
└── README.md
```

## 开发计划

- [ ] 邮件通知功能
- [ ] 药品数据库 API 对接（自动填充药品信息）
- [ ] 数据导出功能
- [ ] 移动端优化
- [ ] 批量导入药品

## 许可证

MIT
