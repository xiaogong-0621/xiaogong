using System.Text.Json;
using System.Text.Json.Serialization;

namespace System.Text.Json.Serialization;

/// <summary>
/// Ensures all DateTime values are serialized without timezone suffix,
/// so the browser interprets them as local time (Asia/Shanghai).
/// </summary>
public class JsonConverter_UtcDateTime : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return reader.GetDateTime();
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString("yyyy-MM-dd'T'HH:mm:ss"));
    }
}
