namespace backend.DTOs;

public record CreateFeedbackRequest(string FeedbackType, string? SongName, string? Artist, string? Description);
public record ProcessFeedbackRequest();
