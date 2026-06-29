using System.Diagnostics;

var exeDir = Path.GetDirectoryName(Environment.ProcessPath)!;
var root = Path.GetFullPath(Path.Combine(exeDir, ".."));

Console.Title = "KTVSystem 启动器";
Console.ForegroundColor = ConsoleColor.Cyan;
Console.WriteLine(@"
  ╔══════════════════════════════════════╗
  ║       KTVSystem 一键启动器          ║
  ╚══════════════════════════════════════╝
");
Console.ResetColor();

Console.WriteLine($"  项目目录: {root}");

if (!Directory.Exists(Path.Combine(root, "backend")))
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine($"\n  ✗ 找不到 backend 目录");
    Console.WriteLine($"  请确认 exe 放在项目根目录的 dist/ 文件夹下");
    Console.ResetColor();
    Console.ReadLine();
    return;
}

void StartService(string name, string cmd, string args, string workDir)
{
    Console.ForegroundColor = ConsoleColor.Yellow;
    Console.Write($"  [{name}] ");
    Console.ResetColor();
    Console.WriteLine("启动中...");
    try
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = cmd,
            Arguments = args,
            WorkingDirectory = workDir,
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        });
    }
    catch (Exception ex)
    {
        Console.ForegroundColor = ConsoleColor.Red;
        Console.WriteLine($"  [{name}] 启动失败: {ex.Message}");
        Console.ResetColor();
    }
}

StartService("后端 API", "dotnet", "run", Path.Combine(root, "backend"));
Thread.Sleep(4000);

StartService("管理端", "cmd", "/c npm run dev", Path.Combine(root, "admin"));
StartService("用户端", "cmd", "/c npm run dev", Path.Combine(root, "web"));

Console.ForegroundColor = ConsoleColor.Green;
Console.WriteLine(@"
  ✓ 全部启动完成！

  后端 API:   http://localhost:5276
  管理端:     http://localhost:5173
  用户端:     http://localhost:5174

  关闭此窗口即可停止所有服务
  或输入 q 回车关闭...");
Console.ResetColor();

// 用 Task 异步读取输入，主线程等待
var quitTask = Task.Run(() =>
{
    while (true)
    {
        var input = Console.ReadLine();
        if (input == null || input.Trim().Equals("q", StringComparison.OrdinalIgnoreCase))
            break;
    }
});

quitTask.Wait();

// 关闭所有服务
KillByPort(5276);
KillByPort(5173);
KillByPort(5174);

Console.ForegroundColor = ConsoleColor.Red;
Console.WriteLine("  ✗ 已关闭所有服务。");
Console.ResetColor();
Thread.Sleep(1500);

static void KillByPort(int port)
{
    try
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = "cmd",
            Arguments = $"/c for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :{port} ^| findstr LISTENING') do taskkill /F /PID %a",
            UseShellExecute = false,
            CreateNoWindow = true,
        })?.WaitForExit(5000);
    }
    catch { }
}
