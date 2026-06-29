using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class SettingsRepository : ISettingsRepository
{
    private readonly string _connStr;
    private readonly ILogger<SettingsRepository> _logger;
    public SettingsRepository(string connStr, ILogger<SettingsRepository> logger)
    {
        _connStr = connStr;
        _logger = logger;
    }

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<Dictionary<string, string>> GetAllAsync()
    {
        using var conn = CreateConnection();
        var settings = await conn.QueryAsync<SystemSetting>("SELECT * FROM SystemSettings");
        return settings.ToDictionary(s => s.SettingKey, s => s.SettingValue);
    }

    public async Task UpdateAsync(string key, string value)
    {
        using var conn = CreateConnection();
        var exists = await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM SystemSettings WHERE SettingKey = @Key", new { Key = key });

        _logger.LogInformation("Settings UpdateAsync: key={Key}, value={Value}, exists={Exists}", key, value, exists);

        if (exists > 0)
        {
            var rows = await conn.ExecuteAsync(
                "UPDATE SystemSettings SET SettingValue = @Value, UpdatedAt = GETDATE() WHERE SettingKey = @Key",
                new { Key = key, Value = value });
            _logger.LogInformation("Settings UPDATE: key={Key}, rowsAffected={Rows}", key, rows);
        }
        else
        {
            var rows = await conn.ExecuteAsync(
                "INSERT INTO SystemSettings (SettingKey, SettingValue) VALUES (@Key, @Value)",
                new { Key = key, Value = value });
            _logger.LogInformation("Settings INSERT: key={Key}, rowsAffected={Rows}", key, rows);
        }

        // Verify: read back
        var verify = await conn.ExecuteScalarAsync<string>(
            "SELECT SettingValue FROM SystemSettings WHERE SettingKey = @Key", new { Key = key });
        _logger.LogInformation("Settings VERIFY: key={Key}, dbValue={DbValue}", key, verify);
    }
}
