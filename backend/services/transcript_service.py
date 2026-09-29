from youtube_transcript_api import YouTubeTranscriptApi


def get_transcript(video_id: str):
    """
    Retrieve a YouTube transcript.

    Tries the default transcript first and then attempts common
    language codes if necessary.
    """

    try:
        if not video_id:
            return {
                "success": False,
                "transcript": "",
                "error": "YouTube video ID is missing."
            }

        api = YouTubeTranscriptApi()

        # ---------------------------------------------------------
        # Try the default transcript
        # ---------------------------------------------------------
        try:
            transcript = api.fetch(video_id)

            transcript_text = " ".join(
                item.text if hasattr(item, "text")
                else item.get("text", "")
                for item in transcript
            ).strip()

            if transcript_text:
                return {
                    "success": True,
                    "transcript": transcript_text
                }

        except Exception as first_error:
            first_error_message = str(first_error)

        # ---------------------------------------------------------
        # Try common languages
        # ---------------------------------------------------------
        languages = [
            "en",
            "en-US",
            "en-GB",
            "hi",
            "te"
        ]

        try:
            transcript_list = api.list(video_id)

            # Try manually selected/generated transcripts
            for transcript_info in transcript_list:

                language_code = getattr(
                    transcript_info,
                    "language_code",
                    ""
                )

                if language_code in languages:

                    try:
                        transcript = transcript_info.fetch()

                        transcript_text = " ".join(
                            item.text if hasattr(item, "text")
                            else item.get("text", "")
                            for item in transcript
                        ).strip()

                        if transcript_text:
                            return {
                                "success": True,
                                "transcript": transcript_text
                            }

                    except Exception:
                        continue

        except Exception:
            pass

        # ---------------------------------------------------------
        # No transcript found
        # ---------------------------------------------------------
        return {
            "success": False,
            "transcript": "",
            "error": (
                "No transcript could be retrieved for this YouTube video. "
                "The video may not have captions, or YouTube may be "
                "blocking transcript access."
            )
        }

    except Exception as e:

        return {
            "success": False,
            "transcript": "",
            "error": str(e)
        }