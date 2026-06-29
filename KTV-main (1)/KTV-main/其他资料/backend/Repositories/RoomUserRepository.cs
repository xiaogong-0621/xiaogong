using Dapper;
using Microsoft.Data.SqlClient;
using backend.Services;

namespace backend.Repositories;

public class RoomUserRepository : IRoomUserRepository
{
    private readonly string _connStr;
    public RoomUserRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<int?> AddUserAsync(int roomId, int userId)
    {
        using var conn = CreateConnection();
        // Get old room before removing
        var oldRoomId = await conn.ExecuteScalarAsync<int?>(
            "SELECT RoomId FROM RoomUsers WHERE UserId = @UserId", new { UserId = userId });
        // Remove from any other room first
        await conn.ExecuteAsync("DELETE FROM RoomUsers WHERE UserId = @UserId", new { UserId = userId });
        // Add to this room (ignore if already exists)
        await conn.ExecuteAsync(
            @"IF NOT EXISTS (SELECT 1 FROM RoomUsers WHERE RoomId = @RoomId AND UserId = @UserId)
              INSERT INTO RoomUsers (RoomId, UserId) VALUES (@RoomId, @UserId)",
            new { RoomId = roomId, UserId = userId });
        return oldRoomId;
    }

    public async Task RemoveUserAsync(int roomId, int userId)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "DELETE FROM RoomUsers WHERE RoomId = @RoomId AND UserId = @UserId",
            new { RoomId = roomId, UserId = userId });
    }

    public async Task RemoveAllFromRoomAsync(int roomId)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync("DELETE FROM RoomUsers WHERE RoomId = @RoomId", new { RoomId = roomId });
    }

    public async Task<List<RoomUserInfo>> GetUsersInRoomAsync(int roomId)
    {
        using var conn = CreateConnection();
        var users = await conn.QueryAsync<RoomUserInfo>(
            @"SELECT u.Id, u.Username, u.DisplayName, u.AvatarUrl
              FROM RoomUsers ru
              INNER JOIN Users u ON ru.UserId = u.Id
              WHERE ru.RoomId = @RoomId
              ORDER BY u.DisplayName",
            new { RoomId = roomId });
        return users.ToList();
    }

    public async Task<int> GetRoomUserCountAsync(int roomId)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM RoomUsers WHERE RoomId = @RoomId",
            new { RoomId = roomId });
    }
}
