using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SongsController : ControllerBase
{
    private readonly SongService _songService;

    public SongsController(SongService songService) => _songService = songService;

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] string? search, [FromQuery] string? genre, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _songService.GetListAsync(search, genre, status, page, pageSize);
        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var stats = await _songService.GetStatsAsync();
        return Ok(stats);
    }

    [HttpGet("genres")]
    public async Task<IActionResult> GetGenres()
    {
        var genres = await _songService.GetGenresAsync();
        return Ok(genres);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSongRequest request)
    {
        var id = await _songService.CreateAsync(request.Title, request.Artist, request.Genre, request.Language, request.Duration, request.FileSize, request.CoverUrl, request.MediaUrl, request.LrcUrl, request.OriginalFileName);
        return Ok(new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSongRequest request)
    {
        await _songService.UpdateAsync(id, request.Title, request.Artist, request.Genre, request.Language, request.Duration, request.FileSize, request.CoverUrl, request.MediaUrl, request.LrcUrl, request.Status, request.OriginalFileName);
        return Ok();
    }

    [HttpGet("{id}/detail")]
    public async Task<IActionResult> GetDetail(int id)
    {
        var detail = await _songService.GetDetailAsync(id);
        if (detail == null) return NotFound();
        return Ok(detail);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _songService.DeleteAsync(id);
        return Ok();
    }
}
