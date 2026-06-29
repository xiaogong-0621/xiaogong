using backend.Models;

namespace backend.Repositories;

public interface IChatRepository
{
    Task<int> CreateAsync(int roomId, int userId, string nickname, string content);
    Task<int> CreateSystemMessageAsync(int roomId, int userId, string content);
    Task<List<ChatMessage>> GetMessagesAsync(int roomId, int limit = 50);
}
