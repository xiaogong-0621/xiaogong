using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _env;

    // Allowed extensions per upload type
    private static readonly Dictionary<string, string[]> AllowedExtensions = new()
    {
        ["avatar"] = [".jpg", ".jpeg", ".png", ".gif", ".webp"],
        ["cover"]  = [".jpg", ".jpeg", ".png", ".webp"],
        ["music"]  = [".mp3", ".flac"],
        ["lrc"]    = [".lrc"]
    };

    // Max file sizes per type (in bytes)
    private static readonly Dictionary<string, long> MaxSizes = new()
    {
        ["avatar"] = 2 * 1024 * 1024,   // 2MB
        ["cover"]  = 5 * 1024 * 1024,   // 5MB
        ["music"]  = 100 * 1024 * 1024, // 100MB
        ["lrc"]    = 1 * 1024 * 1024    // 1MB
    };

    public UploadController(IWebHostEnvironment env) => _env = env;

    /// <summary>
    /// POST /api/upload/avatar
    /// </summary>
    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadAvatar(IFormFile file)
        => await SaveFile(file, "avatar", "avatars");

    /// <summary>
    /// POST /api/upload/cover
    /// </summary>
    [HttpPost("cover")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadCover(IFormFile file)
        => await SaveFile(file, "cover", "covers");

    /// <summary>
    /// POST /api/upload/music
    /// </summary>
    [HttpPost("music")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(100 * 1024 * 1024)]
    public async Task<IActionResult> UploadMusic(IFormFile file)
        => await SaveFile(file, "music", "music");

    /// <summary>
    /// POST /api/upload/lrc
    /// </summary>
    [HttpPost("lrc")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadLrc(IFormFile file)
        => await SaveFile(file, "lrc", "lyrics");

    private async Task<IActionResult> SaveFile(IFormFile file, string type, string subfolder)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "未选择文件" });

        // Validate extension
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions[type].Contains(ext))
            return BadRequest(new { message = $"不支持的文件格式，允许：{string.Join(", ", AllowedExtensions[type])}" });

        // Validate size
        if (file.Length > MaxSizes[type])
        {
            var maxMB = MaxSizes[type] / (1024 * 1024);
            return BadRequest(new { message = $"文件大小超出限制，最大 {maxMB}MB" });
        }

        // Generate unique filename: GUID + extension
        var fileName = $"{Guid.NewGuid()}{ext}";
        var saveDir = Path.Combine(_env.WebRootPath, "uploads", subfolder);
        Directory.CreateDirectory(saveDir);

        var filePath = Path.Combine(saveDir, fileName);
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Return the relative URL for frontend to use
        var url = $"/uploads/{subfolder}/{fileName}";
        return Ok(new { url, fileName, originalName = file.FileName });
    }
}
