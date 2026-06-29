using backend.Models;

namespace backend.Repositories;

public interface ISongRepository
{
    Task<Song?> GetByIdAsync(int id);
    Task<PaginatedResult<Song>> GetListAsync(string? search, string? genre, string? status, int page, int pageSize);
    Task<int> CreateAsync(Song song);
    Task UpdateAsync(Song song);
    Task DeleteAsync(int id);
    Task<List<string>> GetGenresAsync();
    Task<SongStats> GetStatsAsync();
    Task IncrementPlayCountAsync(int songId);
    Task<int> GetFavoriteCountAsync(int songId);
    Task<int> GetRankingAsync(int songId);
}
