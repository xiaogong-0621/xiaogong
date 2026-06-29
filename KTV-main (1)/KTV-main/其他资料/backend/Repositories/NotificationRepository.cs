using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly string _connStr;
    public NotificationRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<List<Notification>> GetByUserIdAsync(int userId, int limit = 50)
    {
        using var conn = CreateConnection();
        var items = await conn.QueryAsync<Notification>(
            @"SELECT TOP (@Limit) * FROM Notifications
              WHERE UserId = @UserId
              ORDER BY CreatedAt DESC",
            new { UserId = userId, Limit = limit });
        return items.ToList();
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Notifications WHERE UserId = @UserId AND IsRead = 0",
            new { UserId = userId });
    }

    public async Task<int> CreateAsync(Notification notification)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO Notifications (UserId, Type, Title, Content, IsRead, RelatedId, RelatedType, CreatedAt)
              OUTPUT INSERTED.Id
              VALUES (@UserId, @Type, @Title, @Content, @IsRead, @RelatedId, @RelatedType, @CreatedAt)",
            notification);
    }

    public async Task MarkAsReadAsync(int id)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE Notifications SET IsRead = 1 WHERE Id = @Id",
            new { Id = id });
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE Notifications SET IsRead = 1 WHERE UserId = @UserId AND IsRead = 0",
            new { UserId = userId });
    }
}
