namespace backend.Models;

public class PlayQueueItem
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public int SongId { get; set; }
    public string SongTitle { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public string? MediaUrl { get; set; }
    public string? LrcUrl { get; set; }
    public int OrderedByUserId { get; set; }
    public string OrderedBy { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string Status { get; set; } = "queued";
    public DateTime CreatedAt { get; set; }
}
