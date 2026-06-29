using System.Collections.Concurrent;
using System.Security.Claims;
using Dapper;
using Microsoft.Data.SqlClient;

namespace backend.Middleware;

public class UpdateLastActiveMiddleware
{
    private readonly RequestDelegate _next;
    private static readonly ConcurrentDictionary<int, DateTime> _lastUpdated = new();

    public UpdateLastActiveMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        await _next(context);

        // Only update for authenticated users, throttle to once per 5 minutes
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdStr = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out var userId))
            {
                var now = DateTime.Now;
                if (_lastUpdated.TryGetValue(userId, out var lastUpdate) && (now - lastUpdate).TotalMinutes < 5)
                    return;

                _lastUpdated[userId] = now;

                var connStr = context.RequestServices.GetRequiredService<string>();
                using var conn = new SqlConnection(connStr);
                await conn.ExecuteAsync("UPDATE Users SET LastActiveAt = @Now WHERE Id = @Id",
                    new { Id = userId, Now = now });
            }
        }
    }
}
