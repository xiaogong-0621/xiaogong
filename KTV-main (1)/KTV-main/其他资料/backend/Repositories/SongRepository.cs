using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class SongRepository : ISongRepository
{
    private readonly string _connStr;
    public SongRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<Song?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<Song>(
            "SELECT * FROM Songs WHERE Id = @Id", new { Id = id });
    }

    public async Task<PaginatedResult<Song>> GetListAsync(string? search, string? genre, string? status, int page, int pageSize)
    {
        using var conn = CreateConnection();
        var where = "WHERE 1=1";
        var parameters = new DynamicParameters();

        if (string.IsNullOrEmpty(status))
        {
            // 空字符串 = 全部状态，不加状态筛选
        }
        else
        {
            where += " AND Status = @Status";
            parameters.Add("Status", status);
        }
        {
            where += " AND (Title LIKE @Search OR Artist LIKE @Search)";
            parameters.Add("Search", $"%{search}%");
        }
        if (!string.IsNullOrEmpty(genre) && genre != "all")
        {
            where += " AND Genre = @Genre";
            parameters.Add("Genre", genre);
        }

        var total = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM Songs {where}", parameters);
        parameters.Add("Offset", (page - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var items = await conn.QueryAsync<Song>(
            $"SELECT * FROM Songs {where} ORDER BY PlayCount DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY",
            parameters);

        return new PaginatedResult<Song> { Items = items.ToList(), Total = total, Page = page, PageSize = pageSize };
    }

    public async Task<int> CreateAsync(Song song)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO Songs (Title, Artist, Genre, Language, Duration, FileSize, CoverUrl, MediaUrl, LrcUrl, OriginalFileName, PlayCount, Status)
              OUTPUT INSERTED.Id
              VALUES (@Title, @Artist, @Genre, @Language, @Duration, @FileSize, @CoverUrl, @MediaUrl, @LrcUrl, @OriginalFileName, 0, 'active')", song);
    }

    public async Task UpdateAsync(Song song)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            @"UPDATE Songs SET Title=@Title, Artist=@Artist, Genre=@Genre, Language=@Language, Duration=@Duration,
              FileSize=@FileSize, CoverUrl=@CoverUrl, MediaUrl=@MediaUrl, LrcUrl=@LrcUrl, OriginalFileName=@OriginalFileName, Status=@Status, UpdatedAt=GETDATE()
              WHERE Id=@Id", song);
    }

    public async Task<int> GetFavoriteCountAsync(int songId)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Favorites WHERE SongId = @SongId", new { SongId = songId });
    }

    public async Task<int> GetRankingAsync(int songId)
    {
        using var conn = CreateConnection();
        var song = await GetByIdAsync(songId);
        if (song == null) return 0;
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) + 1 FROM Songs WHERE PlayCount > @PlayCount AND Status = 'active'",
            new { song.PlayCount });
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync("DELETE FROM Favorites WHERE SongId = @Id", new { Id = id });
        await conn.ExecuteAsync("DELETE FROM PlayQueue WHERE SongId = @Id", new { Id = id });
        await conn.ExecuteAsync("DELETE FROM Songs WHERE Id = @Id", new { Id = id });
    }

    public async Task<List<string>> GetGenresAsync()
    {
        using var conn = CreateConnection();
        var genres = await conn.QueryAsync<string>(
            "SELECT DISTINCT Genre FROM Songs WHERE Status = 'active' AND Genre IS NOT NULL AND Genre != '' ORDER BY Genre");
        return genres.ToList();
    }

    public async Task<SongStats> GetStatsAsync()
    {
        using var conn = CreateConnection();
        var total = await conn.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Songs");
        var weeklyNew = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Songs WHERE CreatedAt >= DATEADD(day, -7, GETDATE())");
        var todayPlays = await conn.ExecuteScalarAsync<int>(
            "SELECT ISNULL(SUM(PlayCount), 0) FROM Songs WHERE Status = 'active'");

        return new SongStats { TotalSongs = total, WeeklyNew = weeklyNew, TodayPlays = todayPlays };
    }

    public async Task IncrementPlayCountAsync(int songId)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE Songs SET PlayCount = PlayCount + 1, UpdatedAt = GETDATE() WHERE Id = @Id",
            new { Id = songId });
    }
}
