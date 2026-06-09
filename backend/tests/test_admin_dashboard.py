"""Admin Dashboard backend tests.

Covers:
- POST /api/auth/dev-login -> creates login_events row (3x for admin)
- GET  /api/auth/me -> is_admin true for ADMIN_EMAILS, false for others
- GET  /api/admin/stats -> 200 for admin (with all new fields), 403 for non-admin, 401 for no token
- Regression smoke: /api/auth/me, /api/ai/first-message, /api/subscription/status
"""
import os
import uuid
import pytest
import requests
from pathlib import Path

# Reuse env loader from conftest if not already loaded
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # load frontend/.env directly
    fp = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    if fp.exists():
        for line in fp.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")

ADMIN_EMAIL = "deepaksinghania755@gmail.com"


# ---------- Mongo helper for verifying login_events persistence ----------
def _mongo_count_login_events(email):
    """Best-effort count of login_events for an email via direct Mongo connection."""
    try:
        from pymongo import MongoClient
        # Read backend env
        be = Path(__file__).resolve().parents[2] / "backend" / ".env"
        env = {}
        if be.exists():
            for line in be.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
        mongo_url = env.get("MONGO_URL") or os.environ.get("MONGO_URL")
        db_name = env.get("DB_NAME") or os.environ.get("DB_NAME")
        if not mongo_url or not db_name:
            return None
        cli = MongoClient(mongo_url, serverSelectionTimeoutMS=3000)
        return cli[db_name]["login_events"].count_documents({"email": email})
    except Exception as e:
        print(f"Mongo verify skipped: {e}")
        return None


# ---------- Fixtures: admin + non-admin sessions ----------
@pytest.fixture(scope="module")
def admin_session():
    """Login admin 3 times to generate 3 login events."""
    s = requests.Session()
    tokens = []
    for _ in range(3):
        r = s.post(
            f"{BASE_URL}/api/auth/dev-login",
            json={"email": ADMIN_EMAIL, "name": "Deepak Admin"},
            timeout=30,
        )
        assert r.status_code == 200, f"dev-login failed: {r.status_code} {r.text}"
        tokens.append(r.json()["session_token"])
    return {"tokens": tokens, "last_token": tokens[-1]}


@pytest.fixture(scope="module")
def non_admin_session():
    s = requests.Session()
    email = f"TEST_random_{uuid.uuid4().hex[:8]}@test.com"
    r = s.post(
        f"{BASE_URL}/api/auth/dev-login",
        json={"email": email, "name": "Random"},
        timeout=30,
    )
    assert r.status_code == 200
    data = r.json()
    return {"token": data["session_token"], "email": email}


# ===================== 1. Login events tracking =====================
class TestLoginEvents:
    def test_dev_login_returns_session_token(self, admin_session):
        assert all(t and isinstance(t, str) for t in admin_session["tokens"])
        assert len(admin_session["tokens"]) == 3

    def test_login_events_persisted_admin_min_3(self, admin_session):
        """Verify >=3 login_events for the admin email (via /admin/stats or direct mongo)."""
        # Use admin/stats since it exposes logins_total + we just logged in 3x
        headers = {"Authorization": f"Bearer {admin_session['last_token']}"}
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["logins_total"] >= 3, f"logins_total={data['logins_total']} expected >=3"
        # Direct mongo cross-check (if available)
        m = _mongo_count_login_events(ADMIN_EMAIL)
        if m is not None:
            assert m >= 3, f"Mongo login_events for admin = {m}, expected >=3"


# ===================== 2. /auth/me is_admin =====================
class TestAuthMeIsAdmin:
    def test_admin_is_admin_true(self, admin_session):
        headers = {"Authorization": f"Bearer {admin_session['last_token']}"}
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "user" in body
        assert body["user"].get("is_admin") is True, body["user"]
        assert body["user"]["email"].lower() == ADMIN_EMAIL.lower()

    def test_non_admin_is_admin_false(self, non_admin_session):
        headers = {"Authorization": f"Bearer {non_admin_session['token']}"}
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["user"].get("is_admin") in (False, None, 0), body["user"]


# ===================== 3. /admin/stats access + shape =====================
class TestAdminStats:
    def test_admin_stats_200_and_shape(self, admin_session):
        headers = {"Authorization": f"Bearer {admin_session['last_token']}"}
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()

        # numeric fields
        for k in [
            "total_users", "signups_today", "signups_yesterday", "signups_week",
            "signups_month", "active_sessions", "premium_users", "trial_users",
            "logins_today", "logins_week", "logins_total",
        ]:
            assert k in d, f"missing field {k}"
            assert isinstance(d[k], int), f"{k} should be int, got {type(d[k])}"

        # login_methods sub-object
        assert "login_methods" in d
        assert isinstance(d["login_methods"], dict)
        assert isinstance(d["login_methods"].get("google"), int)
        assert isinstance(d["login_methods"].get("apple"), int)

        # recent_signups
        assert isinstance(d.get("recent_signups"), list)
        for u in d["recent_signups"]:
            assert "email" in u
            assert "name" in u
            assert "created_at" in u

        # daily_signups - 7 entries
        assert isinstance(d.get("daily_signups"), list)
        assert len(d["daily_signups"]) == 7
        for entry in d["daily_signups"]:
            assert "date" in entry and "count" in entry
            assert isinstance(entry["count"], int)

        # daily_logins - NEW field, 7 entries
        assert isinstance(d.get("daily_logins"), list), "daily_logins missing"
        assert len(d["daily_logins"]) == 7, f"daily_logins len={len(d['daily_logins'])}"
        for entry in d["daily_logins"]:
            assert "date" in entry and "count" in entry
            assert isinstance(entry["count"], int)

        # generated_at iso string
        assert isinstance(d.get("generated_at"), str)
        assert "T" in d["generated_at"]

        # logins_total should reflect our 3 admin logins + non-admin login at minimum
        assert d["logins_total"] >= 3

    def test_admin_stats_403_for_non_admin(self, non_admin_session):
        headers = {"Authorization": f"Bearer {non_admin_session['token']}"}
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=headers, timeout=15)
        assert r.status_code == 403, f"expected 403 got {r.status_code} {r.text}"

    def test_admin_stats_401_no_token(self):
        r = requests.get(f"{BASE_URL}/api/admin/stats", timeout=15)
        assert r.status_code == 401, f"expected 401 got {r.status_code} {r.text}"


# ===================== 4. Regression smoke =====================
class TestRegressionSmoke:
    def test_auth_me_works(self, admin_session):
        headers = {"Authorization": f"Bearer {admin_session['last_token']}"}
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=15)
        assert r.status_code == 200

    def test_subscription_status_works(self, admin_session):
        headers = {"Authorization": f"Bearer {admin_session['last_token']}"}
        r = requests.get(f"{BASE_URL}/api/subscription/status", headers=headers, timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "subscription" in body

    def test_ai_first_message_works(self, admin_session):
        headers = {"Authorization": f"Bearer {admin_session['last_token']}"}
        payload = {
            "about_person": "A coffee-loving designer I matched with on Hinge.",
            "context": "Mentioned loves trail running.",
            "mode": "normal",
            "language": "en",
            "count": 2,
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/first-message",
            headers=headers, json=payload, timeout=60,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "suggestions" in body
        assert isinstance(body["suggestions"], list)
        assert len(body["suggestions"]) >= 1
        assert all(isinstance(s, str) and s.strip() for s in body["suggestions"])
