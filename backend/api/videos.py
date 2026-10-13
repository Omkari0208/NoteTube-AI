from fastapi import APIRouter
from pydantic import BaseModel

from services.youtube_service import get_video_info
from services.transcript_service import get_transcript
from services.text_service import clean_transcript
from services.ai_service import generate_notes


router = APIRouter(
    prefix="/api/videos",
    tags=["Videos"]
)


class VideoRequest(BaseModel):
    url: str


@router.post("/validate")
def validate_video(request: VideoRequest):
    try:
        video_info = get_video_info(request.url)

        if not video_info:
            return {
                "success": False,
                "valid": False,
                "message": "Invalid YouTube URL"
            }

        return {
            "success": True,
            "valid": True,
            "message": "YouTube video is valid",
            "video_id": video_info["video_id"],
            "thumbnail": video_info["thumbnail"],
            "youtube_url": video_info["youtube_url"]
        }

    except Exception as e:
        return {
            "success": False,
            "valid": False,
            "message": "Video validation failed",
            "error": str(e)
        }


@router.post("/transcript")
def fetch_transcript(request: VideoRequest):
    try:
        video_info = get_video_info(request.url)

        if not video_info:
            return {
                "success": False,
                "message": "Invalid YouTube URL"
            }

        transcript_data = get_transcript(
            video_info["video_id"]
        )

        if not transcript_data["success"]:
            return {
                "success": False,
                "message": "Transcript could not be retrieved",
                "error": transcript_data.get("error")
            }

        cleaned_transcript = clean_transcript(
            transcript_data["transcript"]
        )

        return {
            "success": True,
            "video_id": video_info["video_id"],
            "transcript": cleaned_transcript
        }

    except Exception as e:
        return {
            "success": False,
            "message": "Transcript processing failed",
            "error": str(e)
        }


@router.post("/generate-notes")
def generate_video_notes(request: VideoRequest):

    try:

        # ---------------------------------------------------------
        # STEP 1: Get YouTube video information
        # ---------------------------------------------------------

        video_info = get_video_info(request.url)

        if not video_info:
            return {
                "success": False,
                "message": "Invalid YouTube URL"
            }

        # ---------------------------------------------------------
        # STEP 2: Get transcript (with fallback to video details)
        # ---------------------------------------------------------

        transcript_data = get_transcript(
            video_info["video_id"]
        )

        cleaned_transcript = ""
        if transcript_data.get("success"):
            cleaned_transcript = clean_transcript(
                transcript_data["transcript"]
            )

        video_title = video_info.get("title", "")
        video_description = video_info.get("description", "")

        # If transcript failed and there is neither title nor description
        if not cleaned_transcript and not video_description and not video_title:
            return {
                "success": False,
                "message": "Transcript could not be retrieved and no video details were found.",
                "error": transcript_data.get("error", "No transcript available")
            }

        # ---------------------------------------------------------
        # STEP 3: Generate AI study material
        # ---------------------------------------------------------

        notes = generate_notes(
            cleaned_transcript,
            video_title=video_title,
            video_description=video_description
        )

        if not notes["success"]:
            return {
                "success": False,
                "message": "AI could not generate study material",
                "error": notes.get("error")
            }

        # ---------------------------------------------------------
        # STEP 5: Return result
        # ---------------------------------------------------------

        return {
            "success": True,
            "video_id": video_info["video_id"],
            "thumbnail": video_info["thumbnail"],
            "youtube_url": video_info["youtube_url"],
            "notes": notes["notes"]
        }

    except Exception as e:

        # IMPORTANT:
        # This lets us see the actual backend error
        # instead of only "Internal Server Error".

        return {
            "success": False,
            "message": "Backend error while generating notes",
            "error": str(e),
            "error_type": type(e).__name__
        }