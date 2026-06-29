using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FeedbacksController : ControllerBase
{
    private readonly FeedbackService _feedbackService;

    public FeedbacksController(FeedbackService feedbackService) => _feedbackService = feedbackService;

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? status, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _feedbackService.GetListAsync(status, search, page, pageSize);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFeedbackRequest request)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var id = await _feedbackService.CreateAsync(userId, request.FeedbackType, request.SongName, request.Artist, request.Description);
        return Ok(new { id, message = "反馈已提交，感谢您的建议" });
    }

    [HttpPost("{id}/process")]
    public async Task<IActionResult> MarkProcessed(int id)
    {
        await _feedbackService.MarkProcessedAsync(id);
        return Ok(new { message = "已标记为已处理" });
    }

    [HttpGet("pending-count")]
    public async Task<IActionResult> GetPendingCount()
    {
        var count = await _feedbackService.GetPendingCountAsync();
        return Ok(new { count });
    }
}
