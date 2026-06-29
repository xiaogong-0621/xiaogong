using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using backend.Repositories;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly IUserRepository _userRepo;
    private readonly IFavoriteRepository _favoriteRepo;
    private readonly IPlayQueueRepository _queueRepo;

    public AuthController(AuthService authService, IUserRepository userRepo,
        IFavoriteRepository favoriteRepo, IPlayQueueRepository queueRepo)
    {
        _authService = authService;
        _userRepo = userRepo;
        _favoriteRepo = favoriteRepo;
        _queueRepo = queueRepo;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request.Username, request.Password);
        if (result == null) return Unauthorized(new { message = "用户名或密码错误" });
        return Ok(new { token = result.Value.Token, user = result.Value.User });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // At least one of username/phone/email must be provided
        if (string.IsNullOrEmpty(request.Username) && string.IsNullOrEmpty(request.Phone) && string.IsNullOrEmpty(request.Email))
            return BadRequest(new { message = "请至少填写一种注册方式（用户名/手机号/邮箱）" });

        if (string.IsNullOrEmpty(request.Password))
            return BadRequest(new { message = "密码不能为空" });

        if (string.IsNullOrEmpty(request.DisplayName))
            return BadRequest(new { message = "昵称不能为空" });

        // Check uniqueness
        if (!string.IsNullOrEmpty(request.Username))
        {
            var existing = await _userRepo.GetByUsernameAsync(request.Username);
            if (existing != null) return BadRequest(new { message = "用户名已存在" });
        }

        var user = new User
        {
            Username = request.Username ?? "",
            PasswordHash = request.Password, // Note: course project, not hashing
            DisplayName = request.DisplayName,
            Phone = request.Phone,
            Email = request.Email,
            Role = "user",
            Status = "active",
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        var id = await _userRepo.CreateAsync(user);
        return Ok(new { id, message = "注册成功" });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        if (userId > 0)
            await _userRepo.UpdateLastActiveAtAsync(userId, clear: true);
        return Ok();
    }

    [HttpGet("me")]
    public IActionResult GetMe() => Ok(new { message = "TODO: get from JWT claims" });

    [HttpPost("verify-password")]
    [Authorize]
    public async Task<IActionResult> VerifyPassword([FromBody] VerifyPasswordRequest request)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var valid = await _authService.VerifyPasswordAsync(userId, request.Password);
        if (!valid) return Unauthorized(new { message = "密码错误" });
        return Ok();
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userId = GetUserId();
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) return NotFound();

        var songCount = await _queueRepo.GetCountByUserIdAsync(userId);
        var favorites = await _favoriteRepo.GetByUserIdAsync(userId);

        return Ok(new UserProfileResponse(
            user.Id, user.Username, user.DisplayName, user.Phone, user.Email,
            user.AvatarUrl, user.CreatedAt, songCount, favorites.Count));
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserId();
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.DisplayName))
            user.DisplayName = request.DisplayName;
        user.Phone = request.Phone;
        user.Email = request.Email;
        user.UpdatedAt = DateTime.Now;

        await _userRepo.UpdateAsync(user);
        return Ok(new { message = "资料已更新" });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] UserChangePasswordRequest request)
    {
        var userId = GetUserId();

        if (string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { message = "新密码不能为空" });

        var valid = await _authService.VerifyPasswordAsync(userId, request.OldPassword);
        if (!valid) return Unauthorized(new { message = "原密码错误" });

        await _userRepo.UpdatePasswordAsync(userId, request.NewPassword);
        return Ok(new { message = "密码已修改" });
    }

    [HttpGet("recent-songs")]
    [Authorize]
    public async Task<IActionResult> GetRecentSongs([FromQuery] int count = 5)
    {
        var userId = GetUserId();
        var items = await _queueRepo.GetRecentByUserIdAsync(userId, count);
        var result = items.Select(i => new RecentSongDto(
            i.SongId, i.SongTitle, i.Artist, i.CoverUrl, i.CreatedAt, i.Status));
        return Ok(result);
    }
}
