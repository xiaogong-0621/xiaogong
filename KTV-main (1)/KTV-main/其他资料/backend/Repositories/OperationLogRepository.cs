using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class OperationLogRepository : IOperationLogRepository
{
    private readonly string _connStr;
    public OperationLogRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task CreateAsync(OperationLog log)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            @"INSERT INTO OperationLogs (Username, OperationType, ObjectType, ObjectId, Details)
              VALUES (@Username, @OperationType, @ObjectType, @ObjectId, @Details)",
            log);
    }

    public async Task<PaginatedResult<OperationLog>> GetListAsync(
        string? operationType, string? username, DateTime? fromDate, DateTime? toDate, int page, int pageSize)
    {
        using var conn = CreateConnection();
        var where = "WHERE 1=1";
        var parameters = new DynamicParameters();

        if (!string.IsNullOrEmpty(operationType))
        {
            where += " AND OperationType = @OperationType";
            parameters.Add("OperationType", operationType);
        }

        if (!string.IsNullOrEmpty(username))
        {
            where += " AND Username LIKE @Username";
            parameters.Add("Username", $"%{username}%");
        }

        if (fromDate.HasValue)
        {
            where += " AND CreatedAt >= @FromDate";
            parameters.Add("FromDate", fromDate.Value);
        }

        if (toDate.HasValue)
        {
            where += " AND CreatedAt < @ToDate";
            parameters.Add("ToDate", toDate.Value.AddDays(1));
        }

        var total = await conn.ExecuteScalarAsync<int>(
            $"SELECT COUNT(*) FROM OperationLogs {where}", parameters);

        parameters.Add("Offset", (page - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var items = await conn.QueryAsync<OperationLog>(
            $@"SELECT * FROM OperationLogs {where}
               ORDER BY CreatedAt DESC
               OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY",
            parameters);

        return new PaginatedResult<OperationLog>
        {
            Items = items.ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<int> CleanupOldLogsAsync(int retentionDays)
    {
        if (retentionDays <= 0) return 0;
        using var conn = CreateConnection();
        return await conn.ExecuteAsync(
            "DELETE FROM OperationLogs WHERE CreatedAt < DATEADD(DAY, -@Days, GETDATE())",
            new { Days = retentionDays });
    }
}
