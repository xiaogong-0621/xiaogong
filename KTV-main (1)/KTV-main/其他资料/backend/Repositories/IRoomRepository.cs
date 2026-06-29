using System.Data;
using backend.Models;

namespace backend.Repositories;

public interface IRoomRepository
{
    Task<Room?> GetByIdAsync(int id);
    Task<Room?> GetByCodeAsync(string roomCode);
    Task<PaginatedResult<Room>> GetActiveRoomsAsync(string? search, string? status, int page, int pageSize);
    Task<int> CreateAsync(string roomCode, int createdByUserId);
    Task UpdateStatusAsync(int id, string status);
    Task UpdateUserCountAsync(int id, int delta);
    Task SetIdleCloseTimerAsync(int id, DateTime idleCloseAt);
    Task ClearIdleCloseTimerAsync(int id);
    Task<int> GetActiveCountAsync();
    Task<int> GetTotalUserCountAsync();
    Task<int> GetTodayCreatedCountAsync();
    Task<int> GetTotalCountAsync();
    Task<List<Room>> GetLatestRoomsAsync(int count);
}
