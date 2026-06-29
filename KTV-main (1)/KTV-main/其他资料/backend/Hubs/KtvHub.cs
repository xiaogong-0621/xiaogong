using Microsoft.AspNetCore.SignalR;
using backend.Services;
using backend.Repositories;
using System.Collections.Concurrent;

namespace backend.Hubs;

public class KtvHub : Hub
{
    private static readonly ConcurrentDictionary<string, (int roomId, string nickname, int userId)> _connections = new();

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<KtvHub> _logger;

    public KtvHub(IServiceProvider serviceProvider, ILogger<KtvHub> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public async Task JoinRoom(int roomId, string nickname)
    {
        try
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"room-{roomId}");

            var userIdClaim = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var userId = int.TryParse(userIdClaim, out var uid) ? uid : 0;

            if (userId > 0)
            {
                using var scope = _serviceProvider.CreateScope();
                var roomService = scope.ServiceProvider.GetRequiredService<RoomService>();
                await roomService.JoinRoomAsync(roomId, userId);
            }

            _connections[Context.ConnectionId] = (roomId, nickname, userId);

            // Insert system message for room entry
            if (userId > 0)
            {
                try
                {
                    using var chatScope = _serviceProvider.CreateScope();
                    var chatRepo = chatScope.ServiceProvider.GetRequiredService<IChatRepository>();
                    await chatRepo.CreateSystemMessageAsync(roomId, userId, $"{nickname} 进入了房间");
                }
                catch (Exception chatEx) { _logger.LogWarning(chatEx, "Failed to insert join system message"); }
            }

            await Clients.Group($"room-{roomId}").SendAsync("UserJoined", nickname);
            _logger.LogInformation("JoinRoom SUCCESS: roomId={RoomId}, userId={UserId}", roomId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "JoinRoom FAILED");
            throw new HubException("加入房间失败: " + ex.Message);
        }
    }

    public async Task LeaveRoom(int roomId, string nickname)
    {
        try
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"room-{roomId}");
            if (_connections.TryRemove(Context.ConnectionId, out var info) && info.userId > 0)
            {
                using var scope = _serviceProvider.CreateScope();
                var roomService = scope.ServiceProvider.GetRequiredService<RoomService>();
                await roomService.LeaveRoomAsync(roomId, info.userId);

                // Insert system message for room exit
                try
                {
                    var chatRepo = scope.ServiceProvider.GetRequiredService<IChatRepository>();
                    await chatRepo.CreateSystemMessageAsync(roomId, info.userId, $"{info.nickname} 退出了房间");
                }
                catch (Exception chatEx) { _logger.LogWarning(chatEx, "Failed to insert leave system message"); }
            }
            await Clients.Group($"room-{roomId}").SendAsync("UserLeft", nickname);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "LeaveRoom FAILED");
        }
    }

    public async Task NotifyQueueUpdated(int roomId)
    {
        await Clients.Group($"room-{roomId}").SendAsync("QueueUpdated");
    }

    public async Task NotifyRoomClosed(int roomId)
    {
        await Clients.Group($"room-{roomId}").SendAsync("RoomClosed");
    }

    public async Task NotifyRoomApproved(string connectionId, string roomCode)
    {
        await Clients.Client(connectionId).SendAsync("RoomApproved", roomCode);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        if (_connections.TryRemove(Context.ConnectionId, out var info))
        {
            if (info.userId > 0)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var roomService = scope.ServiceProvider.GetRequiredService<RoomService>();
                    await roomService.LeaveRoomAsync(info.roomId, info.userId);

                    // Insert system message for unexpected disconnect
                    try
                    {
                        var chatRepo = scope.ServiceProvider.GetRequiredService<IChatRepository>();
                        await chatRepo.CreateSystemMessageAsync(info.roomId, info.userId, $"{info.nickname} 退出了房间");
                    }
                    catch (Exception chatEx) { _logger.LogWarning(chatEx, "Failed to insert disconnect system message"); }
                }
                catch (Exception ex) { _logger.LogError(ex, "Failed to decrement on disconnect"); }
            }
        }
        await base.OnDisconnectedAsync(exception);
    }
}
