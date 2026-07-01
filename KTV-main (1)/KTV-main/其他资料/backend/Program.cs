using System.Net.WebSockets;
using Dapper;
using backend.Hubs;
using backend.Middleware;
using backend.Repositories;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// File upload size limits
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 100 * 1024 * 1024; // 100MB max (music files)
});
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 100 * 1024 * 1024;
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontends", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", "http://localhost:5174",
                "http://218.244.152.60", "http://218.244.152.60:8080")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost\\SQLEXPRESS;Database=KTVSystem;Trusted_Connection=true;TrustServerCertificate=true;";
builder.Services.AddSingleton(connectionString);

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRoomRepository, RoomRepository>();
builder.Services.AddScoped<IRoomRequestRepository, RoomRequestRepository>();
builder.Services.AddScoped<ISongRepository, SongRepository>();
builder.Services.AddScoped<IPlayQueueRepository, PlayQueueRepository>();
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>();
builder.Services.AddScoped<ISettingsRepository, SettingsRepository>();
builder.Services.AddScoped<IOperationLogRepository, OperationLogRepository>();
builder.Services.AddScoped<IFeedbackRepository, FeedbackRepository>();
builder.Services.AddScoped<IRoomUserRepository, RoomUserRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<IVoiceMessageRepository, VoiceMessageRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();

// Services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<RoomService>();
builder.Services.AddScoped<RoomRequestService>();
builder.Services.AddScoped<SongService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<FeedbackService>();
builder.Services.AddScoped<NotificationService>();

// Singleton services (in-memory state)
builder.Services.AddSingleton<PlaybackStateService>();
builder.Services.AddSingleton<WsNotifyService>();

// SignalR
builder.Services.AddSignalR();

// JWT Authentication
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "ktv-system",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "ktv-client",
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "YourSuperSecretKeyHere12345678901234"))
        };

        // Allow SignalR to receive JWT token via query string (WebSocket can't send headers)
        options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && (path.StartsWithSegments("/hubs") || path.StartsWithSegments("/ws")))
                {
                    context.Token = accessToken;
                }
                return System.Threading.Tasks.Task.CompletedTask;
            }
        };
    });

var app = builder.Build();

// Auto-migration: ensure schema is up to date
{
    using var scope = app.Services.CreateScope();
    var connStr = scope.ServiceProvider.GetRequiredService<string>();
    using var conn = new Microsoft.Data.SqlClient.SqlConnection(connStr);
    await conn.OpenAsync();

    // Helper: check if a column exists
    bool ColumnExists(string table, string column) =>
        conn.ExecuteScalar<int>(
            $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @T AND COLUMN_NAME = @C",
            new { T = table, C = column }) > 0;
    bool TableExists(string table) =>
        conn.ExecuteScalar<int>(
            $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @T",
            new { T = table }) > 0;

    // 1. Users table: add Email column
    if (!ColumnExists("Users", "Email"))
    {
        conn.Execute("ALTER TABLE Users ADD Email NVARCHAR(100) NULL");
        try { conn.Execute("ALTER TABLE Users ADD CONSTRAINT UQ_Users_Email UNIQUE (Email)"); } catch { }
        Console.WriteLine("[AutoMigrate] Users.Email column added");
    }

    // 2. Rooms table: rebuild if old schema detected
    if (ColumnExists("Rooms", "RoomNumber") && !ColumnExists("Rooms", "RoomCode"))
    {
        // Old schema found — drop FK constraints referencing Rooms, then drop and recreate
        var fkConstraints = conn.Query<string>(
            @"SELECT fk.name FROM sys.foreign_keys fk
              INNER JOIN sys.tables t ON fk.referenced_object_id = t.object_id
              WHERE t.name = 'Rooms'").ToList();
        foreach (var fk in fkConstraints)
        {
            // Find the parent table
            var parentTable = conn.QuerySingleOrDefault<string>(
                @"SELECT t.name FROM sys.foreign_keys fk
                  INNER JOIN sys.tables t ON fk.parent_object_id = t.object_id
                  WHERE fk.name = @Fk", new { Fk = fk });
            if (parentTable != null)
                conn.Execute($"ALTER TABLE [{parentTable}] DROP CONSTRAINT [{fk}]");
        }
        conn.Execute("DROP TABLE Rooms");
        conn.Execute(@"
            CREATE TABLE Rooms (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                RoomCode NVARCHAR(10) NOT NULL UNIQUE,
                Status NVARCHAR(20) NOT NULL DEFAULT 'active',
                CreatedByUserId INT NOT NULL,
                CurrentUsers INT NOT NULL DEFAULT 0,
                IdleCloseAt DATETIME2 NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                ClosedAt DATETIME2 NULL
            )");
        Console.WriteLine("[AutoMigrate] Rooms table rebuilt with new schema");
    }
    else if (!TableExists("Rooms"))
    {
        conn.Execute(@"
            CREATE TABLE Rooms (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                RoomCode NVARCHAR(10) NOT NULL UNIQUE,
                Status NVARCHAR(20) NOT NULL DEFAULT 'active',
                CreatedByUserId INT NOT NULL,
                CurrentUsers INT NOT NULL DEFAULT 0,
                IdleCloseAt DATETIME2 NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                ClosedAt DATETIME2 NULL
            )");
        Console.WriteLine("[AutoMigrate] Rooms table created");
    }

    // 3. RoomRequests table
    if (!TableExists("RoomRequests"))
    {
        conn.Execute(@"
            CREATE TABLE RoomRequests (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                UserId INT NOT NULL,
                Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
                RoomId INT NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                ProcessedAt DATETIME2 NULL,
                ProcessedBy INT NULL
            )");
        Console.WriteLine("[AutoMigrate] RoomRequests table created");
    }

    // 4. Feedbacks table
    if (!TableExists("Feedbacks"))
    {
        conn.Execute(@"
            CREATE TABLE Feedbacks (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                UserId INT NOT NULL,
                FeedbackType NVARCHAR(30) NOT NULL,
                SongName NVARCHAR(200) NULL,
                Artist NVARCHAR(200) NULL,
                Description NVARCHAR(1000) NULL,
                Status NVARCHAR(20) NOT NULL DEFAULT 'pending',
                CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                ProcessedAt DATETIME2 NULL
            )");
        Console.WriteLine("[AutoMigrate] Feedbacks table created");
    }

    // 5. PlayQueue table
    if (!TableExists("PlayQueue"))
    {
        conn.Execute(@"
            CREATE TABLE PlayQueue (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                RoomId INT NOT NULL,
                SongId INT NOT NULL,
                OrderedByUserId INT NOT NULL,
                SortOrder INT NOT NULL DEFAULT 0,
                Status NVARCHAR(20) NOT NULL DEFAULT 'queued',
                CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
            )");
        Console.WriteLine("[AutoMigrate] PlayQueue table created");
    }

    // 6. RoomUsers table (tracks active room membership)
    if (!TableExists("RoomUsers"))
    {
        conn.Execute(@"
            CREATE TABLE RoomUsers (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                RoomId INT NOT NULL,
                UserId INT NOT NULL,
                JoinedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                CONSTRAINT UQ_RoomUsers UNIQUE (UserId)
            )");
        Console.WriteLine("[AutoMigrate] RoomUsers table created");
    }

    // 7. Users table: add LastActiveAt column
    if (!ColumnExists("Users", "LastActiveAt"))
    {
        conn.Execute("ALTER TABLE Users ADD LastActiveAt DATETIME2 NULL");
        Console.WriteLine("[AutoMigrate] Users.LastActiveAt column added");
    }

    // 8. Songs table: add OriginalFileName column
    if (!ColumnExists("Songs", "OriginalFileName"))
    {
        conn.Execute("ALTER TABLE Songs ADD OriginalFileName NVARCHAR(500) NULL");
        Console.WriteLine("[AutoMigrate] Songs.OriginalFileName column added");
    }

    // 9. OperationLogs table
    if (!TableExists("OperationLogs"))
    {
        conn.Execute(@"
            CREATE TABLE OperationLogs (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                Username NVARCHAR(50) NOT NULL,
                OperationType NVARCHAR(50) NOT NULL,
                ObjectType NVARCHAR(50) NOT NULL,
                ObjectId NVARCHAR(50) NULL,
                Details NVARCHAR(MAX) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
            )");
        conn.Execute("CREATE INDEX IX_OperationLogs_CreatedAt ON OperationLogs(CreatedAt DESC)");
        conn.Execute("CREATE INDEX IX_OperationLogs_Type ON OperationLogs(OperationType)");
        Console.WriteLine("[AutoMigrate] OperationLogs table created");
    }

    // 10. Notifications table
    if (!TableExists("Notifications"))
    {
        conn.Execute(@"
            CREATE TABLE Notifications (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                UserId INT NOT NULL,
                Type NVARCHAR(30) NOT NULL DEFAULT 'system',
                Title NVARCHAR(200) NOT NULL,
                Content NVARCHAR(1000) NOT NULL,
                IsRead BIT NOT NULL DEFAULT 0,
                RelatedId INT NULL,
                RelatedType NVARCHAR(50) NULL,
                CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
            )");
        try { conn.Execute("ALTER TABLE Notifications ADD CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(Id)"); } catch { }
        conn.Execute("CREATE INDEX IX_Notifications_UserId ON Notifications(UserId, CreatedAt DESC)");
        conn.Execute("CREATE INDEX IX_Notifications_IsRead ON Notifications(UserId, IsRead)");
        Console.WriteLine("[AutoMigrate] Notifications table created");
    }

    // 11. Cleanup old operation logs on startup
    try
    {
        var retentionDays = conn.QuerySingleOrDefault<string>(
            "SELECT Value FROM SystemSettings WHERE [Key] = 'log_retention_days'");
        if (retentionDays != null && int.TryParse(retentionDays, out var days) && days > 0)
        {
            var deleted = conn.Execute(
                "DELETE FROM OperationLogs WHERE CreatedAt < DATEADD(DAY, -@Days, GETUTCDATE())",
                new { Days = days });
            if (deleted > 0)
                Console.WriteLine($"[AutoMigrate] Cleaned up {deleted} old operation logs (>{days} days)");
        }
    }
    catch { /* SystemSettings table may not exist yet */ }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontends");

// Serve static files from wwwroot (for uploaded avatars, covers, music)
var contentTypeProvider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
contentTypeProvider.Mappings[".flac"] = "audio/flac";
contentTypeProvider.Mappings[".lrc"] = "text/plain";
app.UseStaticFiles(new StaticFileOptions { ContentTypeProvider = contentTypeProvider });

app.UseAuthentication();
app.UseWebSockets(new WebSocketOptions { KeepAliveInterval = TimeSpan.FromSeconds(30) });

// Raw WebSocket endpoint for WeChat mini program
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/ws/notify" && context.WebSockets.IsWebSocketRequest)
    {
        var userIdClaim = context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            context.Response.StatusCode = 401;
            return;
        }

        var ws = await context.WebSockets.AcceptWebSocketAsync();
        var userId = int.Parse(userIdClaim);
        var wsService = context.RequestServices.GetRequiredService<WsNotifyService>();

        // Determine room from DB
        using var scope = context.RequestServices.CreateScope();
        var connStr = scope.ServiceProvider.GetRequiredService<string>();
        using var conn = new Microsoft.Data.SqlClient.SqlConnection(connStr);
        await conn.OpenAsync();
        var roomId = await conn.ExecuteScalarAsync<int>(
            @"SELECT TOP 1 ru.RoomId FROM RoomUsers ru
              INNER JOIN Rooms r ON r.Id = ru.RoomId AND r.Status != 'closed'
              WHERE ru.UserId = @UserId", new { UserId = userId });

        string? connId = null;
        if (roomId > 0)
        {
            connId = wsService.AddConnection(roomId, ws);
        }

        // Keep connection alive until client disconnects
        var buffer = new byte[1024];
        try
        {
            while (ws.State == WebSocketState.Open)
            {
                var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                if (result.MessageType == WebSocketMessageType.Close)
                    break;
            }
        }
        catch { }

        if (roomId > 0 && connId != null)
        {
            wsService.RemoveConnection(roomId, connId);
        }

        if (ws.State == WebSocketState.Open || ws.State == WebSocketState.CloseReceived)
        {
            try { await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None); }
            catch { }
        }
        return;
    }

    await next();
});

app.UseAuthorization();
app.UseMiddleware<UpdateLastActiveMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<OperationLoggingMiddleware>();
app.MapControllers();
app.MapHub<KtvHub>("/hubs/ktv");

// SPA fallback: serve index.html for admin/web routes
app.Use(async (context, next) =>
{
    if (context.Response.StatusCode == 404 && !context.Request.Path.StartsWithSegments("/api"))
    {
        var path = context.Request.Path.Value ?? "";
        if (path.StartsWith("/admin"))
        {
            context.Response.StatusCode = 200;
            context.Response.ContentType = "text/html";
            await context.Response.SendFileAsync(Path.Combine(AppContext.BaseDirectory, "wwwroot", "admin", "index.html"));
            return;
        }
        if (path.StartsWith("/web"))
        {
            context.Response.StatusCode = 200;
            context.Response.ContentType = "text/html";
            await context.Response.SendFileAsync(Path.Combine(AppContext.BaseDirectory, "wwwroot", "web", "index.html"));
            return;
        }
    }
    await next();
});

app.Run();
