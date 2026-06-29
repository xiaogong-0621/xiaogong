using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class FavoriteRepository : IFavoriteRepository
{
    private readonly string _connStr;
    public FavoriteRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<List<Favorite>> GetByUserIdAsync(int userId)
    {
        using var conn = CreateConnection();
        var items = await conn.QueryAsync<Favorite, Song, Favorite>(
            @"SELECT f.Id, f.UserId, f.SongId, f.CreatedAt,
                     s.Id, s.Title, s.Artist, s.Genre, s.Duration, s.CoverUrl, s.MediaUrl, s.PlayCount, s.Status, s.CreatedAt, s.UpdatedAt
              FROM Favorites f
              INNER JOIN Songs s ON f.SongId = s.Id
              WHERE f.UserId = @UserId
              ORDER BY f.CreatedAt DESC",
            (f, s) => { f.Song = s; return f; },
            new { UserId = userId });
        return items.ToList();
    }

    public async Task<int> AddAsync(int userId, int songId)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO Favorites (UserId, SongId)
              OUTPUT INSERTED.Id
              VALUES (@UserId, @SongId)",
            new { UserId = userId, SongId = songId });
    }

    public async Task RemoveAsync(int userId, int songId)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "DELETE FROM Favorites WHERE UserId = @UserId AND SongId = @SongId",
            new { UserId = userId, SongId = songId });
    }

    public async Task<bool> ExistsAsync(int userId, int songId)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<bool>(
            "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM Favorites WHERE UserId = @UserId AND SongId = @SongId",
            new { UserId = userId, SongId = songId });
    }
}
