namespace backend.Models;

public class Feedback
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FeedbackType { get; set; } = string.Empty;
    public string? SongName { get; set; }
    public string? Artist { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    // Joined fields
    public string? Username { get; set; }
    public string? DisplayName { get; set; }
}
