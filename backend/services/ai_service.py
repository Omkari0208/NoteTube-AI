import json
import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# ============================================================
# GROQ CLIENT HELPER
# ============================================================

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    return Groq(api_key=api_key)


# ============================================================
# GENERATE STUDY MATERIAL
# ============================================================

def generate_notes(transcript: str, video_title: str = "", video_description: str = ""):

    content_source = (transcript or "").strip()
    if not content_source:
        # Fallback to video title and description if transcript is unavailable
        meta_parts = []
        if video_title:
            meta_parts.append(f"Title: {video_title}")
        if video_description:
            meta_parts.append(f"Description:\n{video_description}")
        content_source = "\n\n".join(meta_parts).strip()

    if not content_source:
        return {
            "success": False,
            "notes": {},
            "error": "No transcript or video content is available to generate notes.",
            "error_type": "EMPTY_TRANSCRIPT"
        }

    client = get_groq_client()
    if not client:
        return {
            "success": False,
            "notes": {},
            "error": "GROQ_API_KEY environment variable is missing. Check your backend configuration.",
            "error_type": "AUTHENTICATION_ERROR"
        }

    prompt = f"""
You are an expert academic study-material generator.

Analyze the following YouTube video content / transcript and create
COMPLETE, accurate, student-friendly study material.
COMPLETE, accurate, student-friendly study material.

Do NOT create only a short summary.

Return ONLY valid JSON.

The JSON must contain EXACTLY these keys:

{{
  "title": "",
  "overview": "",
  "detailed_content": "",
  "key_concepts": [],
  "definitions": [],
  "examples": [],
  "important_points": [],
  "vsaq": [],
  "saq": [],
  "laq": [],
  "mcq": [],
  "fill_in_the_blanks": [],
  "quick_revision": []
}}

REQUIREMENTS:

1. title:
Give a suitable title for the video topic.

2. overview:
Give a clear student-friendly overview.

3. detailed_content:
Explain the topic in detail using simple language.

4. key_concepts:
List the important concepts.

5. definitions:
Give important definitions.

6. examples:
Give useful examples wherever applicable.

7. important_points:
List important points students should remember.

8. vsaq:
Create exactly 5 very short answer questions.

Each item:
{{
  "question": "",
  "answer": ""
}}

9. saq:
Create exactly 5 short answer questions.

Each item:
{{
  "question": "",
  "answer": ""
}}

10. laq:
Create exactly 3 long answer questions.

Each item:
{{
  "question": "",
  "answer": ""
}}

11. mcq:
Create exactly 5 multiple-choice questions.

Each item:
{{
  "question": "",
  "options": ["A", "B", "C", "D"],
  "answer": ""
}}

12. fill_in_the_blanks:
Create exactly 5 fill-in-the-blank questions.

Each item:
{{
  "question": "",
  "answer": ""
}}

13. quick_revision:
Give important points for quick revision.

IMPORTANT RULES:

- If a full transcript is provided, base the study material faithfully on the video content.
- If only a video topic/title/description is available (due to missing transcript or captions), generate FULL, rich, in-depth academic study material comprehensively explaining the topic from educational computer science / domain fundamentals.
- Do NOT return empty fields, placeholder errors, or refusal messages. Every single key in the JSON must be fully populated with valuable educational content for college students.
- Make the content useful, clear, and structured for exam preparation.
- Use simple, professional English.
- Return ONLY valid JSON.
- Do NOT use Markdown code fences.
- Do NOT add explanations outside the JSON.

VIDEO TRANSCRIPT / TOPIC CONTENT:

{content_source[:15000]}
"""

    try:

        # ====================================================
        # CALL GROQ API
        # ====================================================

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert academic study-material "
                        "generator. Return valid JSON only."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=8000
        )

        # ====================================================
        # GET AI RESPONSE
        # ====================================================

        raw_text = response.choices[0].message.content or ""
        text = raw_text.strip()

        # Remove Markdown code fences if AI adds them
        if text.startswith("```json"):
            text = text[7:]

        elif text.startswith("```"):
            text = text[3:]

        if text.endswith("```"):
            text = text[:-3]

        text = text.strip()

        # Fallback extraction between outer braces
        if not (text.startswith("{") and text.endswith("}")):
            start_idx = text.find("{")
            end_idx = text.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                text = text[start_idx:end_idx + 1]

        # ====================================================
        # CONVERT RESPONSE TO JSON
        # ====================================================

        try:
            data = json.loads(text)

        except json.JSONDecodeError as e:
            return {
                "success": False,
                "notes": {},
                "error": f"AI returned invalid JSON: {str(e)}",
                "error_type": "INVALID_JSON"
            }

        # ====================================================
        # POPULATE DEFAULTS FOR MISSING KEYS
        # ====================================================

        defaults = {
            "title": video_title or "Study Material",
            "overview": "",
            "detailed_content": "",
            "key_concepts": [],
            "definitions": [],
            "examples": [],
            "important_points": [],
            "vsaq": [],
            "saq": [],
            "laq": [],
            "mcq": [],
            "fill_in_the_blanks": [],
            "quick_revision": []
        }

        for k, v in defaults.items():
            if k not in data or data[k] is None:
                data[k] = v

        # ====================================================
        # SUCCESS
        # ====================================================

        return {
            "success": True,
            "notes": data
        }

    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as e:

        error_message = str(e)
        error_lower = error_message.lower()

        # ----------------------------------------------------
        # RATE LIMIT
        # ----------------------------------------------------

        if (
            "rate_limit" in error_lower
            or "rate limit" in error_lower
            or "429" in error_lower
        ):
            return {
                "success": False,
                "notes": {},
                "error": (
                    "Groq API rate limit reached. "
                    "Please wait and try again."
                ),
                "error_type": "RATE_LIMIT"
            }

        # ----------------------------------------------------
        # AUTHENTICATION / API KEY
        # ----------------------------------------------------

        if (
            "authentication" in error_lower
            or "api key" in error_lower
            or "401" in error_lower
            or "invalid api key" in error_lower
        ):
            return {
                "success": False,
                "notes": {},
                "error": (
                    "Groq API key is invalid or missing. "
                    "Check your GROQ_API_KEY environment variable."
                ),
                "error_type": "AUTHENTICATION_ERROR"
            }

        # ----------------------------------------------------
        # PERMISSION
        # ----------------------------------------------------

        if (
            "403" in error_lower
            or "permission" in error_lower
        ):
            return {
                "success": False,
                "notes": {},
                "error": (
                    "Groq API permission error. "
                    "Check your Groq API key and account access."
                ),
                "error_type": "PERMISSION_ERROR"
            }

        # ----------------------------------------------------
        # MODEL NOT FOUND
        # ----------------------------------------------------

        if (
            "404" in error_lower
            or (
                "model" in error_lower
                and "not found" in error_lower
            )
        ):
            return {
                "success": False,
                "notes": {},
                "error": (
                    "The selected Groq model is unavailable. "
                    "Please check the model name."
                ),
                "error_type": "MODEL_NOT_FOUND"
            }

        # ----------------------------------------------------
        # OTHER GROQ ERRORS
        # ----------------------------------------------------

        return {
            "success": False,
            "notes": {},
            "error": error_message,
            "error_type": "GROQ_ERROR"
        }