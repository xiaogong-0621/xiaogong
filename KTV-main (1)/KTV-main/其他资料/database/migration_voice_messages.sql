-- ============================================
-- 声域友 KTV System - Migration: 语音消息
-- ============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VoiceMessages')
BEGIN
    CREATE TABLE VoiceMessages (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        RoomId      INT NOT NULL,
        UserId      INT NOT NULL,
        Nickname    NVARCHAR(50) NOT NULL,
        FileUrl     NVARCHAR(500) NOT NULL,
        Duration    INT NOT NULL DEFAULT 0,
        CreatedAt   DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        CONSTRAINT FK_VoiceMessages_Rooms FOREIGN KEY (RoomId) REFERENCES Rooms(Id),
        CONSTRAINT FK_VoiceMessages_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
    );

    CREATE INDEX IX_VoiceMessages_RoomId ON VoiceMessages(RoomId, CreatedAt);

    PRINT N'VoiceMessages 表已创建';
END
ELSE
BEGIN
    PRINT N'VoiceMessages 表已存在，跳过';
END
GO
