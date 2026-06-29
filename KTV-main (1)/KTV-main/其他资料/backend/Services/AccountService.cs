using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class AccountService
{
    private readonly IUserRepository _userRepo;
    private readonly IRoomRepository _roomRepo;
    private readonly IWebHostEnvironment _env;

    public AccountService(IUserRepository userRepo, IRoomRepository roomRepo, IWebHostEnvironment env)
    {
        _userRepo = userRepo;
        _roomRepo = roomRepo;
        _env = env;
    }

    public async Task<PaginatedResult<User>> GetListAsync(string? search, string? status, int page, int pageSize)
    {
        return await _userRepo.GetListAsync(search, status, page, pageSize);
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _userRepo.GetByIdAsync(id);
    }

    public async Task<int> CreateAsync(string username, string password, string displayName, string? phone, string? avatarUrl)
    {
        var existing = await _userRepo.GetByUsernameAsync(username);
        if (existing != null) throw new Exception("用户名已存在");

        var user = new User
        {
            Username = username,
            PasswordHash = password,
            DisplayName = displayName,
            Phone = phone,
            AvatarUrl = avatarUrl ?? "/uploads/avatars/default.jpg",
            Role = "user",
            Status = "active"
        };

        return await _userRepo.CreateAsync(user);
    }

    public async Task UpdateAsync(int id, string? displayName, string? phone, string? avatarUrl)
    {
        var user = await _userRepo.GetByIdAsync(id);
        if (user == null) throw new Exception("User not found");

        if (displayName != null) user.DisplayName = displayName;
        if (phone != null) user.Phone = phone;
        if (avatarUrl != null)
        {
            if (user.AvatarUrl != null && !user.AvatarUrl.Contains("default.jpg"))
                DeletePhysicalFile(user.AvatarUrl);
            user.AvatarUrl = avatarUrl;
        }

        await _userRepo.UpdateAsync(user);
    }

    private void DeletePhysicalFile(string url)
    {
        try
        {
            var relativePath = url.TrimStart('/');
            var fullPath = Path.Combine(_env.WebRootPath, relativePath);
            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
        catch { /* best-effort */ }
    }

    public async Task ToggleStatusAsync(int id)
    {
        var user = await _userRepo.GetByIdAsync(id);
        if (user == null) throw new Exception("User not found");
        if (user.Role == "admin") throw new Exception("管理员账号不可禁用");

        user.Status = user.Status == "active" ? "disabled" : "active";
        await _userRepo.UpdateAsync(user);
    }

    public async Task DisableWithRoomKickAsync(int id)
    {
        var user = await _userRepo.GetByIdAsync(id);
        if (user == null) throw new Exception("用户不存在");
        if (user.Role == "admin") throw new Exception("管理员账号不可禁用");
        if (user.Status == "disabled") throw new Exception("用户已被禁用");

        // Disable user
        user.Status = "disabled";
        await _userRepo.UpdateAsync(user);
    }

    public async Task ChangePasswordAsync(int id, string newPassword)
    {
        var user = await _userRepo.GetByIdAsync(id);
        if (user == null) throw new Exception("用户不存在");

        await _userRepo.UpdatePasswordAsync(id, newPassword);
    }

    public async Task DeleteAsync(int id)
    {
        var user = await _userRepo.GetByIdAsync(id);
        if (user == null) throw new Exception("用户不存在");
        if (user.Role == "admin") throw new Exception("管理员账号不可删除");

        // Delete avatar file if not default
        if (user.AvatarUrl != null && !user.AvatarUrl.Contains("default.jpg"))
            DeletePhysicalFile(user.AvatarUrl);

        await _userRepo.DeleteAsync(id);
    }
}
