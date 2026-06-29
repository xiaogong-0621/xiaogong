namespace backend.DTOs;

public class PlaybackStateDto
{
    public bool HasTrack { get; set; }
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
    public double CurrentTime { get; set; }
    public int Duration { get; set; }
    public string PlayMode { get; set; } = "off";
    public bool HasPrev { get; set; }
}

public class PlayRequest
{
    public int QueueItemId { get; set; }
}

public class SeekRequest
{
    public double Position { get; set; }
}

public class PlayModeRequest
{
    public string Mode { get; set; } = "off";
}
