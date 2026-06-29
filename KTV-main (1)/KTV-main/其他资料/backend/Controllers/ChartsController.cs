using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Repositories;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChartsController : ControllerBase
{
    private readonly ISongRepository _songRepo;

    public ChartsController(ISongRepository songRepo) => _songRepo = songRepo;

    [HttpGet("daily")]
    public async Task<IActionResult> GetDaily()
    {
        var result = await _songRepo.GetListAsync(null, null, "active", 1, 10);
        return Ok(result.Items);
    }

    [HttpGet("weekly")]
    public async Task<IActionResult> GetWeekly()
    {
        var result = await _songRepo.GetListAsync(null, null, "active", 1, 10);
        return Ok(result.Items);
    }
}
