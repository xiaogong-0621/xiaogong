namespace backend.Repositories;

using backend.Models;

public interface INotificationRepository
{
    Task<List<Notification>> GetByUserIdAsync(int userId, int limit = 50);
    Task<int> GetUnreadCountAsync(int userId);
    Task<int> CreateAsync(Notification notification);
    Task MarkAsReadAsync(int id);
    Task MarkAllAsReadAsync(int userId);
}
