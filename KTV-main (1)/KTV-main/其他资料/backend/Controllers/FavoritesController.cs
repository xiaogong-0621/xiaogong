using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Repositories;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteRepository _favoriteRepo;

    public FavoritesController(IFavoriteRepository favoriteRepo) => _favoriteRepo = favoriteRepo;

    [HttpGet]
    public async Task<IActionResult> GetList()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var favorites = await _favoriteRepo.GetByUserIdAsync(userId);
        return Ok(favorites);
    }

    [HttpPost("{songId}")]
    public async Task<IActionResult> Add(int songId)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var exists = await _favoriteRepo.ExistsAsync(userId, songId);
        if (exists) return BadRequest(new { message = "Already in favorites" });

        await _favoriteRepo.AddAsync(userId, songId);
        return Ok();
    }

    [HttpDelete("{songId}")]
    public async Task<IActionResult> Remove(int songId)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        await _favoriteRepo.RemoveAsync(userId, songId);
        return Ok();
    }
}
