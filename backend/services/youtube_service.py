import json
import urllib.request
from urllib.parse import urlparse, parse_qs


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


def get_video_details(video_id: str):
    """
    Fetch video metadata (title, description, author) using YouTube's Innertube API.
    """
    try:
        data = json.dumps({
            "context": {
                "client": {
                    "clientName": "ANDROID",
                    "clientVersion": "20.10.38",
                    "hl": "en",
                    "gl": "US"
                }
            },
            "videoId": video_id
        }).encode("utf-8")

        req = urllib.request.Request(
            "https://www.youtube.com/youtubei/v1/player",
            data=data,
            headers={
                "Content-Type": "application/json",
                "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14; en_US)"
            }
        )

        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
            video_details = result.get("videoDetails", {})
            return {
                "title": video_details.get("title", ""),
                "description": video_details.get("shortDescription", ""),
                "author": video_details.get("author", "")
            }
    except Exception as e:
        return {
            "title": "",
            "description": "",
            "author": "",
            "error": str(e)
        }


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
        "youtube_url": f"https://www.youtube.com/watch?v={video_id}"
    }