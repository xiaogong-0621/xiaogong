using backend.Models;

namespace backend.Repositories;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetByUsernameAsync(string username);
    Task<PaginatedResult<User>> GetListAsync(string? search, string? status, int page, int pageSize);
    Task<int> CreateAsync(User user);
    Task UpdateAsync(User user);
    Task<int> GetActiveCountAsync();
    Task<User?> GetAdminAsync();
    Task UpdateUsernameAsync(int id, string username);
    Task UpdatePasswordAsync(int id, string password);
    Task UpdateLastActiveAtAsync(int id, bool clear = false);
    Task<int> GetOnlineCountAsync();
    Task DeleteAsync(int id);
}
