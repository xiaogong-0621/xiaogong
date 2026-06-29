using backend.Models;
using backend.Repositories;
using backend.DTOs;

namespace backend.Services;

public class SongService
{
    private readonly ISongRepository _songRepo;
    private readonly IWebHostEnvironment _env;

    public SongService(ISongRepository songRepo, IWebHostEnvironment env)
    {
        _songRepo = songRepo;
        _env = env;
    }

    public async Task<PaginatedResult<Song>> GetListAsync(string? search, string? genre, string? status, int page, int pageSize)
    {
        return await _songRepo.GetListAsync(search, genre, status, page, pageSize);
    }

    public async Task<Song?> GetByIdAsync(int id)
    {
        return await _songRepo.GetByIdAsync(id);
    }

    public async Task<SongDetailResponse?> GetDetailAsync(int id)
    {
        var song = await _songRepo.GetByIdAsync(id);
        if (song == null) return null;

        var favoriteCount = await _songRepo.GetFavoriteCountAsync(id);
        var ranking = await _songRepo.GetRankingAsync(id);

        return new SongDetailResponse(
            song.Id, song.Title, song.Artist, song.Genre, song.Language, song.Duration, song.FileSize,
            song.CoverUrl, song.MediaUrl, song.LrcUrl, song.OriginalFileName, song.PlayCount, song.Status, song.CreatedAt, song.UpdatedAt,
            favoriteCount, ranking, Rating: 0, CommentCount: 0);
    }

    public async Task<int> CreateAsync(string title, string artist, string genre, string? language, int duration, long? fileSize, string? coverUrl, string? mediaUrl, string? lrcUrl, string? originalFileName)
    {
        var song = new Song
        {
            Title = title,
            Artist = artist,
            Genre = genre,
            Language = language,
            Duration = duration,
            FileSize = fileSize,
            CoverUrl = coverUrl,
            MediaUrl = mediaUrl,
            LrcUrl = lrcUrl,
            OriginalFileName = originalFileName
        };
        return await _songRepo.CreateAsync(song);
    }

    public async Task UpdateAsync(int id, string? title, string? artist, string? genre, string? language, int? duration, long? fileSize, string? coverUrl, string? mediaUrl, string? lrcUrl, string? status, string? originalFileName)
    {
        var song = await _songRepo.GetByIdAsync(id);
        if (song == null) throw new Exception("Song not found");

        // Delete old cover file if being replaced
        if (coverUrl != null && coverUrl != song.CoverUrl && !string.IsNullOrEmpty(song.CoverUrl))
            DeletePhysicalFile(song.CoverUrl);

        // Delete old media file if being replaced
        if (mediaUrl != null && mediaUrl != song.MediaUrl && !string.IsNullOrEmpty(song.MediaUrl))
            DeletePhysicalFile(song.MediaUrl);

        // Delete old lrc file if being replaced
        if (lrcUrl != null && lrcUrl != song.LrcUrl && !string.IsNullOrEmpty(song.LrcUrl))
            DeletePhysicalFile(song.LrcUrl);

        if (title != null) song.Title = title;
        if (artist != null) song.Artist = artist;
        if (genre != null) song.Genre = genre;
        if (language != null) song.Language = language;
        if (duration.HasValue) song.Duration = duration.Value;
        if (fileSize.HasValue) song.FileSize = fileSize.Value;
        if (coverUrl != null) song.CoverUrl = coverUrl;
        if (mediaUrl != null) song.MediaUrl = mediaUrl;
        if (lrcUrl != null) song.LrcUrl = lrcUrl;
        if (originalFileName != null) song.OriginalFileName = originalFileName;
        if (status != null) song.Status = status;

        await _songRepo.UpdateAsync(song);
    }

    public async Task DeleteAsync(int id)
    {
        var song = await _songRepo.GetByIdAsync(id);
        if (song != null)
        {
            if (!string.IsNullOrEmpty(song.CoverUrl))
                DeletePhysicalFile(song.CoverUrl);
            if (!string.IsNullOrEmpty(song.MediaUrl))
                DeletePhysicalFile(song.MediaUrl);
            if (!string.IsNullOrEmpty(song.LrcUrl))
                DeletePhysicalFile(song.LrcUrl);
        }
        await _songRepo.DeleteAsync(id);
    }

    public async Task<List<string>> GetGenresAsync()
    {
        return await _songRepo.GetGenresAsync();
    }

    public async Task<SongStats> GetStatsAsync()
    {
        return await _songRepo.GetStatsAsync();
    }

    private void DeletePhysicalFile(string url)
    {
        try
        {
            // url format: /uploads/covers/xxx.jpg or /uploads/music/xxx.mp3
            var relativePath = url.TrimStart('/');
            var fullPath = Path.Combine(_env.WebRootPath, relativePath);
            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
        catch
        {
            // Best-effort deletion, don't fail the request
        }
    }
}
