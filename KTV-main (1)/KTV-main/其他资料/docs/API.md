# KTVSystem API 文档

> Base URL: `https://localhost:5001`
> 认证方式: JWT Bearer Token（Header: `Authorization: Bearer <token>`）
> 公共接口（无需 Token）: `POST /api/Auth/login`, `POST /api/Auth/register`

---

## 目录

1. [Auth — 认证](#1-auth--认证)
2. [Accounts — 账号管理](#2-accounts--账号管理)
3. [Songs — 歌曲](#3-songs--歌曲)
4. [Rooms — 房间管理](#4-rooms--房间管理)
5. [Room — 房间内操作](#5-room--房间内操作)
6. [Chat — 聊天](#6-chat--聊天)
7. [Favorites — 收藏](#7-favorites--收藏)
8. [Charts — 排行榜](#8-charts--排行榜)
9. [Dashboard — 仪表盘](#9-dashboard--仪表盘)
10. [Feedbacks — 反馈](#10-feedbacks--反馈)
11. [RoomRequests — 开房申请](#11-roomrequests--开房申请)
12. [Settings — 系统设置](#12-settings--系统设置)
13. [OperationLogs — 操作日志](#13-operationlogs--操作日志)
14. [Upload — 文件上传](#14-upload--文件上传)

---

## 1. Auth — 认证

Controller: `AuthController` | 路由前缀: `api/Auth`

### POST `api/Auth/login` — 登录

- **认证**: 不需要
- **请求体**:
  ```json
  {
    "Username": "string",
    "Password": "string"
  }
  ```
- **响应**: `{ token, user: { id, username, displayName, role } }`
- **前端调用**:
  - admin: `admin/src/views/LoginView.vue`（直接 fetch 调用）
  - web: `web/src/views/LoginView.vue` → `authApi.login()`

### POST `api/Auth/register` — 注册

- **认证**: 不需要
- **请求体**:
  ```json
  {
    "Username": "string",
    "Password": "string",
    "DisplayName": "string",
    "Phone": "string",
    "Email": "string"
  }
  ```
- **响应**: `{ id, message }`
- **前端调用**:
  - web: `web/src/views/RegisterView.vue` → `authApi.register()`

### POST `api/Auth/logout` — 登出

- **认证**: 需要
- **请求体**: 无
- **响应**: `{ message }`
- **前端调用**:
  - admin: `admin/src/api/index.ts` → `authApi.logout()`
  - web: `web/src/components/layout/TopNavBar.vue` → `authApi.logout()`

### GET `api/Auth/me` — 获取当前用户

- **认证**: 不需要（TODO 占位）
- **响应**: 暂未实现

### POST `api/Auth/verify-password` — 验证密码

- **认证**: 需要
- **请求体**: `{ "Password": "string" }`
- **响应**: `{ valid: bool }`
- **前端调用**:
  - admin: `admin/src/views/SystemSettingsView.vue` → `authApi.verifyPassword()`

### GET `api/Auth/profile` — 获取用户资料

- **认证**: 需要
- **响应**: `{ id, username, displayName, phone, email, avatarUrl, songCount, favoritesCount, createdAt }`
- **前端调用**:
  - web: `web/src/views/UserProfileView.vue` → `profileApi.getProfile()`

### PUT `api/Auth/profile` — 更新用户资料

- **认证**: 需要
- **请求体**:
  ```json
  {
    "DisplayName": "string",
    "Phone": "string",
    "Email": "string"
  }
  ```
- **响应**: `{ message }`
- **前端调用**:
  - web: `web/src/views/UserProfileView.vue` → `profileApi.updateProfile()`

### POST `api/Auth/change-password` — 修改密码

- **认证**: 需要
- **请求体**:
  ```json
  {
    "OldPassword": "string",
    "NewPassword": "string"
  }
  ```
- **响应**: `{ message }`
- **前端调用**:
  - web: `web/src/views/UserProfileView.vue` → `profileApi.changePassword()`

### GET `api/Auth/recent-songs` — 最近播放

- **认证**: 需要
- **查询参数**: `count` (int, 默认 5)
- **响应**: `[{ songId, title, artist, playedAt }]`
- **前端调用**:
  - web: `web/src/views/UserProfileView.vue` → `profileApi.getRecentSongs()`

---

## 2. Accounts — 账号管理

Controller: `AccountsController` | 路由前缀: `api/Accounts` | **全部需要认证**

### GET `api/Accounts` — 账号列表

- **查询参数**: `search?`, `status?`, `page` (默认 1), `pageSize` (默认 20)
- **响应**: `{ items: [...], total, page, pageSize }`（每项含 `isOnline`, `roomCode`）
- **前端调用**:
  - admin: `admin/src/views/AccountManagementView.vue` → `accountsApi.getList()`

### GET `api/Accounts/{id}` — 获取账号详情

- **路径参数**: `id` (int)
- **响应**: 用户对象
- **前端调用**:
  - admin: `admin/src/api/index.ts` → `accountsApi.getById()`（已定义，视图中未直接调用）

### POST `api/Accounts` — 创建账号

- **请求体**:
  ```json
  {
    "Username": "string",
    "Password": "string",
    "DisplayName": "string",
    "Phone": "string",
    "AvatarUrl": "string"
  }
  ```
- **响应**: `{ id }`
- **前端调用**:
  - admin: `admin/src/views/AccountManagementView.vue` → `accountsApi.create()`

### PUT `api/Accounts/{id}` — 更新账号

- **路径参数**: `id` (int)
- **请求体**: `{ "DisplayName", "Phone", "AvatarUrl" }`
- **前端调用**:
  - admin: `admin/src/views/AccountManagementView.vue` → `accountsApi.update()`

### PUT `api/Accounts/{id}/toggle-status` — 切换状态

- **路径参数**: `id` (int)
- **说明**: 在 active/disabled 之间切换
- **前端调用**:
  - admin: `admin/src/views/AccountManagementView.vue` → `accountsApi.toggleStatus()`

### POST `api/Accounts/{id}/disable` — 禁用账号

- **路径参数**: `id` (int)
- **说明**: 禁用账号并踢出房间
- **前端调用**:
  - admin: `admin/src/views/AccountManagementView.vue` → `accountsApi.disable()`

### PUT `api/Accounts/{id}/password` — 重置密码（管理员）

- **路径参数**: `id` (int)
- **请求体**: `{ "NewPassword": "string" }`
- **前端调用**:
  - admin: `admin/src/views/AccountManagementView.vue` → `accountsApi.changePassword()`

### DELETE `api/Accounts/{id}` — 删除账号

- **路径参数**: `id` (int)
- **前端调用**:
  - admin: `admin/src/views/AccountManagementView.vue` → `accountsApi.delete()`

---

## 3. Songs — 歌曲

Controller: `SongsController` | 路由前缀: `api/Songs` | **全部需要认证**

### GET `api/Songs` — 歌曲列表

- **查询参数**: `search?`, `genre?`, `status?`, `page` (默认 1), `pageSize` (默认 20)
- **响应**: `{ items: [...], total, page, pageSize }`
- **前端调用**:
  - admin: `admin/src/views/SongManagementView.vue` → `songsApi.getList()`
  - web: `web/src/views/ExploreSongsView.vue` → `songsApi.getList()`

### GET `api/Songs/stats` — 歌曲统计

- **响应**: `{ totalSongs, weeklyNew, todayPlays }`
- **前端调用**:
  - admin: `admin/src/views/SongManagementView.vue` → `songsApi.getStats()`

### GET `api/Songs/genres` — 获取所有曲风

- **响应**: `["流行", "摇滚", "民谣", "电子", "R&B", "嘻哈", "古典", "纯音乐"]`
- **前端调用**:
  - web: `web/src/views/ExploreSongsView.vue` → `songsApi.getGenres()`

### POST `api/Songs` — 创建歌曲

- **请求体**:
  ```json
  {
    "Title": "string",
    "Artist": "string",
    "Genre": "string",
    "Language": "string",
    "Duration": 0,
    "FileSize": 0,
    "CoverUrl": "string",
    "MediaUrl": "string",
    "LrcUrl": "string",
    "OriginalFileName": "string"
  }
  ```
- **响应**: `{ id }`
- **前端调用**:
  - admin: `admin/src/views/SongManagementView.vue` → `songsApi.create()`

### PUT `api/Songs/{id}` — 更新歌曲

- **路径参数**: `id` (int)
- **请求体**: 同创建，另加 `Status` 字段
- **前端调用**:
  - admin: `admin/src/views/SongDetailView.vue` → `songsApi.update()`

### GET `api/Songs/{id}/detail` — 歌曲详情

- **路径参数**: `id` (int)
- **响应**: 完整歌曲对象（含文件 URL）
- **前端调用**:
  - admin: `admin/src/views/SongDetailView.vue` → `songsApi.getDetail()`

### DELETE `api/Songs/{id}` — 删除歌曲

- **路径参数**: `id` (int)
- **前端调用**:
  - admin: `admin/src/views/SongManagementView.vue` → `songsApi.delete()`

---

## 4. Rooms — 房间管理

Controller: `RoomsController` | 路由前缀: `api/Rooms` | **全部需要认证**

### GET `api/Rooms` — 房间列表

- **查询参数**: `search?`, `status?`, `page` (默认 1), `pageSize` (默认 20)
- **响应**: `{ items: [...], total, page, pageSize }`
- **前端调用**:
  - admin: `admin/src/views/RoomManagementView.vue` → `roomsApi.getList()`
  - web: `web/src/views/RoomListView.vue` → `roomsApi.getList()`

### GET `api/Rooms/{id}` — 房间详情

- **路径参数**: `id` (int)
- **前端调用**:
  - admin: `admin/src/api/index.ts` → `roomsApi.getById()`（已定义）

### POST `api/Rooms/{id}/close` — 关闭房间

- **路径参数**: `id` (int)
- **前端调用**:
  - admin: `admin/src/views/RoomManagementView.vue` → `roomsApi.closeRoom()`

### POST `api/Rooms/join` — 加入房间

- **请求体**: `{ "RoomCode": "string" }`
- **响应**: `{ roomId, roomCode }`
- **前端调用**:
  - web: `web/src/views/RoomListView.vue` → `roomApi.joinByCode()`
  - web: `web/src/views/CurrentRoomView.vue` → `roomApi.joinByCode()`

### POST `api/Rooms/{id}/leave` — 离开房间

- **路径参数**: `id` (int)
- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `roomApi.leaveRoom()`
  - web: `web/src/components/layout/TopNavBar.vue` → `roomApi.leaveRoom()`

---

## 5. Room — 房间内操作

Controller: `RoomController` | 路由前缀: `api/Room` | **全部需要认证**

### GET `api/Room/current` — 当前房间

- **查询参数**: `roomId?` (int)
- **响应**: `{ roomId, roomCode, songsQueued, onlineUsers }`
- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `roomApi.getCurrent()`

### GET `api/Room/queue` — 播放队列

- **响应**: `[{ id, songId, title, artist, orderedBy, order, duration, mediaUrl, lrcUrl, coverUrl }]`
- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `roomApi.getQueue()`

### POST `api/Room/queue` — 点歌

- **请求体**: `{ "SongId": int }`
- **响应**: `{ id }`（队列项 ID）
- **前端调用**:
  - web: `web/src/api/index.ts` → `roomApi.orderSong()`（已定义，组件中未直接调用，点歌逻辑可能在 CurrentRoomView 中通过其他方式触发）

### POST `api/Room/queue/reorder` — 调整队列顺序（单个）

- **请求体**: `{ "QueueId": int, "NewOrder": int }`
- **前端调用**:
  - web: `web/src/api/index.ts` → `roomApi.reorder()`（已定义但未被使用，实际使用 reorderBatch）

### POST `api/Room/queue/reorder-batch` — 批量调整队列顺序

- **请求体**: `{ "QueueIds": [int, ...] }`
- **说明**: 按数组顺序重新排列队列
- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `roomApi.reorderBatch()`
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `roomApi.reorderBatch()`

### DELETE `api/Room/queue/{id}` — 删除队列项

- **路径参数**: `id` (int)
- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `roomApi.removeFromQueue()`

### GET `api/Room/{roomId}/users` — 房间内用户

- **路径参数**: `roomId` (int)
- **响应**: 用户列表
- **前端调用**:
  - admin: `admin/src/views/RoomManagementView.vue` → `roomsApi.getRoomUsers()`

### GET `api/Room/playback` — 播放状态

- **说明**: 如果当前曲目已播完，自动推进到下一首
- **响应**: `{ queueItemId, songId, title, artist, mediaUrl, lrcUrl, coverUrl, isPlaying, position, duration, playMode }`
- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `playbackApi.getState()`

### POST `api/Room/playback/play` — 播放指定曲目

- **请求体**: `{ "QueueItemId": int }`
- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `playbackApi.play()`
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `playbackApi.play()`

### POST `api/Room/playback/pause` — 暂停

- **前端调用**:
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `playbackApi.pause()`

### POST `api/Room/playback/resume` — 继续播放

- **前端调用**:
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `playbackApi.resume()`

### POST `api/Room/playback/seek` — 跳转进度

- **请求体**: `{ "Position": int }`（秒）
- **前端调用**:
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `playbackApi.seek()`

### POST `api/Room/playback/next` — 下一首

- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `playbackApi.next()`
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `playbackApi.next()`

### POST `api/Room/playback/prev` — 上一首

- **说明**: 从历史栈中获取上一首
- **前端调用**:
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `playbackApi.prev()`

### POST `api/Room/playback/mode` — 设置播放模式

- **请求体**: `{ "Mode": "string" }`（`repeat-one` | `repeat-all` | `shuffle` | `off`）
- **前端调用**:
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `playbackApi.setMode()`

---

## 6. Chat — 聊天

Controller: `ChatController` | 路由前缀: `api/chat` | **全部需要认证**

### POST `api/chat/send` — 发送消息

- **请求体**: `{ "RoomId": int, "Message": "string" }`（消息最长 200 字符）
- **响应**: `{ id }`
- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `chatApi.sendMessage()`
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `chatApi.sendMessage()`

### GET `api/chat/messages` — 获取聊天记录

- **查询参数**: `roomId` (int), `limit` (默认 50)
- **响应**: `[{ id, nickname, content, timeStr }]`
- **前端调用**:
  - web: `web/src/views/CurrentRoomView.vue` → `chatApi.getMessages()`
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `chatApi.getMessages()`

---

## 7. Favorites — 收藏

Controller: `FavoritesController` | 路由前缀: `api/Favorites` | **全部需要认证**

### GET `api/Favorites` — 收藏列表

- **响应**: `[{ id, songId, title, artist, duration, coverUrl, mediaUrl, createdAt }]`
- **前端调用**:
  - web: `web/src/views/ExploreSongsView.vue` → `favoritesApi.getList()`
  - web: `web/src/views/CurrentRoomView.vue` → `favoritesApi.getList()`
  - web: `web/src/views/MyFavoritesView.vue` → `favoritesApi.getList()`
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `favoritesApi.getList()`

### POST `api/Favorites/{songId}` — 添加收藏

- **路径参数**: `songId` (int)
- **前端调用**:
  - web: `web/src/views/ExploreSongsView.vue` → `favoritesApi.add()`
  - web: `web/src/views/CurrentRoomView.vue` → `favoritesApi.add()`
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `favoritesApi.add()`

### DELETE `api/Favorites/{songId}` — 取消收藏

- **路径参数**: `songId` (int)
- **前端调用**:
  - web: `web/src/views/ExploreSongsView.vue` → `favoritesApi.remove()`
  - web: `web/src/views/CurrentRoomView.vue` → `favoritesApi.remove()`
  - web: `web/src/views/MyFavoritesView.vue` → `favoritesApi.remove()`
  - web: `web/src/components/layout/BottomPlayerBar.vue` → `favoritesApi.remove()`

---

## 8. Charts — 排行榜

Controller: `ChartsController` | 路由前缀: `api/Charts` | **全部需要认证**

### GET `api/Charts/daily` — 日榜

- **响应**: Top 10 活跃歌曲 `[{ id, title, artist, playCount, ... }]`
- **前端调用**:
  - web: `web/src/views/TopChartsView.vue` → `chartsApi.getDaily()`

### GET `api/Charts/weekly` — 周榜

- **响应**: Top 10 活跃歌曲
- **前端调用**:
  - web: `web/src/views/TopChartsView.vue` → `chartsApi.getWeekly()`

---

## 9. Dashboard — 仪表盘

Controller: `DashboardController` | 路由前缀: `api/Dashboard` | **全部需要认证**

### GET `api/Dashboard/stats` — 统计概览

- **响应**: 统计数据对象
- **前端调用**:
  - admin: `admin/src/views/DashboardView.vue` → `dashboardApi.getStats()`

### GET `api/Dashboard/top-songs` — 热门歌曲

- **响应**: 热门歌曲列表
- **前端调用**:
  - admin: `admin/src/views/DashboardView.vue` → `dashboardApi.getTopSongs()`

### GET `api/Dashboard/latest-rooms` — 最新房间

- **响应**: 最新房间列表
- **前端调用**:
  - admin: `admin/src/views/DashboardView.vue` → `dashboardApi.getLatestRooms()`

---

## 10. Feedbacks — 反馈

Controller: `FeedbacksController` | 路由前缀: `api/Feedbacks` | **全部需要认证**

### GET `api/Feedbacks` — 反馈列表

- **查询参数**: `status?`, `search?`, `page` (默认 1), `pageSize` (默认 20)
- **响应**: `{ items: [...], total, page, pageSize }`
- **前端调用**:
  - admin: `admin/src/views/FeedbackManagementView.vue` → `feedbacksApi.getList()`

### POST `api/Feedbacks` — 提交反馈

- **请求体**:
  ```json
  {
    "FeedbackType": "string",
    "SongName": "string",
    "Artist": "string",
    "Description": "string"
  }
  ```
- **响应**: `{ id, message }`
- **前端调用**:
  - web: `web/src/views/ExploreSongsView.vue` → `feedbacksApi.create()`

### POST `api/Feedbacks/{id}/process` — 标记已处理

- **路径参数**: `id` (int)
- **前端调用**:
  - admin: `admin/src/views/FeedbackManagementView.vue` → `feedbacksApi.markProcessed()`

### GET `api/Feedbacks/pending-count` — 待处理数量

- **响应**: `{ count }`
- **前端调用**:
  - admin: `admin/src/api/index.ts` → `feedbacksApi.getPendingCount()`（已定义）

---

## 11. RoomRequests — 开房申请

Controller: `RoomRequestsController` | 路由前缀: `api/RoomRequests` | **全部需要认证**

### GET `api/RoomRequests` — 申请列表

- **查询参数**: `status?`, `page` (默认 1), `pageSize` (默认 20)
- **响应**: `{ items: [...], total, page, pageSize }`
- **前端调用**:
  - admin: `admin/src/views/RoomManagementView.vue` → `roomRequestsApi.getList()`

### POST `api/RoomRequests` — 提交申请

- **说明**: userId 从 JWT 中获取
- **响应**: `{ id, message }`
- **前端调用**:
  - web: `web/src/views/RoomListView.vue` → `roomRequestsApi.create()`

### POST `api/RoomRequests/{id}/approve` — 批准申请

- **路径参数**: `id` (int)
- **说明**: 批准后自动创建房间
- **响应**: `{ roomCode, roomId, message }`
- **前端调用**:
  - admin: `admin/src/views/RoomManagementView.vue` → `roomRequestsApi.approve()`

### POST `api/RoomRequests/{id}/reject` — 拒绝申请

- **路径参数**: `id` (int)
- **前端调用**:
  - admin: `admin/src/views/RoomManagementView.vue` → `roomRequestsApi.reject()`

### GET `api/RoomRequests/pending-count` — 待审批数量

- **响应**: `{ count }`
- **前端调用**:
  - admin: `admin/src/views/RoomManagementView.vue` → `roomRequestsApi.getPendingCount()`

---

## 12. Settings — 系统设置

Controller: `SettingsController` | 路由前缀: `api/Settings` | **全部需要认证**

### GET `api/Settings` — 获取所有设置

- **响应**: `{ key: value, ... }`
- **前端调用**:
  - admin: `admin/src/views/SystemSettingsView.vue` → `settingsApi.get()`

### PUT `api/Settings` — 批量更新设置

- **请求体**: `{ "key": "value", ... }`
- **前端调用**:
  - admin: `admin/src/views/SystemSettingsView.vue` → `settingsApi.update()`

### GET `api/Settings/admin-account` — 获取管理员信息

- **响应**: `{ username }`
- **前端调用**:
  - admin: `admin/src/views/SystemSettingsView.vue` → `settingsApi.getAdminAccount()`

### POST `api/Settings/admin-account/username` — 修改管理员用户名

- **请求体**: `{ "NewUsername": "string", "Password": "string" }`
- **前端调用**:
  - admin: `admin/src/views/SystemSettingsView.vue` → `settingsApi.updateAdminUsername()`

### POST `api/Settings/admin-account/password` — 修改管理员密码

- **请求体**: `{ "CurrentPassword": "string", "NewPassword": "string", "ConfirmPassword": "string" }`
- **前端调用**:
  - admin: `admin/src/views/SystemSettingsView.vue` → `settingsApi.updateAdminPassword()`

---

## 13. OperationLogs — 操作日志

Controller: `OperationLogsController` | 路由前缀: `api/OperationLogs` | **全部需要认证**

### GET `api/OperationLogs` — 日志列表

- **查询参数**: `operationType?`, `username?`, `fromDate?`, `toDate?`, `page` (默认 1), `pageSize` (默认 20)
- **响应**: `{ items: [...], total, page, pageSize }`
- **前端调用**:
  - admin: `admin/src/views/SystemSettingsView.vue` → `operationLogsApi.getList()`

---

## 14. Upload — 文件上传

Controller: `UploadController` | 路由前缀: `api/Upload` | **全部需要认证**

### POST `api/Upload/avatar` — 上传头像

- **Content-Type**: `multipart/form-data`
- **字段**: `file`（最大 2MB，格式: jpg/jpeg/png/gif/webp）
- **响应**: `{ url, fileName, originalName }`
- **前端调用**:
  - admin: `admin/src/views/AccountManagementView.vue` → `uploadApi.avatar()`

### POST `api/Upload/cover` — 上传封面

- **Content-Type**: `multipart/form-data`
- **字段**: `file`（最大 5MB，格式: jpg/jpeg/png/webp）
- **响应**: `{ url, fileName, originalName }`
- **前端调用**:
  - admin: `admin/src/views/SongManagementView.vue` → `uploadApi.cover()`
  - admin: `admin/src/views/SongDetailView.vue` → `uploadApi.cover()`

### POST `api/Upload/music` — 上传音乐

- **Content-Type**: `multipart/form-data`
- **字段**: `file`（最大 100MB，格式: mp3/flac）
- **响应**: `{ url, fileName, originalName }`
- **前端调用**:
  - admin: `admin/src/views/SongManagementView.vue` → `uploadApi.music()`
  - admin: `admin/src/views/SongDetailView.vue` → `uploadApi.music()`

### POST `api/Upload/lrc` — 上传歌词

- **Content-Type**: `multipart/form-data`
- **字段**: `file`（最大 1MB，格式: .lrc）
- **响应**: `{ url, fileName, originalName }`
- **前端调用**:
  - admin: `admin/src/views/SongManagementView.vue` → `uploadApi.lrc()`
  - admin: `admin/src/views/SongDetailView.vue` → `uploadApi.lrc()`

---

## 附录

### 前端 HTTP 客户端

| | Admin | Web |
|---|---|---|
| 文件 | `admin/src/api/client.ts` | `web/src/api/client.ts` |
| 库 | Axios | Axios |
| Base URL | `VITE_API_BASE_URL` 或 `https://localhost:5001` | 同左 |
| 超时 | 10s | 10s |
| 认证 | Bearer Token（localStorage） | Bearer Token（localStorage） |
| 401 处理 | 自动用硬编码凭据重试登录 | 清除 Token，跳转 `/login` |

### API 调用汇总

| 分类 | 数量 |
|---|---|
| Controller | 14 |
| 总接口数 | 62 |
| GET | 25 |
| POST | 28 |
| PUT | 7 |
| DELETE | 4 |

### 未使用的接口

以下接口已定义但前端未调用：

- `POST /api/Room/queue/reorder` — 单个排序（实际使用 `reorder-batch`）
- `POST /api/Room/queue` (orderSong) — 点歌（组件中未直接调用）

### 特殊说明

- `GET /api/Auth/me` — 当前为 TODO 占位，未实现
- 管理端 `LoginView.vue` 使用原生 `fetch()` 调用登录，未走 axios 封装
- Web 端 `BottomPlayerBar.vue` 使用原生 `fetch()` 获取 `.lrc` 歌词文件
