"""Tests for the new POST /api/ai/first-message-from-bio endpoint plus regression
smoke tests for /api/ai/first-message and /api/ai/screenshot.
"""
import base64
import io
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")


# ----------------- helpers -----------------
def _tiny_jpeg_b64() -> str:
    """Generate a small 400x300 bio-like JPEG. Falls back to a 1x1 b64 jpeg."""
    try:
        from PIL import Image, ImageDraw
        img = Image.new("RGB", (400, 500), color=(255, 245, 235))
        d = ImageDraw.Draw(img)
        # Fake profile name + age
        d.text((20, 20), "Alex, 27", fill=(20, 20, 20))
        # Some prompts
        d.text((20, 80), "Two truths and a lie:", fill=(40, 40, 40))
        d.text((20, 100), "I've hiked Patagonia, I make sourdough,", fill=(20, 20, 20))
        d.text((20, 120), "I can solve a Rubik's cube in 30s", fill=(20, 20, 20))
        d.text((20, 180), "Hinge anchor: Software engineer", fill=(40, 40, 40))
        d.text((20, 220), "Loves: Indie films, espresso, golden retrievers", fill=(40, 40, 40))
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=80)
        return base64.b64encode(buf.getvalue()).decode()
    except Exception:
        # 1x1 jpeg fallback
        return (
            "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a"
            "HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy"
            "MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIA"
            "AhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQA"
            "AAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3"
            "ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWm"
            "p6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMB"
            "AAIRAxEAPwD3+iiigD//2Q=="
        )


@pytest.fixture(scope="module")
def bio_session():
    """Fresh dev-login user dedicated to bio-opener tests."""
    s = requests.Session()
    email = f"TEST_bio_{uuid.uuid4().hex[:8]}@loveassist.ai"
    r = s.post(
        f"{BASE_URL}/api/auth/dev-login",
        json={"name": "TEST Bio", "email": email},
        timeout=30,
    )
    assert r.status_code == 200, f"dev-login failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["session_token"], "user": data["user"]}


@pytest.fixture
def bio_headers(bio_session):
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {bio_session['token']}",
    }


# ====================================================================
#  POST /api/ai/first-message-from-bio  (the NEW endpoint under test)
# ====================================================================
class TestBioOpener:
    def test_happy_path_returns_suggestions(self, bio_headers):
        body = {
            "image_base64": _tiny_jpeg_b64(),
            "mode": "normal",
            "language": "en",
            "count": 4,
            "extra_context": "We matched on Hinge",
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/first-message-from-bio",
            headers=bio_headers,
            json=body,
            timeout=120,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "suggestions" in data
        suggestions = data["suggestions"]
        assert isinstance(suggestions, list)
        assert len(suggestions) >= 1, f"empty suggestions: {data}"
        # each entry must be a non-empty string
        for s in suggestions:
            assert isinstance(s, str) and s.strip(), f"bad suggestion: {s!r}"
        # at most `count` returned
        assert len(suggestions) <= 4

    def test_data_url_prefix_is_stripped(self, bio_headers):
        """Server must strip a `data:image/jpeg;base64,` prefix before calling Claude."""
        body = {
            "image_base64": "data:image/jpeg;base64," + _tiny_jpeg_b64(),
            "mode": "normal",
            "language": "en",
            "count": 2,
            "extra_context": "",
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/first-message-from-bio",
            headers=bio_headers,
            json=body,
            timeout=120,
        )
        assert r.status_code == 200, r.text
        assert isinstance(r.json().get("suggestions"), list)

    def test_missing_auth_returns_401(self):
        body = {
            "image_base64": _tiny_jpeg_b64(),
            "mode": "normal",
            "language": "en",
            "count": 4,
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/first-message-from-bio",
            headers={"Content-Type": "application/json"},
            json=body,
            timeout=30,
        )
        assert r.status_code == 401, r.text

    def test_bad_token_returns_401(self):
        body = {
            "image_base64": _tiny_jpeg_b64(),
            "mode": "normal",
            "language": "en",
            "count": 4,
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/first-message-from-bio",
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer not_a_real_token",
            },
            json=body,
            timeout=30,
        )
        assert r.status_code == 401, r.text

    def test_empty_image_returns_400(self, bio_headers):
        body = {
            "image_base64": "",
            "mode": "normal",
            "language": "en",
            "count": 4,
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/first-message-from-bio",
            headers=bio_headers,
            json=body,
            timeout=30,
        )
        assert r.status_code == 400, r.text

    def test_response_no_objectid_leak(self, bio_headers):
        body = {
            "image_base64": _tiny_jpeg_b64(),
            "mode": "normal",
            "language": "en",
            "count": 2,
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/first-message-from-bio",
            headers=bio_headers,
            json=body,
            timeout=120,
        )
        assert r.status_code == 200
        assert "_id" not in r.text


# ====================================================================
#  Regression smoke tests for the EXISTING endpoints
# ====================================================================
class TestExistingAiEndpointsRegression:
    def test_first_message_text_based_still_works(self, bio_headers):
        body = {
            "about_person": "Loves hiking and indie music",
            "context": "",
            "mode": "normal",
            "language": "en",
            "count": 4,
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/first-message",
            headers=bio_headers,
            json=body,
            timeout=90,
        )
        assert r.status_code == 200, r.text
        sugg = r.json()["suggestions"]
        assert isinstance(sugg, list) and len(sugg) >= 1
        for s in sugg:
            assert isinstance(s, str) and s.strip()

    def test_screenshot_endpoint_still_works(self, bio_headers):
        body = {
            "image_base64": _tiny_jpeg_b64(),
            "mode": "normal",
            "language": "en",
            "count": 3,
            "extra_context": "test screenshot",
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/screenshot",
            headers=bio_headers,
            json=body,
            timeout=120,
        )
        assert r.status_code == 200, r.text
        sugg = r.json()["suggestions"]
        assert isinstance(sugg, list) and len(sugg) >= 1

    def test_screenshot_empty_b64_returns_400(self, bio_headers):
        body = {"image_base64": "", "mode": "normal", "language": "en"}
        r = requests.post(
            f"{BASE_URL}/api/ai/screenshot",
            headers=bio_headers,
            json=body,
            timeout=30,
        )
        assert r.status_code == 400
