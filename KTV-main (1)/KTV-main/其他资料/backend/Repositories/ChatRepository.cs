using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class ChatRepository : IChatRepository
{
    private readonly string _connStr;
    public ChatRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    private static readonly string[] BadWords = { "操", "草", "妈的", "卧槽" };

    private static string FilterSensitiveWords(string message)
    {
        foreach (var word in BadWords)
        {
            message = message.Replace(word, new string('*', word.Length));
        }
        return message;
    }

    public async Task<int> CreateAsync(int roomId, int userId, string nickname, string content)
    {
        var filtered = FilterSensitiveWords(content);
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO ChatMessages (RoomId, UserId, Nickname, Content, CreatedAt)
              OUTPUT INSERTED.Id
              VALUES (@RoomId, @UserId, @Nickname, @Content, GETDATE())",
            new { RoomId = roomId, UserId = userId, Nickname = nickname, Content = filtered });
    }

    public async Task<int> CreateSystemMessageAsync(int roomId, int userId, string content)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO ChatMessages (RoomId, UserId, Nickname, Content, CreatedAt)
              OUTPUT INSERTED.Id
              VALUES (@RoomId, @UserId, N'系统', @Content, GETDATE())",
            new { RoomId = roomId, UserId = userId, Content = content });
    }

    public async Task<List<ChatMessage>> GetMessagesAsync(int roomId, int limit = 50)
    {
        using var conn = CreateConnection();
        var messages = await conn.QueryAsync<ChatMessage>(
            @"SELECT TOP (@Limit) * FROM ChatMessages
              WHERE RoomId = @RoomId
              ORDER BY CreatedAt DESC",
            new { RoomId = roomId, Limit = limit });
        return messages.Reverse().ToList();
    }
}
