namespace backend.Models;

public class Room
{
    public int Id { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public string Status { get; set; } = "active";
    public int CreatedByUserId { get; set; }
    public int CurrentUsers { get; set; }
    public DateTime? IdleCloseAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
}
