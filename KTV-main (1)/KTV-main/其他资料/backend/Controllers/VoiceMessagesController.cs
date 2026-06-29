using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Repositories;

namespace backend.Controllers;

[ApiController]
[Route("api/voice")]
[Authorize]
public class VoiceMessagesController : ControllerBase
{
    private readonly IVoiceMessageRepository _voiceRepo;
    private readonly IRoomUserRepository _roomUserRepo;
    private readonly IWebHostEnvironment _env;

    public VoiceMessagesController(
        IVoiceMessageRepository voiceRepo,
        IRoomUserRepository roomUserRepo,
        IWebHostEnvironment env)
    {
        _voiceRepo = voiceRepo;
        _roomUserRepo = roomUserRepo;
        _env = env;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    private string GetNickname() =>
        User.FindFirst("DisplayName")?.Value
        ?? User.FindFirst(ClaimTypes.Name)?.Value
        ?? "匿名";

    /// <summary>
    /// 上传语音消息
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(2 * 1024 * 1024)] // 2MB max
    public async Task<IActionResult> Upload([FromForm] int roomId, IFormFile file, [FromForm] int duration = 0)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "请选择语音文件" });

        // Validate file type
        var allowedTypes = new[] { "audio/webm", "audio/ogg", "audio/mp3", "audio/mpeg", "audio/wav", "audio/aac" };
        if (!allowedTypes.Contains(file.ContentType))
            return BadRequest(new { message = "不支持的音频格式" });

        var userId = GetUserId();

        // Check user is in this room
        var usersInRoom = await _roomUserRepo.GetUsersInRoomAsync(roomId);
        if (!usersInRoom.Any(u => u.Id == userId))
            return BadRequest(new { message = "你不在这个房间中" });

        // Save file
        var uploadsDir = Path.Combine(_env.WebRootPath, "uploads", "voice");
        if (!Directory.Exists(uploadsDir))
            Directory.CreateDirectory(uploadsDir);

        var fileName = $"{DateTime.Now:yyyyMMdd_HHmmss}_{userId}_{Guid.NewGuid():N}.webm";
        var filePath = Path.Combine(uploadsDir, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Save to database
        var message = new VoiceMessage
        {
            RoomId = roomId,
            UserId = userId,
            Nickname = GetNickname(),
            FileUrl = $"/uploads/voice/{fileName}",
            Duration = duration
        };

        var id = await _voiceRepo.CreateAsync(message);
        return Ok(new { id, fileUrl = message.FileUrl, duration });
    }

    /// <summary>
    /// 获取房间语音消息列表
    /// </summary>
    [HttpGet("messages")]
    public async Task<IActionResult> GetMessages([FromQuery] int roomId, [FromQuery] int limit = 50)
    {
        var messages = await _voiceRepo.GetByRoomIdAsync(roomId, limit);
        var result = messages.Select(m => new
        {
            id = m.Id,
            nickname = m.Nickname,
            fileUrl = m.FileUrl,
            duration = m.Duration,
            createdAt = TimeZoneInfo.ConvertTimeFromUtc(
                m.CreatedAt.ToUniversalTime(),
                TimeZoneInfo.CreateCustomTimeZone("Beijing", TimeSpan.FromHours(8), "Beijing Time", "Beijing Time")
            ).ToString("HH:mm")
        });
        return Ok(result);
    }
}
