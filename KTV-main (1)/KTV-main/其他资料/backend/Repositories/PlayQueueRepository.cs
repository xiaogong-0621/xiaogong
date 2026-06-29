using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class PlayQueueRepository : IPlayQueueRepository
{
    private readonly string _connStr;
    public PlayQueueRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<List<PlayQueueItem>> GetByRoomIdAsync(int roomId)
    {
        using var conn = CreateConnection();
        var items = await conn.QueryAsync<PlayQueueItem>(
            @"SELECT pq.Id, pq.RoomId, pq.SongId, s.Title AS SongTitle, s.Artist, s.CoverUrl, s.MediaUrl, s.LrcUrl,
                     pq.OrderedByUserId, u.DisplayName AS OrderedBy, pq.SortOrder, pq.Status, pq.CreatedAt
              FROM PlayQueue pq
              INNER JOIN Songs s ON pq.SongId = s.Id
              INNER JOIN Users u ON pq.OrderedByUserId = u.Id
              WHERE pq.RoomId = @RoomId AND pq.Status = 'queued'
              ORDER BY pq.SortOrder ASC",
            new { RoomId = roomId });
        return items.ToList();
    }

    public async Task<PlayQueueItem?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<PlayQueueItem>(
            @"SELECT pq.Id, pq.RoomId, pq.SongId, s.Title AS SongTitle, s.Artist, s.CoverUrl, s.MediaUrl, s.LrcUrl,
                     pq.OrderedByUserId, u.DisplayName AS OrderedBy, pq.SortOrder, pq.Status, pq.CreatedAt
              FROM PlayQueue pq
              INNER JOIN Songs s ON pq.SongId = s.Id
              INNER JOIN Users u ON pq.OrderedByUserId = u.Id
              WHERE pq.Id = @Id",
            new { Id = id });
    }

    public async Task<int> AddAsync(PlayQueueItem item)
    {
        using var conn = CreateConnection();
        var maxOrder = await conn.ExecuteScalarAsync<int?>(
            "SELECT MAX(SortOrder) FROM PlayQueue WHERE RoomId = @RoomId AND Status = 'queued'",
            new { item.RoomId }) ?? 0;
        item.SortOrder = maxOrder + 1;

        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO PlayQueue (RoomId, SongId, OrderedByUserId, SortOrder, Status)
              OUTPUT INSERTED.Id
              VALUES (@RoomId, @SongId, @OrderedByUserId, @SortOrder, 'queued')",
            item);
    }

    public async Task RemoveAsync(int id)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE PlayQueue SET Status = 'removed' WHERE Id = @Id",
            new { Id = id });
    }

    public async Task ReorderAsync(int queueId, int newOrder)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE PlayQueue SET SortOrder = @NewOrder WHERE Id = @Id",
            new { Id = queueId, NewOrder = newOrder });
    }

    public async Task ReorderBatchAsync(List<int> queueIds)
    {
        using var conn = CreateConnection();
        await conn.OpenAsync();
        using var tran = conn.BeginTransaction();
        for (int i = 0; i < queueIds.Count; i++)
        {
            await conn.ExecuteAsync(
                "UPDATE PlayQueue SET SortOrder = @Order WHERE Id = @Id",
                new { Id = queueIds[i], Order = i + 1 }, tran);
        }
        tran.Commit();
    }

    public async Task MarkAsPlayedAsync(int id)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE PlayQueue SET Status = 'played' WHERE Id = @Id",
            new { Id = id });
    }

    public async Task MarkRoomPlayedAsync(int roomId)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE PlayQueue SET Status = 'played' WHERE RoomId = @RoomId AND Status = 'queued'",
            new { RoomId = roomId });
    }

    public async Task<int> GetCountByUserIdAsync(int userId)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM PlayQueue WHERE OrderedByUserId = @UserId",
            new { UserId = userId });
    }

    public async Task<List<PlayQueueItem>> GetRecentByUserIdAsync(int userId, int count)
    {
        using var conn = CreateConnection();
        var items = await conn.QueryAsync<PlayQueueItem>(
            @"SELECT TOP(@Count) pq.Id, pq.RoomId, pq.SongId, s.Title AS SongTitle, s.Artist, s.CoverUrl,
                     pq.OrderedByUserId, u.DisplayName AS OrderedBy, pq.Status, pq.CreatedAt
              FROM PlayQueue pq
              INNER JOIN Songs s ON pq.SongId = s.Id
              INNER JOIN Users u ON pq.OrderedByUserId = u.Id
              WHERE pq.OrderedByUserId = @UserId
              ORDER BY pq.CreatedAt DESC",
            new { UserId = userId, Count = count });
        return items.ToList();
    }
}
