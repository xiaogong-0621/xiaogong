using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class VoiceMessageRepository : IVoiceMessageRepository
{
    private readonly string _connStr;
    public VoiceMessageRepository(string connStr) => _connStr = connStr;

    public async Task<int> CreateAsync(VoiceMessage message)
    {
        using var conn = new SqlConnection(_connStr);
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO VoiceMessages (RoomId, UserId, Nickname, FileUrl, Duration, CreatedAt)
              OUTPUT INSERTED.Id
              VALUES (@RoomId, @UserId, @Nickname, @FileUrl, @Duration, GETDATE())",
            message);
    }

    public async Task<List<VoiceMessage>> GetByRoomIdAsync(int roomId, int limit = 50)
    {
        using var conn = new SqlConnection(_connStr);
        var messages = await conn.QueryAsync<VoiceMessage>(
            @"SELECT TOP (@Limit) * FROM VoiceMessages
              WHERE RoomId = @RoomId
              ORDER BY CreatedAt DESC",
            new { RoomId = roomId, Limit = limit });
        return messages.Reverse().ToList();
    }
}
