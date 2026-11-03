import os
import requests
from urllib.parse import urlparse, parse_qs

_INNERTUBE_CLIENTS = [
    {
        "clientName": "ANDROID",
        "clientVersion": "20.10.38",
        "userAgent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14; en_US)",
    },
    {
        "clientName": "WEB",
        "clientVersion": "2.20241024.10.00",
        "userAgent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/128.0.0.0 Safari/537.36"
        ),
    },
    {
        "clientName": "MWEB",
        "clientVersion": "2.20241024.10.00",
        "userAgent": (
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) "
            "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
        ),
    },
]


def get_video_id(url: str):
    parsed = urlparse(url)

    # Standard YouTube URL
    if parsed.hostname in ["www.youtube.com", "youtube.com"]:
        video_id = parse_qs(parsed.query).get("v")
        if video_id:
            return video_id[0]

    # Short YouTube URL
    if parsed.hostname == "youtu.be":
        video_id = parsed.path.strip("/")
        if video_id:
            return video_id

    return None


def _get_details_via_innertube(video_id: str) -> dict:
    """
    Try multiple Innertube clients to fetch video title, description, author.
    Returns {} if all clients fail.
    """
    for client in _INNERTUBE_CLIENTS:
        try:
            payload = {
                "context": {
                    "client": {
                        "clientName": client["clientName"],
                        "clientVersion": client["clientVersion"],
                        "hl": "en",
                        "gl": "US",
                    }
                },
                "videoId": video_id,
            }
            headers = {
                "Content-Type": "application/json",
                "User-Agent": client["userAgent"],
                "Accept-Language": "en-US,en;q=0.9",
            }
            resp = requests.post(
                "https://www.youtube.com/youtubei/v1/player",
                json=payload,
                headers=headers,
                timeout=12,
            )
            if resp.status_code != 200:
                continue
            data = resp.json()
            vd = data.get("videoDetails", {})
            title = vd.get("title", "")
            desc = vd.get("shortDescription", "")
            author = vd.get("author", "")
            if title or desc:
                return {"title": title, "description": desc, "author": author}
        except Exception:
            continue
    return {}


def _get_details_via_oembed(video_id: str) -> dict:
    """
    Fallback: YouTube oEmbed endpoint — public, no API key, never IP-blocked.
    Returns title and author_name; description is not available via oEmbed.
    """
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "title": data.get("title", ""),
                "description": "",
                "author": data.get("author_name", ""),
            }
    except Exception:
        pass
    return {}


def _get_details_via_data_api(video_id: str) -> dict:
    """
    Optional: YouTube Data API v3 (requires YOUTUBE_API_KEY env var).
    Returns title, description, channelTitle.
    """
    api_key = os.getenv("YOUTUBE_API_KEY", "").strip()
    if not api_key:
        return {}
    try:
        url = (
            f"https://www.googleapis.com/youtube/v3/videos"
            f"?part=snippet&id={video_id}&key={api_key}"
        )
        resp = requests.get(url, timeout=10)
        if resp.status_code == 200:
            items = resp.json().get("items", [])
            if items:
                snippet = items[0].get("snippet", {})
                return {
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "author": snippet.get("channelTitle", ""),
                }
    except Exception:
        pass
    return {}


def get_video_details(video_id: str):
    """
    Fetch video title, description and author.
    Tries in order:
      1. Innertube (3 client strategies)
      2. YouTube Data API v3 (only if YOUTUBE_API_KEY is set)
      3. YouTube oEmbed (public endpoint, always works)
    """
    # 1. Innertube
    details = _get_details_via_innertube(video_id)
    if details:
        return details

    # 2. YouTube Data API v3 (optional)
    details = _get_details_via_data_api(video_id)
    if details:
        return details

    # 3. oEmbed — always available, gives us at least the title
    details = _get_details_via_oembed(video_id)
    if details.get("title"):
        return details

    return {"title": "", "description": "", "author": ""}


def get_video_info(url: str):
    video_id = get_video_id(url)

    if not video_id:
        return None

    details = get_video_details(video_id)

    return {
        "video_id": video_id,
        "title": details.get("title", ""),
        "description": details.get("description", ""),
        "author": details.get("author", ""),
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
    }