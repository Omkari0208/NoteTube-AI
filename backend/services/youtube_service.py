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


def get_video_info(url: str):
    video_id = get_video_id(url)

    if not video_id:
        return None

    return {
        "video_id": video_id,
        "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
        "youtube_url": f"https://www.youtube.com/watch?v={video_id}"
    }