namespace backend.Models;

public class Notification
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = "system";
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public bool IsRead { get; set; }
    public int? RelatedId { get; set; }
    public string? RelatedType { get; set; }
    public DateTime CreatedAt { get; set; }
}
