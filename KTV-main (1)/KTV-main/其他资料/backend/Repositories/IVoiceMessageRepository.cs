using backend.Models;

namespace backend.Repositories;

public interface IVoiceMessageRepository
{
    Task<int> CreateAsync(VoiceMessage message);
    Task<List<VoiceMessage>> GetByRoomIdAsync(int roomId, int limit = 50);
}
