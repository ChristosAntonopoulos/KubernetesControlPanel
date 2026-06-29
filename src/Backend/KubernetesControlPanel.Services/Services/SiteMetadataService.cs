using System.Net;
using System.Text.RegularExpressions;
using KubernetesControlPanel.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Http;

namespace KubernetesControlPanel.Services.Services;

public class SiteMetadataService : ISiteMetadataService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(24);
    private static readonly TimeSpan RequestTimeout = TimeSpan.FromSeconds(5);
    private const int MaxHtmlBytes = 512_000;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SiteMetadataService> _logger;

    public SiteMetadataService(
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache,
        ILogger<SiteMetadataService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _logger = logger;
    }

    public async Task<SiteMetadata?> FetchAsync(string url, CancellationToken cancellationToken = default)
    {
        if (!TryNormalizeUrl(url, out var uri))
            return null;

        var cacheKey = $"site-meta:{uri.GetLeftPart(UriPartial.Path)}";
        if (_cache.TryGetValue(cacheKey, out SiteMetadata? cached))
            return cached;

        try
        {
            var metadata = await FetchInternalAsync(uri, cancellationToken);
            _cache.Set(cacheKey, metadata, CacheTtl);
            return metadata;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to fetch site metadata for {Url}", uri);
            var fallback = new SiteMetadata { FaviconUrl = $"{uri.Scheme}://{uri.Authority}/favicon.ico" };
            _cache.Set(cacheKey, fallback, TimeSpan.FromMinutes(30));
            return fallback;
        }
    }

    private async Task<SiteMetadata> FetchInternalAsync(Uri uri, CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.Timeout = RequestTimeout;
        client.DefaultRequestHeaders.UserAgent.ParseAdd("K8sControlPanel/1.0");

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(RequestTimeout);

        using var response = await client.GetAsync(uri, HttpCompletionOption.ResponseHeadersRead, cts.Token);
        response.EnsureSuccessStatusCode();

        var contentType = response.Content.Headers.ContentType?.MediaType ?? "";
        var html = contentType.Contains("html", StringComparison.OrdinalIgnoreCase)
            ? await ReadLimitedAsync(response.Content, cts.Token)
            : "";

        var title = !string.IsNullOrWhiteSpace(html) ? ExtractTitle(html) : null;
        var favicon = !string.IsNullOrWhiteSpace(html)
            ? ResolveUrl(uri, ExtractFaviconHref(html))
            : null;

        favicon ??= $"{uri.Scheme}://{uri.Authority}/favicon.ico";

        return new SiteMetadata { Title = title, FaviconUrl = favicon };
    }

    private static async Task<string> ReadLimitedAsync(HttpContent content, CancellationToken cancellationToken)
    {
        await using var stream = await content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);
        var buffer = new char[MaxHtmlBytes];
        var read = await reader.ReadAsync(buffer.AsMemory(0, MaxHtmlBytes), cancellationToken);
        return new string(buffer, 0, read);
    }

    private static string? ExtractTitle(string html)
    {
        var match = Regex.Match(html, @"<title[^>]*>([^<]*)</title>", RegexOptions.IgnoreCase);
        if (!match.Success) return null;
        return WebUtility.HtmlDecode(match.Groups[1].Value.Trim());
    }

    private static string? ExtractFaviconHref(string html)
    {
        var linkPattern = @"<link\b[^>]*\brel\s*=\s*[""'](?:shortcut\s+icon|icon|apple-touch-icon)[""'][^>]*>";
        foreach (Match match in Regex.Matches(html, linkPattern, RegexOptions.IgnoreCase))
        {
            var tag = match.Value;
            var hrefMatch = Regex.Match(tag, @"\bhref\s*=\s*[""']([^""']+)[""']", RegexOptions.IgnoreCase);
            if (hrefMatch.Success)
                return hrefMatch.Groups[1].Value.Trim();
        }
        return null;
    }

    private static string? ResolveUrl(Uri baseUri, string? href)
    {
        if (string.IsNullOrWhiteSpace(href)) return null;
        if (Uri.TryCreate(href, UriKind.Absolute, out var absolute))
            return absolute.ToString();
        if (Uri.TryCreate(baseUri, href, out var resolved))
            return resolved.ToString();
        return null;
    }

    private static bool TryNormalizeUrl(string url, out Uri uri)
    {
        uri = null!;
        if (!Uri.TryCreate(url, UriKind.Absolute, out var parsed))
            return false;
        if (parsed.Scheme is not ("http" or "https"))
            return false;
        if (IsBlockedHost(parsed))
            return false;
        uri = parsed;
        return true;
    }

    private static bool IsBlockedHost(Uri uri)
    {
        if (uri.IsLoopback) return true;
        if (!IPAddress.TryParse(uri.Host, out var ip))
            return uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase);

        if (IPAddress.IsLoopback(ip)) return true;

        var bytes = ip.GetAddressBytes();
        if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
        {
            if (bytes[0] == 10) return true;
            if (bytes[0] == 172 && bytes[1] >= 16 && bytes[1] <= 31) return true;
            if (bytes[0] == 192 && bytes[1] == 168) return true;
            if (bytes[0] == 127) return true;
            if (bytes[0] == 169 && bytes[1] == 254) return true;
        }

        return false;
    }
}
