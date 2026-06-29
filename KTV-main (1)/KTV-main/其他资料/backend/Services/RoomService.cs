using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class RoomService
{
    private readonly IRoomRepository _roomRepo;
    private readonly IRoomUserRepository _roomUserRepo;
    private readonly string _connStr;

    public RoomService(IRoomRepository roomRepo, IRoomUserRepository roomUserRepo, string connStr)
    {
        _roomRepo = roomRepo;
        _roomUserRepo = roomUserRepo;
        _connStr = connStr;
    }

    public async Task<PaginatedResult<Room>> GetActiveRoomsAsync(string? search, string? status, int page, int pageSize)
    {
        return await _roomRepo.GetActiveRoomsAsync(search, status, page, pageSize);
    }

    public async Task<Room?> GetByIdAsync(int id)
    {
        return await _roomRepo.GetByIdAsync(id);
    }

    public async Task<Room?> GetByCodeAsync(string roomCode)
    {
        return await _roomRepo.GetByCodeAsync(roomCode);
    }

    public async Task<Room> CreateRoomAsync(int userId)
    {
        var roomCode = GenerateRoomCode();
        var roomId = await _roomRepo.CreateAsync(roomCode, userId);
        return (await _roomRepo.GetByIdAsync(roomId))!;
    }

    public async Task CloseRoomAsync(int roomId)
    {
        var room = await _roomRepo.GetByIdAsync(roomId);
        if (room == null) throw new Exception("房间不存在");
        await _roomUserRepo.RemoveAllFromRoomAsync(roomId);
        using var conn = new SqlConnection(_connStr);
        await conn.ExecuteAsync(
            "UPDATE Rooms SET Status = 'closed', ClosedAt = GETDATE(), CurrentUsers = 0 WHERE Id = @Id",
            new { Id = roomId });
    }

    public async Task JoinRoomAsync(int roomId, int userId)
    {
        var oldRoomId = await _roomUserRepo.AddUserAsync(roomId, userId);
        await SyncUserCountAsync(roomId);
        // Sync old room count if user moved from another room
        if (oldRoomId.HasValue && oldRoomId.Value != roomId)
        {
            await SyncUserCountAsync(oldRoomId.Value);
        }
        await _roomRepo.ClearIdleCloseTimerAsync(roomId);
    }

    public async Task LeaveRoomAsync(int roomId, int userId)
    {
        var room = await _roomRepo.GetByIdAsync(roomId);
        if (room == null || room.Status == "closed") return;

        await _roomUserRepo.RemoveUserAsync(roomId, userId);
        var count = await _roomUserRepo.GetRoomUserCountAsync(roomId);
        await SetUserCountAsync(roomId, count);
        if (count <= 0)
        {
            await _roomRepo.SetIdleCloseTimerAsync(roomId, DateTime.Now.AddSeconds(30));
        }
    }

    public async Task<List<RoomUserInfo>> GetRoomUsersAsync(int roomId)
    {
        return await _roomUserRepo.GetUsersInRoomAsync(roomId);
    }

    public async Task SyncUserCountAsync(int roomId)
    {
        var count = await _roomUserRepo.GetRoomUserCountAsync(roomId);
        await SetUserCountAsync(roomId, count);
    }

    private async Task SetUserCountAsync(int roomId, int count)
    {
        using var conn = new SqlConnection(_connStr);
        await conn.ExecuteAsync(
            "UPDATE Rooms SET CurrentUsers = @Count WHERE Id = @Id",
            new { Id = roomId, Count = count });
    }

    public async Task<object> GetDashboardStatsAsync()
    {
        return new
        {
            activeRooms = await _roomRepo.GetActiveCountAsync(),
            onlineUsers = await _roomRepo.GetTotalUserCountAsync(),
            todayRooms = await _roomRepo.GetTodayCreatedCountAsync(),
            totalUsers = await _roomRepo.GetTotalCountAsync()
        };
    }

    private static string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = new Random();
        return new string(Enumerable.Range(0, 6).Select(_ => chars[random.Next(chars.Length)]).ToArray());
    }
}

public class RoomUserInfo
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string? AvatarUrl { get; set; }
}
