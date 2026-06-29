namespace backend.DTOs;

public record SendMessageRequest(int RoomId, string Message);
public record ChatMessageResponse(int Id, string Nickname, string Message, string Timestamp);
