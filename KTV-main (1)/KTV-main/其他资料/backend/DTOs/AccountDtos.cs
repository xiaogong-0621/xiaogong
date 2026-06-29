namespace backend.DTOs;

public record CreateAccountRequest(string Username, string Password, string DisplayName, string? Phone, string? AvatarUrl);
public record UpdateAccountRequest(string? DisplayName, string? Phone, string? AvatarUrl);
public record ChangePasswordRequest(string NewPassword);
