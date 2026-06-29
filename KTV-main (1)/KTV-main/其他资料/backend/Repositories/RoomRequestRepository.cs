using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class RoomRequestRepository : IRoomRequestRepository
{
    private readonly string _connStr;
    public RoomRequestRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<RoomRequest?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<RoomRequest>(
            "SELECT * FROM RoomRequests WHERE Id = @Id", new { Id = id });
    }

    public async Task<PaginatedResult<RoomRequest>> GetListAsync(string? status, int page, int pageSize)
    {
        using var conn = CreateConnection();
        var where = "WHERE 1=1";
        var parameters = new DynamicParameters();

        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            where += " AND rr.Status = @Status";
            parameters.Add("Status", status);
        }

        var total = await conn.ExecuteScalarAsync<int>(
            $"SELECT COUNT(*) FROM RoomRequests rr {where}", parameters);

        parameters.Add("Offset", (page - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var items = await conn.QueryAsync<RoomRequest>(
            $@"SELECT rr.*, u.Username, u.DisplayName, r.RoomCode
               FROM RoomRequests rr
               LEFT JOIN Users u ON rr.UserId = u.Id
               LEFT JOIN Rooms r ON rr.RoomId = r.Id
               {where}
               ORDER BY rr.CreatedAt DESC
               OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY",
            parameters);

        return new PaginatedResult<RoomRequest> { Items = items.ToList(), Total = total, Page = page, PageSize = pageSize };
    }

    public async Task<int> CreateAsync(RoomRequest request)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO RoomRequests (UserId, Status, CreatedAt)
              OUTPUT INSERTED.Id
              VALUES (@UserId, @Status, GETDATE())",
            new { request.UserId, request.Status });
    }

    public async Task UpdateStatusAsync(int id, string status, int? roomId, int processedBy)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            @"UPDATE RoomRequests
              SET Status = @Status, RoomId = @RoomId, ProcessedAt = GETDATE(), ProcessedBy = @ProcessedBy
              WHERE Id = @Id",
            new { Id = id, Status = status, RoomId = roomId, ProcessedBy = processedBy });
    }

    public async Task<int> GetPendingCountAsync()
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM RoomRequests WHERE Status = 'pending'");
    }

    public async Task<RoomRequest?> GetMyLatestRequestAsync(int userId)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<RoomRequest>(
            @"SELECT TOP 1 * FROM RoomRequests
              WHERE UserId = @UserId
              ORDER BY CreatedAt DESC",
            new { UserId = userId });
    }
}
