using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class FeedbackRepository : IFeedbackRepository
{
    private readonly string _connStr;
    public FeedbackRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<PaginatedResult<Feedback>> GetListAsync(string? status, string? search, int page, int pageSize)
    {
        using var conn = CreateConnection();
        var where = "WHERE 1=1";
        var parameters = new DynamicParameters();

        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            where += " AND f.Status = @Status";
            parameters.Add("Status", status);
        }
        if (!string.IsNullOrEmpty(search))
        {
            where += " AND (f.SongName LIKE @Search OR u.DisplayName LIKE @Search)";
            parameters.Add("Search", $"%{search}%");
        }

        var total = await conn.ExecuteScalarAsync<int>(
            $"SELECT COUNT(*) FROM Feedbacks f LEFT JOIN Users u ON f.UserId = u.Id {where}", parameters);

        parameters.Add("Offset", (page - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var items = await conn.QueryAsync<Feedback>(
            $@"SELECT f.*, u.Username, u.DisplayName
               FROM Feedbacks f
               LEFT JOIN Users u ON f.UserId = u.Id
               {where}
               ORDER BY f.CreatedAt DESC
               OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY",
            parameters);

        return new PaginatedResult<Feedback> { Items = items.ToList(), Total = total, Page = page, PageSize = pageSize };
    }

    public async Task<int> CreateAsync(Feedback feedback)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO Feedbacks (UserId, FeedbackType, SongName, Artist, Description, Status, CreatedAt)
              OUTPUT INSERTED.Id
              VALUES (@UserId, @FeedbackType, @SongName, @Artist, @Description, 'pending', GETDATE())",
            feedback);
    }

    public async Task MarkProcessedAsync(int id)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE Feedbacks SET Status = 'processed', ProcessedAt = GETDATE() WHERE Id = @Id",
            new { Id = id });
    }

    public async Task<int> GetPendingCountAsync()
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Feedbacks WHERE Status = 'pending'");
    }
}
