using backend.Models;

namespace backend.Repositories;

public interface IFavoriteRepository
{
    Task<List<Favorite>> GetByUserIdAsync(int userId);
    Task<int> AddAsync(int userId, int songId);
    Task RemoveAsync(int userId, int songId);
    Task<bool> ExistsAsync(int userId, int songId);
}
