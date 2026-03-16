# AA 记账应用 - 执行与部署指南

## 项目简介

AA 记账是一个基于 **NestJS + React** 的全栈应用，用于多人 AA 制账单记录和自动结算。支持账单创建、成员管理、消费记录、统计分析和智能结算功能。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Tailwind CSS + Rspack |
| 后端 | NestJS 10 + TypeScript |
| 数据库 | PostgreSQL + Drizzle ORM |
| UI 组件 | shadcn/ui + Radix UI |
| 图标 | Lucide React |
| 构建工具 | Rspack |

---

## 环境要求

- **Node.js**: >= 22.0.0
- **npm**: >= 10.0.0

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发环境

```bash
# 同时启动前端和后端开发服务器
npm run dev

# 或者分别启动
npm run dev:server  # 后端服务 (http://localhost:3000)
npm run dev:client  # 前端服务 (http://localhost:8080)
```

开发环境特性：
- 前端热重载（Hot Reload）
- 后端自动重启（Watch Mode）
- API 代理：前端 `/api` 请求自动转发到后端

---

## 构建生产版本

### 完整构建流程

```bash
npm run build
```

构建流程包含以下步骤：

| 步骤 | 操作 | 说明 |
|------|------|------|
| 0 | 安装插件 | 初始化平台插件 |
| 1 | 更新 OpenAPI | 生成 API 文档 |
| 2 | 清理目录 | 删除旧的 dist 目录 |
| 3 | 并行构建 | 同时构建 Server 和 Client |
| 4 | 准备产物 | 复制配置文件和 HTML |
| 5 | 智能裁剪 | 分析依赖并精简 node_modules |

### 分别构建

```bash
# 仅构建后端
npm run build:server

# 仅构建前端
npm run build:client

# 构建后端 + 前端
npm run build:prod
```

### 构建产物结构

```
dist/
├── server/              # 后端代码
│   ├── main.js          # 入口文件
│   ├── main.d.ts
│   ├── app.module.js
│   ├── modules/         # 业务模块
│   └── database/        # 数据库相关
├── client/              # 前端静态资源
│   └── *.html
├── dist/client/         # HTML 模板（用于 SSR）
├── node_modules/        # 精简后的依赖
├── package.json         # 精简后的配置
├── run.sh               # 启动脚本
└── .env                 # 环境变量（如果存在）
```

---

## 部署方法

### 方式一：本地/服务器部署

#### 1. 构建生产版本

```bash
npm run build
```

#### 2. 进入构建目录

```bash
cd dist
```

#### 3. 启动服务

```bash
./run.sh
# 或
NODE_ENV=production node server/main.js
```

服务将在 **3000** 端口启动，访问 http://localhost:3000 即可。

---

### 方式二：Docker 部署（推荐）

创建 `Dockerfile`：

```dockerfile
FROM node:22-alpine

WORKDIR /app

# 复制构建产物
COPY dist/ .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["./run.sh"]
```

构建并运行：

```bash
# 构建镜像
docker build -t aa-bill-app .

# 运行容器
docker run -d -p 3000:3000 --name aa-bill aa-bill-app
```

---

### 方式三：平台部署（如 Lark 飞书平台）

本项目基于 `@lark-apaas/fullstack-nestjs-core` 框架构建，支持飞书平台一键部署。

```bash
# 使用 fullstack-cli 进行部署
npx fullstack-cli deploy
```

---

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发环境 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务（需在 dist 目录） |
| `npm run lint` | 运行代码检查 |
| `npm run type:check` | 类型检查 |
| `npm run format` | 格式化代码 |
| `npm test` | 运行单元测试 |
| `npm run gen:db-schema` | 生成数据库 Schema |

---

## 项目结构

```
├── client/                    # 前端代码
│   ├── src/
│   │   ├── pages/            # 页面组件
│   │   ├── components/       # 可复用组件
│   │   ├── api/              # API 请求
│   │   └── app.tsx           # 路由配置
│   └── index.html
├── server/                    # 后端代码
│   ├── modules/              # 业务模块
│   │   ├── bill/             # 账单模块
│   │   └── view/             # 视图模块
│   ├── database/             # 数据库 Schema
│   └── main.ts               # 入口文件
├── shared/                    # 前后端共享类型
│   └── api.interface.ts
├── scripts/                   # 构建脚本
│   ├── dev.sh                # 开发启动
│   ├── build.sh              # 生产构建
│   └── run.sh                # 生产运行
└── dist/                      # 构建产物
```

---

## 核心功能模块

### 1. 账单管理
- 创建/查看账单
- 邀请成员加入
- 二维码分享

### 2. 消费记录
- 添加消费（金额、分类、备注、付款人）
- 查看消费列表
- 分类统计

### 3. AA 结算
- 自动计算每人应付金额
- 智能转账方案（最少转账次数）
- 成员收支明细

### 4. 统计分析
- 消费分类占比
- 成员消费排行
- 时间维度分析

---

## 注意事项

1. **数据库**：应用使用 PostgreSQL 数据库，确保数据库连接配置正确
2. **环境变量**：生产环境需要配置 `.env` 文件
3. **端口**：默认使用 3000 端口，可通过环境变量修改
4. **文件上传**：服务端不支持文件上传，需使用前端 SDK 实现

---

## 故障排查

### 构建失败

```bash
# 清理缓存后重新构建
rm -rf node_modules dist
npm install
npm run build
```

### 端口冲突

```bash
# 修改启动端口
PORT=8080 npm start
```

### 依赖问题

```bash
# 重新生成数据库 Schema
npm run gen:db-schema
```

---

## 许可证

MIT License
