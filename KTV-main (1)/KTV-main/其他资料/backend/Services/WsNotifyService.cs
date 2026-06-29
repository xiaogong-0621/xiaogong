using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace backend.Services;

public class WsNotifyService
{
    private readonly ConcurrentDictionary<int, ConcurrentDictionary<string, WebSocket>> _connections = new();
    private readonly ILogger<WsNotifyService> _logger;

    public WsNotifyService(ILogger<WsNotifyService> logger)
    {
        _logger = logger;
    }

    public string AddConnection(int roomId, WebSocket socket)
    {
        var dict = _connections.GetOrAdd(roomId, _ => new ConcurrentDictionary<string, WebSocket>());
        var id = Guid.NewGuid().ToString("N");
        dict.TryAdd(id, socket);
        _logger.LogInformation("WS client {Id} joined room {RoomId} (total in room: {Count})", id, roomId, dict.Count);
        return id;
    }

    public void RemoveConnection(int roomId, string connectionId)
    {
        if (_connections.TryGetValue(roomId, out var dict))
        {
            dict.TryRemove(connectionId, out _);
            _logger.LogInformation("WS client {Id} left room {RoomId}", connectionId, roomId);
        }
    }

    public async Task BroadcastToRoom(int roomId, string type, object? data)
    {
        if (!_connections.TryGetValue(roomId, out var dict) || dict.IsEmpty)
            return;

        var message = JsonSerializer.Serialize(new { type, data });
        var bytes = Encoding.UTF8.GetBytes(message);
        var segment = new ArraySegment<byte>(bytes);

        var deadConnections = new List<string>();

        foreach (var (cid, ws) in dict)
        {
            if (ws.State == WebSocketState.Open)
            {
                try
                {
                    await ws.SendAsync(segment, WebSocketMessageType.Text, true, CancellationToken.None);
                }
                catch
                {
                    deadConnections.Add(cid);
                }
            }
            else
            {
                deadConnections.Add(cid);
            }
        }

        foreach (var cid in deadConnections)
        {
            dict.TryRemove(cid, out _);
        }
    }
}
