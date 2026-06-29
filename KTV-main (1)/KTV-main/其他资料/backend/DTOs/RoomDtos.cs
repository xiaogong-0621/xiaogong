namespace backend.DTOs;

public record UpdateRoomStatusRequest(string Status);
public record CloseRoomRequest(string? Password);
public record CreateRoomRequest(string? Password);
public record JoinRoomRequest(string RoomCode);
