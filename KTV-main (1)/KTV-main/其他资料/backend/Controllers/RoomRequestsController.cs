using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomRequestsController : ControllerBase
{
    private readonly RoomRequestService _requestService;
    private readonly NotificationService _notificationService;

    public RoomRequestsController(RoomRequestService requestService, NotificationService notificationService)
    {
        _requestService = requestService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _requestService.GetListAsync(status, page, pageSize);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var id = await _requestService.CreateAsync(userId);

        // 创建系统通知
        await _notificationService.CreateNotificationAsync(
            userId,
            "system_notice",
            "房间申请成功",
            "您已成功申请加入房间，请等待管理员审核",
            id,
            "room_request"
        );

        return Ok(new { id, message = "申请已提交，等待管理员审批" });
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> Approve(int id)
    {
        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        try
        {
            var room = await _requestService.ApproveAsync(id, adminId);
            return Ok(new { roomCode = room.RoomCode, roomId = room.Id, message = "已通过，房间已创建" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> Reject(int id)
    {
        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        try
        {
            await _requestService.RejectAsync(id, adminId);
            return Ok(new { message = "已拒绝" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("pending-count")]
    public async Task<IActionResult> GetPendingCount()
    {
        var count = await _requestService.GetPendingCountAsync();
        return Ok(new { count });
    }

    [HttpGet("my-latest")]
    public async Task<IActionResult> GetMyLatestRequest()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var request = await _requestService.GetMyLatestRequestAsync(userId);
        if (request == null) return Ok(new { found = false });
        return Ok(new
        {
            found = true,
            request.Id,
            request.Status,
            request.RoomId,
            request.CreatedAt,
            request.ProcessedAt
        });
    }
}
