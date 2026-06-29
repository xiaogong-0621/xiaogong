using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class NotificationService
{
    private readonly INotificationRepository _notificationRepo;

    public NotificationService(INotificationRepository notificationRepo)
    {
        _notificationRepo = notificationRepo;
    }

    public async Task<List<Notification>> GetByUserIdAsync(int userId, int limit = 50)
    {
        return await _notificationRepo.GetByUserIdAsync(userId, limit);
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _notificationRepo.GetUnreadCountAsync(userId);
    }

    public async Task<int> CreateNotificationAsync(int userId, string type, string title, string content, int? relatedId = null, string? relatedType = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Content = content,
            IsRead = false,
            RelatedId = relatedId,
            RelatedType = relatedType,
            CreatedAt = DateTime.Now
        };
        return await _notificationRepo.CreateAsync(notification);
    }

    public async Task MarkAsReadAsync(int id)
    {
        await _notificationRepo.MarkAsReadAsync(id);
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        await _notificationRepo.MarkAllAsReadAsync(userId);
    }
}
