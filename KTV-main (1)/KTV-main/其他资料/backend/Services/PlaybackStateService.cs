using System.Collections.Concurrent;
using backend.DTOs;

namespace backend.Services;

public class PlaybackStateService
{
    /// <summary>
    /// 播放历史快照 — 与 queue 完全解耦，reorder 不影响历史
    /// </summary>
    public class PlayedSnapshot
    {
        public int QueueItemId { get; set; }
        public int SongId { get; set; }
        public string Title { get; set; } = "";
        public string Artist { get; set; } = "";
        public string CoverUrl { get; set; } = "";
        public string MediaUrl { get; set; } = "";
        public string LrcUrl { get; set; } = "";
        public int OrderedByUserId { get; set; }
        public string OrderedByName { get; set; } = "";
        public int Duration { get; set; }
    }

    private class RoomPlaybackState
    {
        public int CurrentQueueItemId { get; set; }
        public int SongId { get; set; }
        public string Title { get; set; } = "";
        public string Artist { get; set; } = "";
        public string CoverUrl { get; set; } = "";
        public string MediaUrl { get; set; } = "";
        public string LrcUrl { get; set; } = "";
        public int OrderedByUserId { get; set; }
        public string OrderedByName { get; set; } = "";
        public bool IsPlaying { get; set; }
        public DateTime? StartedAt { get; set; }
        public double PausedPosition { get; set; }
        public int Duration { get; set; }
        public string PlayMode { get; set; } = "off";
        public Stack<PlayedSnapshot> History { get; set; } = new();
        public bool PlayCountRecorded { get; set; }
    }

    private readonly ConcurrentDictionary<int, RoomPlaybackState> _states = new();

    public PlaybackStateDto GetState(int roomId)
    {
        if (!_states.TryGetValue(roomId, out var state))
        {
            return new PlaybackStateDto { HasTrack = false };
        }

        return new PlaybackStateDto
        {
            HasTrack = true,
            CurrentQueueItemId = state.CurrentQueueItemId,
            SongId = state.SongId,
            Title = state.Title,
            Artist = state.Artist,
            CoverUrl = state.CoverUrl,
            MediaUrl = state.MediaUrl,
            LrcUrl = state.LrcUrl,
            OrderedByUserId = state.OrderedByUserId,
            OrderedByName = state.OrderedByName,
            IsPlaying = state.IsPlaying,
            CurrentTime = CalculateCurrentTime(state),
            Duration = state.Duration,
            PlayMode = state.PlayMode,
            HasPrev = state.History.Count > 0,
        };
    }

    /// <summary>
    /// 播放新歌。将当前歌曲快照推入 history stack。
    /// </summary>
    /// ★ 关键改动：Play 时自动 push 当前歌曲到历史栈
    public void Play(int roomId, int queueItemId, int songId, string title, string artist,
        string coverUrl, string mediaUrl, string lrcUrl, int orderedByUserId, string orderedByName,
        int duration)
    {
        var playMode = "off";
        var history = new Stack<PlayedSnapshot>();

        if (_states.TryGetValue(roomId, out var existing))
        {
            playMode = existing.PlayMode;
            // new Stack<T>(IEnumerable) 会反转顺序，需要先 Reverse
            var items = existing.History.ToArray();
            Array.Reverse(items);
            history = new Stack<PlayedSnapshot>(items);

            // 将当前歌曲推入历史快照（与 queue 解耦）
            if (existing.SongId > 0)
            {
                history.Push(new PlayedSnapshot
                {
                    QueueItemId = existing.CurrentQueueItemId,
                    SongId = existing.SongId,
                    Title = existing.Title,
                    Artist = existing.Artist,
                    CoverUrl = existing.CoverUrl,
                    MediaUrl = existing.MediaUrl,
                    LrcUrl = existing.LrcUrl,
                    OrderedByUserId = existing.OrderedByUserId,
                    OrderedByName = existing.OrderedByName,
                    Duration = existing.Duration,
                });
            }
        }

        _states[roomId] = new RoomPlaybackState
        {
            CurrentQueueItemId = queueItemId,
            SongId = songId,
            Title = title,
            Artist = artist,
            CoverUrl = coverUrl,
            MediaUrl = mediaUrl,
            LrcUrl = lrcUrl,
            OrderedByUserId = orderedByUserId,
            OrderedByName = orderedByName,
            IsPlaying = true,
            StartedAt = DateTime.UtcNow,
            Duration = duration,
            PlayMode = playMode,
            History = history,
        };
    }

    /// <summary>
    /// 从 history stack 弹出上一首快照。与 queue 无关。
    /// ★ 关键改动：prev 不依赖 queue index，纯 history 操作
    /// </summary>
    public PlayedSnapshot? PopHistory(int roomId)
    {
        if (!_states.TryGetValue(roomId, out var state))
            return null;

        if (state.History.Count == 0)
            return null;

        return state.History.Pop();
    }

    /// <summary>
    /// 从历史快照恢复播放 — 不 push history，保留已有栈
    /// </summary>
    public void PlayFromSnapshot(int roomId, PlayedSnapshot snap)
    {
        var playMode = "off";
        var history = new Stack<PlayedSnapshot>();

        if (_states.TryGetValue(roomId, out var existing))
        {
            playMode = existing.PlayMode;
            history = existing.History; // 保留已有栈，不 push
        }

        _states[roomId] = new RoomPlaybackState
        {
            CurrentQueueItemId = snap.QueueItemId,
            SongId = snap.SongId,
            Title = snap.Title,
            Artist = snap.Artist,
            CoverUrl = snap.CoverUrl,
            MediaUrl = snap.MediaUrl,
            LrcUrl = snap.LrcUrl,
            OrderedByUserId = snap.OrderedByUserId,
            OrderedByName = snap.OrderedByName,
            IsPlaying = true,
            StartedAt = DateTime.UtcNow,
            PausedPosition = 0,
            Duration = snap.Duration,
            PlayMode = playMode,
            History = history,
        };
    }

    /// <summary>
    /// 单曲循环：重置时间，不推入历史
    /// ★ 关键改动：repeat-one 不影响 history
    /// </summary>
    public void Replay(int roomId)
    {
        if (!_states.TryGetValue(roomId, out var state)) return;
        state.IsPlaying = true;
        state.StartedAt = DateTime.UtcNow;
        state.PausedPosition = 0;
    }

    public void Pause(int roomId, int userId)
    {
        if (!_states.TryGetValue(roomId, out var state) || !state.IsPlaying)
            return;

        if (state.OrderedByUserId != userId)
            throw new UnauthorizedAccessException("只有当前歌曲的点歌人才能控制播放");

        state.PausedPosition = CalculateCurrentTime(state);
        state.IsPlaying = false;
    }

    public void Resume(int roomId, int userId)
    {
        if (!_states.TryGetValue(roomId, out var state) || state.IsPlaying)
            return;

        if (state.OrderedByUserId != userId)
            throw new UnauthorizedAccessException("只有当前歌曲的点歌人才能控制播放");

        state.StartedAt = DateTime.UtcNow.AddSeconds(-state.PausedPosition);
        state.IsPlaying = true;
    }

    public void Seek(int roomId, double position, int userId)
    {
        if (!_states.TryGetValue(roomId, out var state))
            return;

        if (state.OrderedByUserId != userId)
            throw new UnauthorizedAccessException("只有当前歌曲的点歌人才能控制播放");

        state.StartedAt = DateTime.UtcNow.AddSeconds(-position);
        if (!state.IsPlaying)
            state.PausedPosition = position;
    }

    public void SetPlayMode(int roomId, string mode, int userId)
    {
        if (!_states.TryGetValue(roomId, out var state))
            return;

        if (state.OrderedByUserId != userId)
            throw new UnauthorizedAccessException("只有当前歌曲的点歌人才能控制播放");

        state.PlayMode = mode;
    }

    public string GetPlayMode(int roomId)
    {
        if (!_states.TryGetValue(roomId, out var state)) return "off";
        return state.PlayMode;
    }

    /// <summary>
    /// 停止播放，清空所有状态（含 history）
    /// </summary>
    public void Stop(int roomId)
    {
        _states.TryRemove(roomId, out _);
    }

    /// <summary>
    /// 检查歌曲是否已结束
    /// </summary>
    public bool CheckTrackEnded(int roomId)
    {
        if (!_states.TryGetValue(roomId, out var state))
            return false;

        if (!state.IsPlaying)
            return false;

        return CalculateCurrentTime(state) >= state.Duration && state.Duration > 0;
    }

    /// <summary>
    /// 检查并标记播放次数已记录，防止重复计数
    /// </summary>
    public bool TryMarkPlayCountRecorded(int roomId)
    {
        if (!_states.TryGetValue(roomId, out var state))
            return false;
        if (state.PlayCountRecorded)
            return false;
        state.PlayCountRecorded = true;
        return true;
    }

    private static double CalculateCurrentTime(RoomPlaybackState state)
    {
        if (!state.IsPlaying)
            return state.PausedPosition;

        if (state.StartedAt == null)
            return 0;

        return Math.Max(0, (DateTime.UtcNow - state.StartedAt.Value).TotalSeconds);
    }
}
