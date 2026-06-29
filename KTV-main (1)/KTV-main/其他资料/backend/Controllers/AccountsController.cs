using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using Dapper;
using Microsoft.Data.SqlClient;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly AccountService _accountService;
    private readonly string _connStr;

    public AccountsController(AccountService accountService, string connStr)
    {
        _accountService = accountService;
        _connStr = connStr;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _accountService.GetListAsync(search, status, page, pageSize);

        // Populate IsOnline (logged in within last 10 minutes) and RoomCode (if in a room)
        using var conn = new SqlConnection(_connStr);
        var userRooms = (await conn.QueryAsync(
            @"SELECT ru.UserId, r.RoomCode FROM RoomUsers ru
              INNER JOIN Rooms r ON r.Id = ru.RoomId AND r.Status != 'closed'"
        )).ToDictionary(x => (int)x.UserId, x => (string)x.RoomCode);

        var cutoff = DateTime.Now.AddMinutes(-10);
        foreach (var user in result.Items)
        {
            user.IsOnline = user.LastActiveAt.HasValue && user.LastActiveAt.Value > cutoff;
            if (userRooms.TryGetValue(user.Id, out var roomCode))
                user.RoomCode = roomCode;
        }

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _accountService.GetByIdAsync(id);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountRequest request)
    {
        var id = await _accountService.CreateAsync(request.Username, request.Password, request.DisplayName, request.Phone, request.AvatarUrl);
        return Ok(new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAccountRequest request)
    {
        await _accountService.UpdateAsync(id, request.DisplayName, request.Phone, request.AvatarUrl);
        return Ok();
    }

    [HttpPut("{id}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        try
        {
            await _accountService.ToggleStatusAsync(id);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/disable")]
    public async Task<IActionResult> Disable(int id)
    {
        try
        {
            await _accountService.DisableWithRoomKickAsync(id);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/password")]
    public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordRequest request)
    {
        try
        {
            await _accountService.ChangePasswordAsync(id, request.NewPassword);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _accountService.DeleteAsync(id);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
