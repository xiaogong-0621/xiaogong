using backend.Models;

namespace backend.Repositories;

public interface IOperationLogRepository
{
    Task CreateAsync(OperationLog log);
    Task<PaginatedResult<OperationLog>> GetListAsync(string? operationType, string? username, DateTime? fromDate, DateTime? toDate, int page, int pageSize);
    Task<int> CleanupOldLogsAsync(int retentionDays);
}
