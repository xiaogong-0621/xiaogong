-- ============================================
-- 通知表迁移脚本
-- ============================================

USE KTVSystem;
GO

-- 创建通知表
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE Notifications (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT NOT NULL,
        Type            NVARCHAR(30) NOT NULL DEFAULT 'system',
        Title           NVARCHAR(200) NOT NULL,
        Content         NVARCHAR(1000) NOT NULL,
        IsRead          BIT NOT NULL DEFAULT 0,
        RelatedId       INT NULL,
        RelatedType     NVARCHAR(50) NULL,
        CreatedAt       DATETIME2 NOT NULL DEFAULT GETUTCDATE()
    );

    -- 外键
    ALTER TABLE Notifications ADD CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(Id);

    -- 索引
    CREATE INDEX IX_Notifications_UserId ON Notifications(UserId, CreatedAt DESC);
    CREATE INDEX IX_Notifications_IsRead ON Notifications(UserId, IsRead);

    PRINT N'通知表 Notifications 已创建';
END
GO
