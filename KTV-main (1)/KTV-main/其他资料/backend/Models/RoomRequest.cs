namespace backend.Models;

public class RoomRequest
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; } = "pending";
    public int? RoomId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public int? ProcessedBy { get; set; }
    // Joined fields
    public string? Username { get; set; }
    public string? DisplayName { get; set; }
    public string? RoomCode { get; set; }
}
