namespace backend.DTOs;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, object User);
public record VerifyPasswordRequest(string Password);
public record RegisterRequest(string? Username, string? Phone, string? Email, string Password, string DisplayName);

// Profile
public record UserProfileResponse(
    int Id, string Username, string DisplayName, string? Phone, string? Email, string? AvatarUrl,
    DateTime CreatedAt, int SongCount, int FavoriteCount);

public record UpdateProfileRequest(string? DisplayName, string? Phone, string? Email);

public record UserChangePasswordRequest(string OldPassword, string NewPassword);

public record RecentSongDto(
    int SongId, string Title, string Artist, string? CoverUrl, DateTime OrderedAt, string Status);
