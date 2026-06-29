using backend.Models;
using backend.Repositories;

namespace backend.Services;

public class FeedbackService
{
    private readonly IFeedbackRepository _feedbackRepo;

    public FeedbackService(IFeedbackRepository feedbackRepo)
    {
        _feedbackRepo = feedbackRepo;
    }

    public async Task<PaginatedResult<Feedback>> GetListAsync(string? status, string? search, int page, int pageSize)
    {
        return await _feedbackRepo.GetListAsync(status, search, page, pageSize);
    }

    public async Task<int> CreateAsync(int userId, string feedbackType, string? songName, string? artist, string? description)
    {
        var feedback = new Feedback
        {
            UserId = userId,
            FeedbackType = feedbackType,
            SongName = songName,
            Artist = artist,
            Description = description
        };
        return await _feedbackRepo.CreateAsync(feedback);
    }

    public async Task MarkProcessedAsync(int id)
    {
        await _feedbackRepo.MarkProcessedAsync(id);
    }

    public async Task<int> GetPendingCountAsync()
    {
        return await _feedbackRepo.GetPendingCountAsync();
    }
}
