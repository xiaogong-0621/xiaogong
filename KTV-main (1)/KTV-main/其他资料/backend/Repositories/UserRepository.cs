using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using backend.Models;

namespace backend.Repositories;

public class UserRepository : IUserRepository
{
    private readonly string _connStr;
    public UserRepository(string connStr) => _connStr = connStr;

    private SqlConnection CreateConnection() => new(_connStr);

    public async Task<User?> GetByIdAsync(int id)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<User>(
            "SELECT * FROM Users WHERE Id = @Id", new { Id = id });
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<User>(
            "SELECT * FROM Users WHERE Username = @Username", new { Username = username });
    }

    public async Task<PaginatedResult<User>> GetListAsync(string? search, string? status, int page, int pageSize)
    {
        using var conn = CreateConnection();
        var where = "WHERE Role != 'admin'";
        var parameters = new DynamicParameters();

        if (!string.IsNullOrEmpty(search))
        {
            where += " AND (Username LIKE @Search OR DisplayName LIKE @Search)";
            parameters.Add("Search", $"%{search}%");
        }
        if (!string.IsNullOrEmpty(status) && status != "all")
        {
            where += " AND Status = @Status";
            parameters.Add("Status", status);
        }

        var total = await conn.ExecuteScalarAsync<int>($"SELECT COUNT(*) FROM Users {where}", parameters);
        parameters.Add("Offset", (page - 1) * pageSize);
        parameters.Add("PageSize", pageSize);

        var items = await conn.QueryAsync<User>(
            $"SELECT * FROM Users {where} ORDER BY CreatedAt DESC OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY",
            parameters);

        return new PaginatedResult<User> { Items = items.ToList(), Total = total, Page = page, PageSize = pageSize };
    }

    public async Task<int> CreateAsync(User user)
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"INSERT INTO Users (Username, PasswordHash, DisplayName, Phone, Email, AvatarUrl, Role, Status, CreatedAt, UpdatedAt)
              OUTPUT INSERTED.Id
              VALUES (@Username, @PasswordHash, @DisplayName, @Phone, @Email, @AvatarUrl, @Role, @Status, GETDATE(), GETDATE())", user);
    }

    public async Task UpdateAsync(User user)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            @"UPDATE Users SET DisplayName=@DisplayName, Phone=@Phone, Email=@Email, AvatarUrl=@AvatarUrl,
              Status=@Status, UpdatedAt=GETDATE() WHERE Id=@Id", user);
    }

    public async Task<int> GetActiveCountAsync()
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            "SELECT COUNT(*) FROM Users WHERE Status = 'active'");
    }

    public async Task<User?> GetAdminAsync()
    {
        using var conn = CreateConnection();
        return await conn.QuerySingleOrDefaultAsync<User>(
            "SELECT * FROM Users WHERE Role = 'admin'");
    }

    public async Task UpdateUsernameAsync(int id, string username)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE Users SET Username = @Username, UpdatedAt = GETDATE() WHERE Id = @Id",
            new { Id = id, Username = username });
    }

    public async Task UpdatePasswordAsync(int id, string password)
    {
        using var conn = CreateConnection();
        await conn.ExecuteAsync(
            "UPDATE Users SET PasswordHash = @Password, UpdatedAt = GETDATE() WHERE Id = @Id",
            new { Id = id, Password = password });
    }

    public async Task UpdateLastActiveAtAsync(int id, bool clear = false)
    {
        using var conn = CreateConnection();
        if (clear)
            await conn.ExecuteAsync("UPDATE Users SET LastActiveAt = NULL WHERE Id = @Id", new { Id = id });
        else
            await conn.ExecuteAsync("UPDATE Users SET LastActiveAt = GETDATE() WHERE Id = @Id", new { Id = id });
    }

    public async Task<int> GetOnlineCountAsync()
    {
        using var conn = CreateConnection();
        return await conn.ExecuteScalarAsync<int>(
            @"SELECT COUNT(*) FROM Users
              WHERE LastActiveAt IS NOT NULL
                AND LastActiveAt > DATEADD(MINUTE, -10, GETDATE())
                AND Role != 'admin'
                AND Status = 'active'");
    }

    public async Task DeleteAsync(int id)
    {
        using var conn = CreateConnection();
        await conn.OpenAsync();
        using var tran = conn.BeginTransaction();

        await conn.ExecuteAsync("DELETE FROM Favorites WHERE UserId = @Id", new { Id = id }, tran);
        await conn.ExecuteAsync("DELETE FROM PlayQueue WHERE OrderedByUserId = @Id", new { Id = id }, tran);
        await conn.ExecuteAsync("DELETE FROM ChatMessages WHERE UserId = @Id", new { Id = id }, tran);
        await conn.ExecuteAsync("DELETE FROM RoomUsers WHERE UserId = @Id", new { Id = id }, tran);
        await conn.ExecuteAsync("DELETE FROM Feedbacks WHERE UserId = @Id", new { Id = id }, tran);
        await conn.ExecuteAsync("UPDATE RoomRequests SET ProcessedBy = NULL WHERE ProcessedBy = @Id", new { Id = id }, tran);
        await conn.ExecuteAsync("DELETE FROM RoomRequests WHERE UserId = @Id", new { Id = id }, tran);
        await conn.ExecuteAsync("DELETE FROM Users WHERE Id = @Id", new { Id = id }, tran);

        tran.Commit();
    }
}
