using backend.Services;

namespace backend.Repositories;

public interface IRoomUserRepository
{
    Task<int?> AddUserAsync(int roomId, int userId);
    Task RemoveUserAsync(int roomId, int userId);
    Task RemoveAllFromRoomAsync(int roomId);
    Task<List<RoomUserInfo>> GetUsersInRoomAsync(int roomId);
    Task<int> GetRoomUserCountAsync(int roomId);
}
