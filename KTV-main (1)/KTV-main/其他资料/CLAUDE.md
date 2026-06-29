# KTVSystem

线上社交 KTV 点歌系统。前端 Vue 3 + TypeScript + Tailwind CSS，后端 ASP.NET Core 8.0 + Dapper + SQL Server。

## 项目结构

```
backend/          后端 API（C#）
  Controllers/    API 控制器（15 个）
  Services/       业务逻辑层
  Repositories/   数据访问层（Dapper）
  Models/         领域模型
  DTOs/           数据传输对象
  Hubs/           SignalR 实时通信
  Middleware/     中间件（错误处理、操作日志）
  wwwroot/        静态文件（头像、封面、音乐）
admin/            管理端前端（Vue 3）
web/              用户端前端（Vue 3）
database/         SQL 脚本（schema、migrations）
docs/             产品文档、使用说明
```

## 技术栈

| 层 | 技术 |
|---|------|
| 后端 | ASP.NET Core 8.0, Dapper, SignalR, JWT |
| 前端 | Vue 3, TypeScript, Vite 8, Tailwind CSS 3, Element Plus, Pinia |
| 数据库 | SQL Server (localhost\SQLEXPRESS) |
| 实时 | SignalR (Hub), 聊天用 REST 轮询（2 秒） |

## 启动

```bash
cd backend && dotnet run     # API: http://localhost:5276
cd admin && npm run dev      # 管理端: http://localhost:5173
cd web && npm run dev        # 用户端: http://localhost:5174
```

## 约定

**后端 (C#)**
- 命名空间：`backend.*`
- 模式：Repository（`IXxxRepository` + `XxxRepository`）→ Service → Controller
- DI：Repository 和 Service 都注册为 Scoped
- 路由：`[Route("api/[controller]")]`
- 认证：JWT Bearer
- 数据库迁移在 `Program.cs` 启动时自动执行

**前端 (Vue 3)**
- 目录：`src/{api,assets,components,composables,router,stores,types,utils,views}/`
- 路径别名：`@` → `src/`
- 状态管理：Pinia
- 样式：Tailwind CSS + Element Plus
- Mock 数据由 `VITE_USE_MOCK` 控制（当前关闭）

**数据库 (SQL Server)**
- 文本字段用 NVARCHAR
- 时间用 DATETIME2
- 主键用 IDENTITY(1,1)
- 列名 PascalCase

## 关键文件

| 文件 | 用途 |
|------|------|
| `docs/Product-Spec.md` | 产品需求文档 |
| `docs/Product-Spec-CHANGELOG.md` | 需求变更记录 |
| `docs/项目使用说明.md` | 使用说明 |
| `backend/Program.cs` | 后端入口，DI 注册，自动迁移 |
| `backend/Hubs/KtvHub.cs` | SignalR 实时事件（点歌、播放） |
| `backend/Middleware/ErrorHandlingMiddleware.cs` | 全局异常处理 |
