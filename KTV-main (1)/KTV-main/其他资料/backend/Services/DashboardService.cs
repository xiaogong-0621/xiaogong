using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class DashboardService
{
    private readonly IRoomRepository _roomRepo;
    private readonly IUserRepository _userRepo;
    private readonly ISongRepository _songRepo;

    public DashboardService(
        IRoomRepository roomRepo,
        IUserRepository userRepo,
        ISongRepository songRepo)
    {
        _roomRepo = roomRepo;
        _userRepo = userRepo;
        _songRepo = songRepo;
    }

    public async Task<object> GetStatsAsync()
    {
        return new
        {
            activeRooms = await _roomRepo.GetActiveCountAsync(),
            onlineUsers = await _userRepo.GetOnlineCountAsync(),
            todayRooms = await _roomRepo.GetTodayCreatedCountAsync(),
            totalUsers = await _roomRepo.GetTotalCountAsync()
        };
    }

    public async Task<List<Song>> GetTopSongsAsync()
    {
        var result = await _songRepo.GetListAsync(null, null, "active", 1, 5);
        return result.Items;
    }

    public async Task<List<Room>> GetLatestRoomsAsync()
    {
        return await _roomRepo.GetLatestRoomsAsync(5);
    }
}
