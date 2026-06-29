namespace backend.Models;

public class OperationLog
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string OperationType { get; set; } = string.Empty;
    public string ObjectType { get; set; } = string.Empty;
    public string? ObjectId { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; }
}
