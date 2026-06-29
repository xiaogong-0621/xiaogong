using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Repositories;

namespace backend.Controllers;

[ApiController]
[Route("api/chat")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatRepository _chatRepo;

    public ChatController(IChatRepository chatRepo)
    {
        _chatRepo = chatRepo;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    private string GetNickname() =>
        User.FindFirst("DisplayName")?.Value
        ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
        ?? "匿名";

    [HttpPost("send")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { message = "消息不能为空" });
        if (request.Message.Length > 200)
            return BadRequest(new { message = "消息长度不能超过200字符" });

        var userId = GetUserId();
        var nickname = GetNickname();
        var id = await _chatRepo.CreateAsync(request.RoomId, userId, nickname, request.Message);
        return Ok(new { id });
    }

    [HttpGet("messages")]
    public async Task<IActionResult> GetMessages([FromQuery] int roomId, [FromQuery] int limit = 50)
    {
        var messages = await _chatRepo.GetMessagesAsync(roomId, limit);
        var result = messages.Select(m => new ChatMessageResponse(
            m.Id,
            m.Nickname,
            m.Content,
            TimeZoneInfo.ConvertTimeFromUtc(m.CreatedAt.ToUniversalTime(), TimeZoneInfo.CreateCustomTimeZone("Beijing", TimeSpan.FromHours(8), "Beijing Time", "Beijing Time")).ToString("HH:mm")
        ));
        return Ok(result);
    }
}
