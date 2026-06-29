using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class RoomRequestService
{
    private readonly IRoomRequestRepository _requestRepo;
    private readonly IRoomRepository _roomRepo;
    private readonly NotificationService _notificationService;

    public RoomRequestService(IRoomRequestRepository requestRepo, IRoomRepository roomRepo, NotificationService notificationService)
    {
        _requestRepo = requestRepo;
        _roomRepo = roomRepo;
        _notificationService = notificationService;
    }

    public async Task<PaginatedResult<RoomRequest>> GetListAsync(string? status, int page, int pageSize)
    {
        return await _requestRepo.GetListAsync(status, page, pageSize);
    }

    public async Task<int> CreateAsync(int userId)
    {
        var request = new RoomRequest { UserId = userId };
        return await _requestRepo.CreateAsync(request);
    }

    public async Task<Room> ApproveAsync(int requestId, int adminId)
    {
        var request = await _requestRepo.GetByIdAsync(requestId);
        if (request == null) throw new Exception("申请不存在");
        if (request.Status != "pending") throw new Exception("该申请已处理");

        // Generate 6-char room code
        var roomCode = GenerateRoomCode();
        var roomId = await _roomRepo.CreateAsync(roomCode, request.UserId);
        await _requestRepo.UpdateStatusAsync(requestId, "approved", roomId, adminId);

        // 房间创建时无人，立即开始30秒倒计时
        await _roomRepo.SetIdleCloseTimerAsync(roomId, DateTime.Now.AddSeconds(30));

        // 创建审核通过通知
        await _notificationService.CreateNotificationAsync(
            request.UserId,
            "room_approved",
            "房间申请已通过",
            $"您的房间申请已通过，房间码为 {roomCode}，快去加入吧！",
            roomId,
            "room"
        );

        return (await _roomRepo.GetByIdAsync(roomId))!;
    }

    public async Task RejectAsync(int requestId, int adminId)
    {
        var request = await _requestRepo.GetByIdAsync(requestId);
        if (request == null) throw new Exception("申请不存在");
        if (request.Status != "pending") throw new Exception("该申请已处理");

        await _requestRepo.UpdateStatusAsync(requestId, "rejected", null, adminId);

        // 创建审核拒绝通知
        await _notificationService.CreateNotificationAsync(
            request.UserId,
            "room_rejected",
            "房间申请被拒绝",
            "很抱歉，您的房间申请未通过审核，请稍后再试。",
            null,
            "room_request"
        );
    }

    public async Task<int> GetPendingCountAsync()
    {
        return await _requestRepo.GetPendingCountAsync();
    }

    public async Task<RoomRequest?> GetMyLatestRequestAsync(int userId)
    {
        return await _requestRepo.GetMyLatestRequestAsync(userId);
    }

    private static string GenerateRoomCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        var random = new Random();
        return new string(Enumerable.Range(0, 6).Select(_ => chars[random.Next(chars.Length)]).ToArray());
    }
}
