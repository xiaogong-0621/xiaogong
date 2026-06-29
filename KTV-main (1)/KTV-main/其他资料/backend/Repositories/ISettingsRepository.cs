using backend.Models;

namespace backend.Repositories;

public interface ISettingsRepository
{
    Task<Dictionary<string, string>> GetAllAsync();
    Task UpdateAsync(string key, string value);
}
