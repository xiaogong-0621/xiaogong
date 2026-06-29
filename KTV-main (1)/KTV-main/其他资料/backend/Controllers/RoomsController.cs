using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using backend.Repositories;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class RoomsController : ControllerBase
{
    private readonly RoomService _roomService;
    private readonly IChatRepository _chatRepo;

    public RoomsController(RoomService roomService, IChatRepository chatRepo)
    {
        _roomService = roomService;
        _chatRepo = chatRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _roomService.GetActiveRoomsAsync(search, status, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var room = await _roomService.GetByIdAsync(id);
        if (room == null) return NotFound();
        return Ok(room);
    }

    [HttpPost("{id}/close")]
    public async Task<IActionResult> CloseRoom(int id)
    {
        try
        {
            await _roomService.CloseRoomAsync(id);
            return Ok(new { message = "房间已关闭" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinRoom([FromBody] JoinRoomRequest request)
    {
        var room = await _roomService.GetByCodeAsync(request.RoomCode);
        if (room == null) return NotFound(new { message = "房间不存在或已关闭" });

        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var nickname = User.FindFirst("DisplayName")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
            ?? "匿名";
        await _roomService.JoinRoomAsync(room.Id, userId);
        await _chatRepo.CreateSystemMessageAsync(room.Id, userId, $"{nickname} 进入了房间");
        return Ok(new { roomId = room.Id, roomCode = room.RoomCode });
    }

    [HttpPost("{id}/leave")]
    public async Task<IActionResult> LeaveRoom(int id)
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "0");
        var nickname = User.FindFirst("DisplayName")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value
            ?? "匿名";
        await _roomService.LeaveRoomAsync(id, userId);
        await _chatRepo.CreateSystemMessageAsync(id, userId, $"{nickname} 退出了房间");
        return Ok();
    }
}
