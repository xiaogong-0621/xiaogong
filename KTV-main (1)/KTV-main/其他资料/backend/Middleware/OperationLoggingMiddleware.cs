using System.Security.Claims;
using backend.Models;
using backend.Repositories;

namespace backend.Middleware;

public class OperationLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<OperationLoggingMiddleware> _logger;

    // Routes that exist today. More specific patterns (with /*/) come before broad ones (with /*).
    private static readonly (string Pattern, string Type, string Obj)[] Routes =
    [
        ("POST /api/accounts",                "create",         "user"),
        ("POST /api/accounts/*/recharge",     "balance_adjust", "user"),
        ("POST /api/accounts/*/disable",      "disable",        "user"),
        ("PUT /api/accounts/*",               "update",         "user"),
        ("PUT /api/accounts/*/toggle-status", "toggle_status",  "user"),
        ("POST /api/songs",                   "create",         "song"),
        ("PUT /api/songs/*",                  "update",         "song"),
        ("DELETE /api/songs/*",               "delete",         "song"),
        ("PUT /api/rooms/*/status",           "update_status",  "room"),
        ("POST /api/rooms/*/end-session",     "end_session",    "room"),
        ("PUT /api/settings",                 "update",         "settings"),
        ("POST /api/settings/admin-account/username", "change_username", "admin"),
        ("POST /api/settings/admin-account/password", "change_password", "admin"),
    ];

    public OperationLoggingMiddleware(RequestDelegate next, ILogger<OperationLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Register callback BEFORE downstream runs so we capture status code
        // without buffering the response body.
        var statusCode = 0;
        context.Response.OnStarting(() =>
        {
            statusCode = context.Response.StatusCode;
            return Task.CompletedTask;
        });

        await _next(context);

        // Only log successful write operations (POST/PUT/DELETE with 2xx status)
        if (statusCode >= 200 && statusCode < 300
            && (context.Request.Method == "POST" || context.Request.Method == "PUT" || context.Request.Method == "DELETE"))
        {
            try
            {
                var logEntry = BuildLogEntry(context);
                if (logEntry != null)
                {
                    var logRepo = context.RequestServices.GetRequiredService<IOperationLogRepository>();
                    await logRepo.CreateAsync(logEntry);
                }
            }
            catch
            {
                // Silently ignore logging failures (e.g. table doesn't exist yet)
            }
        }
    }

    private OperationLog? BuildLogEntry(HttpContext context)
    {
        var method = context.Request.Method;
        var path = context.Request.Path.Value ?? "";
        var key = $"{method} {path}";

        // Match routes — array is ordered most-specific-first
        (string type, string obj)? mapping = null;
        foreach (var (pattern, type, obj) in Routes)
        {
            if (pattern.Contains('*'))
            {
                // Convert wildcard pattern to prefix: "PUT /api/songs/*" → "PUT /api/songs/"
                var prefix = pattern[..pattern.IndexOf('*')];
                if (key.StartsWith(prefix))
                {
                    mapping = (type, obj);
                    break;
                }
            }
            else if (key == pattern)
            {
                mapping = (type, obj);
                break;
            }
        }

        if (mapping == null) return null;

        var username = context.User.FindFirst(ClaimTypes.Name)?.Value ?? "unknown";

        // Extract object ID from path
        var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
        string? objectId = null;
        if (segments.Length >= 3)
        {
            objectId = segments[^1];
            // If the last segment is an action verb, use the second-to-last segment as the ID
            var actions = new[] { "recharge", "disable", "toggle-status", "status", "end-session", "username", "password" };
            if (actions.Contains(objectId.ToLower()))
            {
                objectId = segments.Length >= 4 ? segments[^2] : null;
            }
        }

        return new OperationLog
        {
            Username = username,
            OperationType = mapping.Value.type,
            ObjectType = mapping.Value.obj,
            ObjectId = objectId,
            Details = $"{method} {path}"
        };
    }
}
