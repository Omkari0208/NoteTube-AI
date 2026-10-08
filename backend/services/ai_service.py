import json
import os

from groq import Groq


# ============================================================
# LOAD GROQ API KEY
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY environment variable is missing."
    )


# ============================================================
# CREATE GROQ CLIENT
# ============================================================

client = Groq(api_key=GROQ_API_KEY)


# ============================================================
# GENERATE STUDY MATERIAL
# ============================================================

def generate_notes(transcript: str):

    if not transcript or not transcript.strip():
        return {
            "success": False,
            "notes": {},
            "error": "Transcript is empty",
            "error_type": "EMPTY_TRANSCRIPT"
        }

    prompt = f"""
You are an expert academic study-material generator.

Analyze the following YouTube video transcript and create
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

- Use only information supported by the transcript.
- Do not invent unrelated information.
- Make the content useful for college students.
- Use simple and clear English.
- Return ONLY JSON.
- Do NOT use Markdown code fences.
- Do NOT add explanations outside the JSON.

VIDEO TRANSCRIPT:

{transcript}
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
            temperature=0.2,
            max_tokens=12000
        )

        # ====================================================
        # GET AI RESPONSE
        # ====================================================

        text = response.choices[0].message.content.strip()

        # Remove Markdown code fences if AI adds them
        if text.startswith("```json"):
            text = text[7:]

        elif text.startswith("```"):
            text = text[3:]

        if text.endswith("```"):
            text = text[:-3]

        text = text.strip()

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
        # CHECK REQUIRED KEYS
        # ====================================================

        required_keys = [
            "title",
            "overview",
            "detailed_content",
            "key_concepts",
            "definitions",
            "examples",
            "important_points",
            "vsaq",
            "saq",
            "laq",
            "mcq",
            "fill_in_the_blanks",
            "quick_revision"
        ]

        missing_keys = [
            key
            for key in required_keys
            if key not in data
        ]

        if missing_keys:
            return {
                "success": False,
                "notes": {},
                "error": (
                    "AI response is missing keys: "
                    + ", ".join(missing_keys)
                ),
                "error_type": "MISSING_KEYS"
            }

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