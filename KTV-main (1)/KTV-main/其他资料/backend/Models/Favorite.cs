namespace backend.Models;

public class Favorite
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int SongId { get; set; }
    public Song? Song { get; set; }
    public DateTime CreatedAt { get; set; }
}
