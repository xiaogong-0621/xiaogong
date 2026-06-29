using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Repositories;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OperationLogsController : ControllerBase
{
    private readonly IOperationLogRepository _logRepo;

    public OperationLogsController(IOperationLogRepository logRepo) => _logRepo = logRepo;

    [HttpGet]
    public async Task<IActionResult> GetList(
        [FromQuery] string? operationType,
        [FromQuery] string? username,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var result = await _logRepo.GetListAsync(operationType, username, fromDate, toDate, page, pageSize);
        return Ok(result);
    }
}
