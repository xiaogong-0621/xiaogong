using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService) => _dashboardService = dashboardService;

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _dashboardService.GetStatsAsync();
        return Ok(stats);
    }

    [HttpGet("top-songs")]
    public async Task<IActionResult> GetTopSongs()
    {
        var songs = await _dashboardService.GetTopSongsAsync();
        return Ok(songs);
    }

    [HttpGet("latest-rooms")]
    public async Task<IActionResult> GetLatestRooms()
    {
        var rooms = await _dashboardService.GetLatestRoomsAsync();
        return Ok(rooms);
    }
}
