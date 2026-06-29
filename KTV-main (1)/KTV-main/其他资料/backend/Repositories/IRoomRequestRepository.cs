namespace backend.Repositories;

using backend.Models;

public interface IRoomRequestRepository
{
    Task<RoomRequest?> GetByIdAsync(int id);
    Task<PaginatedResult<RoomRequest>> GetListAsync(string? status, int page, int pageSize);
    Task<int> CreateAsync(RoomRequest request);
    Task UpdateStatusAsync(int id, string status, int? roomId, int processedBy);
    Task<int> GetPendingCountAsync();
    Task<RoomRequest?> GetMyLatestRequestAsync(int userId);
}
