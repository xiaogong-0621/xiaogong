namespace backend.Models;

public class VoiceMessage
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public int UserId { get; set; }
    public string Nickname { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public int Duration { get; set; }
    public DateTime CreatedAt { get; set; }
}
