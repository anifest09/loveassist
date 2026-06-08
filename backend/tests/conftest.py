import os
import pytest
import requests
from pathlib import Path

# Load env from frontend/.env (where EXPO_PUBLIC_BACKEND_URL lives)
def _load_env(*relative_paths):
    base = Path(__file__).resolve().parents[2]
    for rp in relative_paths:
        env_path = base / rp
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                os.environ.setdefault(k.strip(), v)

_load_env("frontend/.env", "backend/.env")

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("EXPO_PUBLIC_BACKEND_URL not set")


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def session_data():
    """Create a fresh demo user; yield token + user."""
    import uuid
    s = requests.Session()
    email = f"TEST_demo_{uuid.uuid4().hex[:8]}@loveassist.ai"
    r = s.post(f"{BASE_URL}/api/auth/dev-login",
               json={"name": "TEST Demo", "email": email}, timeout=30)
    assert r.status_code == 200, f"dev-login failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["session_token"], "user": data["user"], "email": email}


@pytest.fixture
def auth_headers(session_data):
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {session_data['token']}",
    }
