-- ============================================
-- 声域友 KTV System — 数据库初始化脚本 v2.0.5
-- 适用数据库: SQL Server
-- 用法: 在 SQL Server Management Studio 或 sqlcmd 中执行此脚本
-- 注意: 会删除并重建所有表，仅保留管理员账号
-- ============================================

-- 如果数据库不存在则创建
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'KTVSystem')
BEGIN
    CREATE DATABASE KTVSystem;
    PRINT N'数据库 KTVSystem 已创建';
END
GO

USE KTVSystem;
GO

-- ============================================
-- 删除旧表（按外键依赖顺序）
-- ============================================
IF OBJECT_ID('dbo.ChatMessages', 'U') IS NOT NULL DROP TABLE ChatMessages;
IF OBJECT_ID('dbo.OperationLogs', 'U') IS NOT NULL DROP TABLE OperationLogs;
IF OBJECT_ID('dbo.Feedbacks', 'U') IS NOT NULL DROP TABLE Feedbacks;
IF OBJECT_ID('dbo.Favorites', 'U') IS NOT NULL DROP TABLE Favorites;
IF OBJECT_ID('dbo.PlayQueue', 'U') IS NOT NULL DROP TABLE PlayQueue;
IF OBJECT_ID('dbo.RoomUsers', 'U') IS NOT NULL DROP TABLE RoomUsers;
IF OBJECT_ID('dbo.RoomRequests', 'U') IS NOT NULL DROP TABLE RoomRequests;
IF OBJECT_ID('dbo.Orders', 'U') IS NOT NULL DROP TABLE Orders;
IF OBJECT_ID('dbo.Holidays', 'U') IS NOT NULL DROP TABLE Holidays;
IF OBJECT_ID('dbo.Rooms', 'U') IS NOT NULL DROP TABLE Rooms;
IF OBJECT_ID('dbo.Songs', 'U') IS NOT NULL DROP TABLE Songs;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('dbo.SystemSettings', 'U') IS NOT NULL DROP TABLE SystemSettings;
GO

-- ============================================
-- 建表
-- ============================================

-- 用户表
CREATE TABLE Users (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Username        NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash    NVARCHAR(256) NOT NULL,
    DisplayName     NVARCHAR(100) NOT NULL,
    Phone           NVARCHAR(20) NULL,
    Email           NVARCHAR(100) NULL,
    AvatarUrl       NVARCHAR(500) NULL,
    Balance         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    IsVip           BIT NOT NULL DEFAULT 0,
    Role            NVARCHAR(20) NOT NULL DEFAULT 'user',
    Status          NVARCHAR(20) NOT NULL DEFAULT 'active',
    LastActiveAt    DATETIME2 NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- 歌曲表
CREATE TABLE Songs (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Title           NVARCHAR(200) NOT NULL,
    Artist          NVARCHAR(200) NOT NULL,
    Genre           NVARCHAR(50) NOT NULL,
    Language        NVARCHAR(20) NULL,
    Duration        INT NOT NULL DEFAULT 0,
    FileSize        BIGINT NULL,
    CoverUrl        NVARCHAR(500) NULL,
    MediaUrl        NVARCHAR(500) NULL,
    LrcUrl          NVARCHAR(500) NULL,
    OriginalFileName NVARCHAR(500) NULL,
    PlayCount       INT NOT NULL DEFAULT 0,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'active',
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- 虚拟房间表
CREATE TABLE Rooms (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    RoomCode        NVARCHAR(10) NOT NULL UNIQUE,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'active',
    CreatedByUserId INT NOT NULL,
    CurrentUsers    INT NOT NULL DEFAULT 0,
    IdleCloseAt     DATETIME2 NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ClosedAt        DATETIME2 NULL
);

-- 房间申请表
CREATE TABLE RoomRequests (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT NOT NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'pending',
    RoomId          INT NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ProcessedAt     DATETIME2 NULL,
    ProcessedBy     INT NULL
);

-- 房间用户关联表
CREATE TABLE RoomUsers (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    RoomId          INT NOT NULL,
    UserId          INT NOT NULL,
    JoinedAt        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_RoomUsers UNIQUE (UserId)
);

-- 播放队列表
CREATE TABLE PlayQueue (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    RoomId          INT NOT NULL,
    SongId          INT NOT NULL,
    OrderedByUserId INT NOT NULL,
    SortOrder       INT NOT NULL DEFAULT 0,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'queued',
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- 收藏表
CREATE TABLE Favorites (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT NOT NULL,
    SongId          INT NOT NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Favorites_User_Song UNIQUE (UserId, SongId)
);

-- 反馈表
CREATE TABLE Feedbacks (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    UserId          INT NOT NULL,
    FeedbackType    NVARCHAR(30) NOT NULL,
    SongName        NVARCHAR(200) NULL,
    Artist          NVARCHAR(200) NULL,
    Description     NVARCHAR(1000) NULL,
    Status          NVARCHAR(20) NOT NULL DEFAULT 'pending',
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ProcessedAt     DATETIME2 NULL
);

-- 系统设置表
CREATE TABLE SystemSettings (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey      NVARCHAR(100) NOT NULL UNIQUE,
    SettingValue    NVARCHAR(MAX) NOT NULL,
    UpdatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- 聊天消息表
CREATE TABLE ChatMessages (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    RoomId          INT NOT NULL,
    UserId          INT NOT NULL,
    Nickname        NVARCHAR(50) NOT NULL,
    Content         NVARCHAR(200) NOT NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- 操作日志表
CREATE TABLE OperationLogs (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    Username        NVARCHAR(50) NOT NULL,
    OperationType   NVARCHAR(50) NOT NULL,
    ObjectType      NVARCHAR(50) NOT NULL,
    ObjectId        NVARCHAR(50) NULL,
    Details         NVARCHAR(MAX) NULL,
    CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

GO

-- ============================================
-- 外键约束
-- ============================================

ALTER TABLE RoomRequests ADD CONSTRAINT FK_RoomRequests_Users FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE RoomRequests ADD CONSTRAINT FK_RoomRequests_Rooms FOREIGN KEY (RoomId) REFERENCES Rooms(Id);
ALTER TABLE RoomRequests ADD CONSTRAINT FK_RoomRequests_ProcessedBy FOREIGN KEY (ProcessedBy) REFERENCES Users(Id);

ALTER TABLE RoomUsers ADD CONSTRAINT FK_RoomUsers_Rooms FOREIGN KEY (RoomId) REFERENCES Rooms(Id);
ALTER TABLE RoomUsers ADD CONSTRAINT FK_RoomUsers_Users FOREIGN KEY (UserId) REFERENCES Users(Id);

ALTER TABLE PlayQueue ADD CONSTRAINT FK_PlayQueue_Songs FOREIGN KEY (SongId) REFERENCES Songs(Id);
ALTER TABLE PlayQueue ADD CONSTRAINT FK_PlayQueue_Users FOREIGN KEY (OrderedByUserId) REFERENCES Users(Id);

ALTER TABLE Favorites ADD CONSTRAINT FK_Favorites_Users FOREIGN KEY (UserId) REFERENCES Users(Id);
ALTER TABLE Favorites ADD CONSTRAINT FK_Favorites_Songs FOREIGN KEY (SongId) REFERENCES Songs(Id);

ALTER TABLE Feedbacks ADD CONSTRAINT FK_Feedbacks_Users FOREIGN KEY (UserId) REFERENCES Users(Id);

ALTER TABLE ChatMessages ADD CONSTRAINT FK_ChatMessages_Rooms FOREIGN KEY (RoomId) REFERENCES Rooms(Id);
ALTER TABLE ChatMessages ADD CONSTRAINT FK_ChatMessages_Users FOREIGN KEY (UserId) REFERENCES Users(Id);

GO

-- ============================================
-- 索引
-- ============================================

CREATE INDEX IX_Songs_Genre ON Songs(Genre);
CREATE INDEX IX_Songs_Status ON Songs(Status);
CREATE INDEX IX_Songs_PlayCount ON Songs(PlayCount DESC);

CREATE INDEX IX_PlayQueue_RoomId_SortOrder ON PlayQueue(RoomId, SortOrder);

CREATE INDEX IX_Favorites_UserId ON Favorites(UserId);

CREATE INDEX IX_ChatMessages_RoomId ON ChatMessages(RoomId, CreatedAt);

CREATE INDEX IX_OperationLogs_CreatedAt ON OperationLogs(CreatedAt DESC);
CREATE INDEX IX_OperationLogs_Type ON OperationLogs(OperationType);

GO

-- ============================================
-- 种子数据
-- ============================================

-- 系统设置（v2.0 配置项）
INSERT INTO SystemSettings (SettingKey, SettingValue) VALUES
    (N'platform_name', N'声域友 KTV'),
    (N'contact_info', N'admin@ktv.com'),
    (N'log_retention_days', N'90'),
    (N'verify_close_room', N'true');

-- 管理员账号（密码: demo_hash_admin）
INSERT INTO Users (Username, PasswordHash, DisplayName, Phone, AvatarUrl, Role, Status, CreatedAt, UpdatedAt) VALUES
    (N'admin', N'demo_hash_admin', N'管理员', N'13800000000', N'/uploads/avatars/default.jpg', N'admin', N'active', GETUTCDATE(), GETUTCDATE());

GO

PRINT N'============================================';
PRINT N'数据库初始化完成!';
PRINT N'';
PRINT N'表: Users, Songs, Rooms, RoomRequests, RoomUsers,';
PRINT N'     PlayQueue, Favorites, Feedbacks, SystemSettings,';
PRINT N'     ChatMessages, OperationLogs';
PRINT N'';
PRINT N'管理员账号: admin / demo_hash_admin';
PRINT N'歌曲需通过管理端新增';
PRINT N'============================================';
