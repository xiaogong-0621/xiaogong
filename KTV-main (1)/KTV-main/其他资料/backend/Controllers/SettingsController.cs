using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Repositories;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SettingsController : ControllerBase
{
    private readonly ISettingsRepository _settingsRepo;
    private readonly IUserRepository _userRepo;

    public SettingsController(ISettingsRepository settingsRepo, IUserRepository userRepo)
    {
        _settingsRepo = settingsRepo;
        _userRepo = userRepo;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var settings = await _settingsRepo.GetAllAsync();
        return Ok(settings);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] Dictionary<string, string> settings)
    {
        foreach (var kvp in settings)
        {
            await _settingsRepo.UpdateAsync(kvp.Key, kvp.Value);
        }
        return Ok();
    }

    [HttpGet("admin-account")]
    public async Task<IActionResult> GetAdminAccount()
    {
        var admin = await _userRepo.GetAdminAsync();
        if (admin == null) return NotFound(new { message = "管理员账号不存在" });
        return Ok(new { username = admin.Username });
    }

    [HttpPost("admin-account/username")]
    public async Task<IActionResult> UpdateAdminUsername([FromBody] UpdateAdminUsernameRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewUsername)) throw new Exception("用户名不能为空");
        var admin = await _userRepo.GetAdminAsync();
        if (admin == null) throw new Exception("管理员账号不存在");

        if (admin.PasswordHash != request.Password) throw new Exception("密码错误");

        var existing = await _userRepo.GetByUsernameAsync(request.NewUsername);
        if (existing != null && existing.Id != admin.Id) throw new Exception("用户名已存在");

        await _userRepo.UpdateUsernameAsync(admin.Id, request.NewUsername);
        return Ok();
    }

    [HttpPost("admin-account/password")]
    public async Task<IActionResult> UpdateAdminPassword([FromBody] UpdateAdminPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword)) throw new Exception("新密码不能为空");
        if (request.NewPassword != request.ConfirmPassword) throw new Exception("两次输入的密码不一致");
        var admin = await _userRepo.GetAdminAsync();
        if (admin == null) throw new Exception("管理员账号不存在");

        if (admin.PasswordHash != request.CurrentPassword) throw new Exception("当前密码错误");

        await _userRepo.UpdatePasswordAsync(admin.Id, request.NewPassword);
        return Ok();
    }
}

public record UpdateAdminUsernameRequest(string NewUsername, string Password);
public record UpdateAdminPasswordRequest(string CurrentPassword, string NewPassword, string ConfirmPassword);
