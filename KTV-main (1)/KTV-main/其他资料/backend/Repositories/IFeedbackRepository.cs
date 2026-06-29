namespace backend.Repositories;

using backend.Models;

public interface IFeedbackRepository
{
    Task<PaginatedResult<Feedback>> GetListAsync(string? status, string? search, int page, int pageSize);
    Task<int> CreateAsync(Feedback feedback);
    Task MarkProcessedAsync(int id);
    Task<int> GetPendingCountAsync();
}
