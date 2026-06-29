namespace backend.Models;

public class Song
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public string? Language { get; set; }
    public int Duration { get; set; }
    public long? FileSize { get; set; }
    public string? CoverUrl { get; set; }
    public string? MediaUrl { get; set; }
    public string? LrcUrl { get; set; }
    public string? OriginalFileName { get; set; }
    public int PlayCount { get; set; }
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
