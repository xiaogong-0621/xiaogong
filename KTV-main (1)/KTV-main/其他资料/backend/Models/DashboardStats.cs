namespace backend.Models;

public class DashboardStats
{
    public int ActiveRooms { get; set; }
    public int OnlineUsers { get; set; }
    public int TodayRooms { get; set; }
    public int TotalUsers { get; set; }
}

public class SongStats
{
    public int TotalSongs { get; set; }
    public int WeeklyNew { get; set; }
    public int TodayPlays { get; set; }
}

public class PaginatedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class SystemSettingsDto
{
    public string PlatformName { get; set; } = string.Empty;
    public string ContactInfo { get; set; } = string.Empty;
    public int LogRetentionDays { get; set; }
    public bool SensitiveOpVerification { get; set; }
}
