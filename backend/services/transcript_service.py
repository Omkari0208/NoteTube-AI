from youtube_transcript_api import YouTubeTranscriptApi


def _extract_text(transcript_items) -> str:
    return " ".join(
        item.text if hasattr(item, "text") else item.get("text", "")
        for item in transcript_items
    ).strip()


def get_transcript(video_id: str):
    """
    Retrieve a YouTube transcript.

    Strategy:
    1. Try api.fetch() with default language.
    2. Try every available transcript (any language) via api.list().
    3. Return failure — caller should fall back to video metadata.
    """
    if not video_id:
        return {
            "success": False,
            "transcript": "",
            "error": "YouTube video ID is missing."
        }

    try:
        api = YouTubeTranscriptApi()

        # ---------------------------------------------------------
        # Strategy 1: Default fetch
        # ---------------------------------------------------------
        try:
            transcript = api.fetch(video_id)
            text = _extract_text(transcript)
            if text:
                return {"success": True, "transcript": text}
        except Exception:
            pass

        # ---------------------------------------------------------
        # Strategy 2: Try ALL available transcripts in any language
        # ---------------------------------------------------------
        try:
            transcript_list = list(api.list(video_id))

            # Prefer English, then any other language
            priority = ["en", "en-US", "en-GB"]
            ordered = sorted(
                transcript_list,
                key=lambda t: (0 if getattr(t, "language_code", "") in priority else 1)
            )

            for transcript_info in ordered:
                try:
                    transcript = transcript_info.fetch()
                    text = _extract_text(transcript)
                    if text:
                        return {"success": True, "transcript": text}
                except Exception:
                    continue
        except Exception:
            pass

        return {
            "success": False,
            "transcript": "",
            "error": (
                "No transcript could be retrieved. "
                "YouTube may be blocking caption access from this server."
            )
        }

    except Exception as e:
        return {
            "success": False,
            "transcript": "",
            "error": str(e)
        }