using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class RoomRepository : IRoomRepository
{
    private readonly string _connStr;
    public RoomRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<Room?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Room>(
            "SELECT * FROM Rooms WHERE Id = @Id", new { Id = id });
    }

    public async Task<Room?> GetByCodeAsync(string roomCode)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Room>(
            "SELECT * FROM Rooms WHERE RoomCode = @RoomCode AND Status != 'closed'", new { RoomCode = roomCode });
    }

    public async Task<PaginatedResult<Room>> GetActiveRoomsAsync(string? search, string? status, int page, int pageSize)
    {
        using var conn = CreateConnection();
        var where = "WHERE Status != 'closed'";
        var parameters = new DynamicParameters();

        if (!string.IsNullOrEmpty(search))
        {
            where += " AND RoomCode LIKE @Search";
            parameters.Add("Search", $"%{search}%");
        }
        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            if (status == "active")
                where += " AND Status = 'active' AND CurrentUsers > 0";
            else if (status == "idle_closing")
                where += " AND (Status = 'idle_closing' OR (Status = 'active' AND CurrentUsers = 0))";
            else
                where += " AND Status = @Status";
        }

        var total = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM Rooms {where}", parameters);
        parameters.Add("Offset", (page - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var items = await conn.QueryAsync<Room>(
            $"SELECT * FROM Rooms {where} ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY",
            parameters);

        return new PaginatedResult<Room> { Items = items.ToList(), Total = total, Page = page, PageSize = pageSize };
    }

    public async Task<int> CreateAsync(string roomCode, int createdByUserId)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO Rooms (RoomCode, Status, CreatedByUserId, CurrentUsers, CreatedAt)
              OUTPUT INSERTED.Id
              VALUES (@RoomCode, 'active', @CreatedByUserId, 0, GETDATE())",
            new { RoomCode = roomCode, CreatedByUserId = createdByUserId });
    }

    public async Task UpdateStatusAsync(int id, string status)
    {
        using var conn = CreateConnection();
        if (status == "closed")
            await conn.ExecuteAsync(
                "UPDATE Rooms SET Status = @Status, ClosedAt = GETDATE() WHERE Id = @Id",
                new { Id = id, Status = status });
        else
            await conn.ExecuteAsync(
                "UPDATE Rooms SET Status = @Status WHERE Id = @Id",
                new { Id = id, Status = status });
    }

    public async Task UpdateUserCountAsync(int id, int delta)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE Rooms SET CurrentUsers = CurrentUsers + @Delta WHERE Id = @Id",
            new { Id = id, Delta = delta });
    }

    public async Task SetIdleCloseTimerAsync(int id, DateTime idleCloseAt)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE Rooms SET Status = 'idle_closing', IdleCloseAt = @IdleCloseAt WHERE Id = @Id",
            new { Id = id, IdleCloseAt = idleCloseAt });
    }

    public async Task ClearIdleCloseTimerAsync(int id)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE Rooms SET Status = 'active', IdleCloseAt = NULL WHERE Id = @Id AND Status != 'closed'",
            new { Id = id });
    }

    public async Task<int> GetActiveCountAsync()
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Rooms WHERE Status = 'active' AND CurrentUsers > 0");
    }

    public async Task<int> GetTotalUserCountAsync()
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT ISNULL(SUM(CurrentUsers), 0) FROM Rooms WHERE Status != 'closed'");
    }

    public async Task<int> GetTodayCreatedCountAsync()
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Rooms WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)");
    }

    public async Task<int> GetTotalCountAsync()
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Users WHERE Role = 'user'");
    }

    public async Task<List<Room>> GetLatestRoomsAsync(int count)
    {
        using var conn = CreateConnection();
        var rooms = await conn.QueryAsync<Room>(
            "SELECT TOP (@Count) * FROM Rooms WHERE Status != 'closed' ORDER BY CreatedAt DESC",
            new { Count = count });
        return rooms.ToList();
    }
}
