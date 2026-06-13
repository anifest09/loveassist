import os
import re
import json
import uuid
import logging
import httpx
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]

# Admin emails — only these accounts can access /api/admin/stats
ADMIN_EMAILS = {
    e.strip().lower()
    for e in os.environ.get("ADMIN_EMAILS", "deepaksinghania755@gmail.com").split(",")
    if e.strip()
}

mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client[DB_NAME]

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ===================== Models =====================
class GoogleSessionRequest(BaseModel):
    session_token: str


class SuggestionRequest(BaseModel):
    context: str
    relationship: str = "crush"
    mode: Literal["normal", "flirty", "exclusive"] = "normal"
    language: str = "en"
    count: int = 4


class FirstMessageRequest(BaseModel):
    about_person: str
    context: str = ""
    mode: Literal["normal", "flirty", "exclusive"] = "normal"
    language: str = "en"
    count: int = 4


class ScreenshotRequest(BaseModel):
    image_base64: str
    mode: Literal["normal", "flirty", "exclusive"] = "normal"
    language: str = "en"
    count: int = 4
    extra_context: str = ""


class BioOpenerRequest(BaseModel):
    image_base64: str
    mode: Literal["normal", "flirty", "exclusive"] = "normal"
    language: str = "en"
    count: int = 4
    extra_context: str = ""


class SaveHistoryRequest(BaseModel):
    kind: str
    prompt_summary: str
    suggestions: List[str]
    mode: str
    language: str


class UpdateSettingsRequest(BaseModel):
    preferred_language: Optional[str] = None
    default_mode: Optional[str] = None


class AppleFullName(BaseModel):
    givenName: Optional[str] = None
    familyName: Optional[str] = None


class AppleAuthRequest(BaseModel):
    identity_token: str
    nonce: Optional[str] = None
    full_name: Optional[AppleFullName] = None
    email: Optional[str] = None


class TranslateRequest(BaseModel):
    texts: List[str]
    target_language: str
    source_language: Optional[str] = None
    preserve_tone: bool = True


class CreatePaymentRequest(BaseModel):
    plan: str = "monthly_premium"
    return_url: Optional[str] = None
    cancel_url: Optional[str] = None


class CapturePayPalRequest(BaseModel):
    order_id: str



# ===================== Helpers =====================
def _aware(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


async def get_user_from_token(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[7:]
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = _aware(session.get("expires_at"))
    if expires_at and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_or_create_user(email: str, name: str, picture: Optional[str]) -> dict:
    now = datetime.now(timezone.utc)
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        await db.users.update_one(
            {"user_id": existing["user_id"]},
            {"$set": {"name": name or existing.get("name", ""), "picture": picture}},
        )
        return existing
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "picture": picture,
        "preferred_language": "en",
        "default_mode": "normal",
        "created_at": now,
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("_id", None)
    # No auto-trial on signup - users must add payment method first
    return user_doc


async def record_login_event(user_id: str, email: str, method: str) -> None:
    """Insert a login event for admin analytics. Best-effort, never raises."""
    try:
        await db.login_events.insert_one(
            {
                "user_id": user_id,
                "email": email,
                "method": method,  # "google" | "apple" | "dev"
                "created_at": datetime.now(timezone.utc),
            }
        )
    except Exception:
        logging.exception("record_login_event failed (non-fatal)")


async def get_subscription(user_id: str) -> dict:
    sub = await db.subscriptions.find_one({"user_id": user_id}, {"_id": 0})
    if not sub:
        return {"user_id": user_id, "status": "none", "mode": "none",
                "trial_end": None, "premium_until": None}
    end = _aware(sub.get("premium_until") or sub.get("trial_end"))
    now = datetime.now(timezone.utc)
    if end and end < now and sub.get("status") in ("trialing", "active"):
        await db.subscriptions.update_one(
            {"user_id": user_id}, {"$set": {"status": "expired"}}
        )
        sub["status"] = "expired"
    # Normalize datetime to iso strings for response
    for k in ("trial_end", "premium_until", "created_at", "updated_at"):
        if sub.get(k) and isinstance(sub[k], datetime):
            sub[k] = _aware(sub[k]).isoformat()
    return sub


# ===================== Auth =====================
@api_router.post("/auth/google/session")
async def google_session(req: GoogleSessionRequest):
    async with httpx.AsyncClient(timeout=10.0) as http:
        r = await http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": req.session_token},
        )
        if r.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session token")
        data = r.json()

    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email missing in session data")
    name = data.get("name", "")
    picture = data.get("picture")
    user = await get_or_create_user(email, name, picture)

    session_token = data.get("session_token") or req.session_token
    now = datetime.now(timezone.utc)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {
            "$set": {
                "session_token": session_token,
                "user_id": user["user_id"],
                "expires_at": now + timedelta(days=7),
                "created_at": now,
            }
        },
        upsert=True,
    )
    user_fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    await record_login_event(user["user_id"], user_fresh.get("email") or "", "google")
    return {"session_token": session_token, "user": user_fresh}


# ----- Sign in with Apple (iOS) -----
# Audience defaults to our bundle id; user can override via env when shipping
APPLE_JWKS_URL = os.environ.get("APPLE_JWKS_URL", "https://appleid.apple.com/auth/keys")
APPLE_ISSUER = os.environ.get("APPLE_ISSUER", "https://appleid.apple.com")
APPLE_AUDIENCE = os.environ.get("APPLE_AUDIENCE", "com.loveassist.app")

_apple_jwks_cache: dict = {"keys": None, "fetched_at": None}


async def _get_apple_jwks() -> dict:
    """Fetch + cache Apple's JWKS for 1h."""
    now = datetime.now(timezone.utc)
    cached = _apple_jwks_cache.get("keys")
    fetched_at = _apple_jwks_cache.get("fetched_at")
    if cached and fetched_at and (now - fetched_at).total_seconds() < 3600:
        return cached
    async with httpx.AsyncClient(timeout=10.0) as http:
        r = await http.get(APPLE_JWKS_URL)
        r.raise_for_status()
        data = r.json()
    _apple_jwks_cache["keys"] = data
    _apple_jwks_cache["fetched_at"] = now
    return data


def _jwk_to_public_key(jwk_dict: dict):
    """Convert Apple JWK (RSA) to a cryptography public key object."""
    import jwt as _jwt
    return _jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk_dict))


async def _verify_apple_identity_token(identity_token: str, expected_nonce: Optional[str]) -> dict:
    import jwt as _jwt
    try:
        unverified_header = _jwt.get_unverified_header(identity_token)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Malformed Apple token: {e}")
    kid = unverified_header.get("kid")
    alg = unverified_header.get("alg", "RS256")
    if not kid:
        raise HTTPException(status_code=401, detail="Apple token missing kid header")

    jwks = await _get_apple_jwks()
    matching = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not matching:
        # try a refresh once
        _apple_jwks_cache["keys"] = None
        jwks = await _get_apple_jwks()
        matching = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
    if not matching:
        raise HTTPException(status_code=401, detail="Apple signing key not found")

    public_key = _jwk_to_public_key(matching)
    try:
        decoded = _jwt.decode(
            identity_token,
            key=public_key,
            algorithms=[alg],
            audience=APPLE_AUDIENCE,
            issuer=APPLE_ISSUER,
            options={"require": ["iss", "sub", "aud", "exp", "iat"]},
        )
    except _jwt.InvalidAudienceError:
        raise HTTPException(status_code=401, detail=f"Apple token audience mismatch (expected {APPLE_AUDIENCE})")
    except _jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Apple token expired")
    except _jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Apple token invalid: {e}")

    if expected_nonce:
        token_nonce = decoded.get("nonce")
        # client may pass either raw nonce or SHA256 hex of nonce (Apple hashes it)
        # we accept either match
        if token_nonce and token_nonce != expected_nonce:
            import hashlib
            hashed = hashlib.sha256(expected_nonce.encode()).hexdigest()
            if token_nonce != hashed:
                raise HTTPException(status_code=401, detail="Apple token nonce mismatch")
    return decoded


@api_router.post("/auth/apple")
async def auth_apple(req: AppleAuthRequest):
    """Verify an Apple identity token (JWT) and issue a LoveAssist session.

    Returns: { session_token, user } — same shape as /auth/google/session.
    """
    claims = await _verify_apple_identity_token(req.identity_token, req.nonce)
    apple_sub = claims.get("sub")
    email_from_token = claims.get("email")
    email = req.email or email_from_token
    name = ""
    if req.full_name:
        name = " ".join(p for p in [req.full_name.givenName, req.full_name.familyName] if p).strip()

    # Lookup by apple_sub first; fall back to email
    now = datetime.now(timezone.utc)
    existing = await db.users.find_one({"apple_sub": apple_sub}, {"_id": 0})
    if not existing and email:
        existing = await db.users.find_one({"email": email}, {"_id": 0})

    if existing:
        update_fields: dict = {"apple_sub": apple_sub}
        if name and not existing.get("name"):
            update_fields["name"] = name
        if email and not existing.get("email"):
            update_fields["email"] = email
        await db.users.update_one({"user_id": existing["user_id"]}, {"$set": update_fields})
        user = existing
    else:
        # First-time signup
        if not email:
            email = f"apple_{apple_sub[-12:]}@privaterelay.appleid.com"
        if not name:
            name = "Apple User"
        user = await get_or_create_user(email, name, None)
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"apple_sub": apple_sub}})

    session_token = f"apl_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one(
        {
            "session_token": session_token,
            "user_id": user["user_id"],
            "expires_at": now + timedelta(days=30),
            "created_at": now,
        }
    )
    user_fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    await record_login_event(user["user_id"], user_fresh.get("email") or "", "apple")
    return {"session_token": session_token, "user": user_fresh}


@api_router.get("/auth/me")
async def auth_me(authorization: Optional[str] = Header(None)):
    user = await get_user_from_token(authorization)
    sub = await get_subscription(user["user_id"])
    user["is_admin"] = (user.get("email") or "").lower() in ADMIN_EMAILS
    return {"user": user, "subscription": sub}


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        await db.user_sessions.delete_one({"session_token": token})
    return {"ok": True}


@api_router.delete("/auth/delete-account")
async def delete_account(authorization: Optional[str] = Header(None)):
    """Permanently delete user account and all associated data.
    Required by Apple App Store guidelines for apps with Sign in with Apple.
    """
    user = await get_user_from_token(authorization)
    user_id = user["user_id"]
    # Delete all user data
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.history.delete_many({"user_id": user_id})
    await db.subscriptions.delete_many({"user_id": user_id})
    await db.users.delete_one({"user_id": user_id})
    return {"ok": True}


# ===================== Admin =====================
async def get_admin_user(authorization: Optional[str] = Header(None)):
    user = await get_user_from_token(authorization)
    email = (user.get("email") or "").lower()
    if email not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@api_router.get("/admin/stats")
async def admin_stats(authorization: Optional[str] = Header(None)):
    """Return aggregate signup / login / subscription metrics. Admin only."""
    await get_admin_user(authorization)

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    day_yesterday = today_start - timedelta(days=1)

    total_users = await db.users.count_documents({})
    signups_today = await db.users.count_documents({"created_at": {"$gte": today_start}})
    signups_yesterday = await db.users.count_documents(
        {"created_at": {"$gte": day_yesterday, "$lt": today_start}}
    )
    signups_week = await db.users.count_documents({"created_at": {"$gte": week_start}})
    signups_month = await db.users.count_documents({"created_at": {"$gte": month_start}})

    active_sessions = await db.user_sessions.count_documents(
        {"expires_at": {"$gte": now}}
    )

    premium_users = await db.users.count_documents(
        {"subscription_status": {"$in": ["premium", "active"]}}
    )
    trial_users = await db.users.count_documents({"subscription_status": "trial"})

    # Login method breakdown
    google_users = await db.users.count_documents({"google_id": {"$exists": True, "$ne": None}})
    apple_users = await db.users.count_documents({"apple_sub": {"$exists": True, "$ne": None}})

    # Recent signups (last 10)
    recent_cursor = (
        db.users.find(
            {},
            {"_id": 0, "email": 1, "name": 1, "created_at": 1, "subscription_status": 1, "picture": 1},
        )
        .sort("created_at", -1)
        .limit(10)
    )
    recent = []
    async for u in recent_cursor:
        ca = u.get("created_at")
        if isinstance(ca, datetime):
            u["created_at"] = ca.isoformat()
        recent.append(u)

    # Daily signups for the last 7 days (sparkline)
    daily = []
    for i in range(6, -1, -1):
        day = today_start - timedelta(days=i)
        next_day = day + timedelta(days=1)
        c = await db.users.count_documents({"created_at": {"$gte": day, "$lt": next_day}})
        daily.append({"date": day.strftime("%Y-%m-%d"), "count": c})

    # Login events (actual sign-in counts — separate from signups)
    logins_today = await db.login_events.count_documents({"created_at": {"$gte": today_start}})
    logins_week = await db.login_events.count_documents({"created_at": {"$gte": week_start}})
    logins_total = await db.login_events.count_documents({})

    # Daily logins for the last 7 days (sparkline)
    daily_logins = []
    for i in range(6, -1, -1):
        day = today_start - timedelta(days=i)
        next_day = day + timedelta(days=1)
        c = await db.login_events.count_documents(
            {"created_at": {"$gte": day, "$lt": next_day}}
        )
        daily_logins.append({"date": day.strftime("%Y-%m-%d"), "count": c})

    return {
        "total_users": total_users,
        "signups_today": signups_today,
        "signups_yesterday": signups_yesterday,
        "signups_week": signups_week,
        "signups_month": signups_month,
        "active_sessions": active_sessions,
        "premium_users": premium_users,
        "trial_users": trial_users,
        "logins_today": logins_today,
        "logins_week": logins_week,
        "logins_total": logins_total,
        "login_methods": {
            "google": google_users,
            "apple": apple_users,
        },
        "recent_signups": recent,
        "daily_signups": daily,
        "daily_logins": daily_logins,
        "generated_at": now.isoformat(),
    }


# ===================== Subscription =====================
@api_router.get("/subscription/status")
async def sub_status(authorization: Optional[str] = Header(None)):
    user = await get_user_from_token(authorization)
    return {"subscription": await get_subscription(user["user_id"])}


@api_router.post("/subscription/start-trial")
async def start_trial(authorization: Optional[str] = Header(None)):
    user = await get_user_from_token(authorization)
    now = datetime.now(timezone.utc)
    trial_end = now + timedelta(days=7)
    await db.subscriptions.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {
                "user_id": user["user_id"],
                "status": "trialing",
                "mode": "simulated",
                "trial_end": trial_end,
                "premium_until": trial_end,
                "updated_at": now,
            }
        },
        upsert=True,
    )
    return {"subscription": await get_subscription(user["user_id"])}


@api_router.post("/subscription/upgrade")
async def upgrade(authorization: Optional[str] = Header(None)):
    user = await get_user_from_token(authorization)
    now = datetime.now(timezone.utc)
    premium_until = now + timedelta(days=30)
    await db.subscriptions.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {
                "user_id": user["user_id"],
                "status": "active",
                "mode": "simulated",
                "premium_until": premium_until,
                "updated_at": now,
            }
        },
        upsert=True,
    )
    return {
        "subscription": await get_subscription(user["user_id"]),
        "message": "Premium activated (simulated). Connect live Stripe in production.",
    }


# ===================== LLM =====================
LANG_NAMES = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "hi": "Hindi",
    "pt": "Portuguese",
    "zh-CN": "Chinese (Simplified, Mandarin)",
    "zh-TW": "Chinese (Traditional, Taiwan / Mandarin)",
    "ko": "Korean",
    "ja": "Japanese",
    "tl": "Filipino (Tagalog)",
    "de": "German",
    "it": "Italian",
    "id": "Indonesian",
    "th": "Thai",
    "vi": "Vietnamese",
    "ar": "Arabic",
    "tr": "Turkish",
    "ru": "Russian",
    "nl": "Dutch",
    "pl": "Polish",
}

MODE_INSTRUCTIONS = {
    "normal": "Friendly, warm, and natural. Keep it casual and authentic. Light, human tone.",
    "flirty": "Playful, charming, lightly romantic. Confident, witty, and warm — never crude or pushy.",
    "exclusive": "Premium voice — bold, poetic, emotionally intelligent. Layered, evocative phrasing that feels confident yet soulful.",
}


SAFETY_BLOCK_TOKEN = "__SAFETY_BLOCK__"

def build_system_message(mode: str, language: str, kind: str) -> str:
    mode_desc = MODE_INSTRUCTIONS.get(mode, MODE_INSTRUCTIONS["normal"])
    lang = LANG_NAMES.get(language, "English")
    safety = (
        "STRICT SAFETY POLICY (non-negotiable):\n"
        "1. ABSOLUTELY NO NUDITY OR SEXUALLY EXPLICIT CONTENT. Never produce, describe, "
        "imply, allude to, or roleplay nudity, sexual acts, genitalia, or pornographic material — "
        "regardless of mode (including Flirty and Exclusive). Flirty/Exclusive stay tasteful, "
        "suggestive at most, never explicit.\n"
        "2. If the user's situation, message, or attached screenshot contains nudity, sexual content, "
        "minors in sexual contexts, NSFW imagery, sexting, or solicitation — REFUSE. Do not generate "
        "any suggestion. Instead, return EXACTLY this single-element JSON array and nothing else: "
        f'["{SAFETY_BLOCK_TOKEN}"]\n'
        "3. Never produce harassing, manipulative, coercive, deceptive, hateful, threatening, or "
        "stalking content. Respect consent. If someone is being rejected, suggest kind, graceful replies.\n"
        "4. Never produce content involving minors in any romantic/sexual context. If the screenshot "
        f'or context appears to involve a minor, REFUSE with ["{SAFETY_BLOCK_TOKEN}"].\n'
    )
    return (
        f"You are LoveAssist AI, a thoughtful conversation wingman that helps the user craft "
        f"{kind} messages. Tone: {mode_desc} Language: write ALL suggestions in {lang}. "
        f"{safety} Return ONLY a JSON array of strings (no extra commentary, no preface). "
        f"Each suggestion is one short message (1–3 sentences). No numbering, no quotes inside strings."
    )


def check_safety_block(suggestions: List[str]) -> bool:
    """Returns True if the model refused due to safety policy."""
    if not suggestions:
        return False
    for s in suggestions:
        if SAFETY_BLOCK_TOKEN in (s or ""):
            return True
    return False


def parse_json_list(text: str) -> List[str]:
    text = (text or "").strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed if str(x).strip()]
    except Exception:
        pass
    m = re.search(r"\[.*\]", text, re.DOTALL)
    if m:
        try:
            parsed = json.loads(m.group(0))
            if isinstance(parsed, list):
                return [str(x).strip() for x in parsed if str(x).strip()]
        except Exception:
            pass
    lines = [
        re.sub(r"^[\d\-\*\.\)\s]+", "", ln).strip().strip('"').strip("'")
        for ln in text.splitlines()
        if ln.strip()
    ]
    return [ln for ln in lines if ln][:6]


async def call_claude(
    system_msg: str, user_text: str, image_b64: Optional[str] = None
) -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"loveassist_{uuid.uuid4().hex[:8]}",
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    if image_b64:
        msg = UserMessage(
            text=user_text, file_contents=[ImageContent(image_base64=image_b64)]
        )
    else:
        msg = UserMessage(text=user_text)
    resp = await chat.send_message(msg)
    return resp if isinstance(resp, str) else str(resp)


async def require_mode_access(user: dict, mode: str):
    if mode == "exclusive":
        sub = await get_subscription(user["user_id"])
        if sub.get("status") not in ("trialing", "active"):
            raise HTTPException(
                status_code=402, detail="Exclusive mode requires an active trial or premium"
            )


@api_router.post("/ai/suggestions")
async def ai_suggestions(
    req: SuggestionRequest, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    await require_mode_access(user, req.mode)
    sys_msg = build_system_message(req.mode, req.language, "reply")
    user_text = (
        f"Relationship type: {req.relationship}\n"
        f"Situation / what they said or context:\n{req.context}\n\n"
        f"Generate {req.count} distinct reply messages I could send next. Vary tone and angle. "
        f"Return ONLY a JSON array of strings."
    )
    try:
        text = await call_claude(sys_msg, user_text)
        suggestions = parse_json_list(text)[: req.count]
        if check_safety_block(suggestions):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "SAFETY_BLOCKED",
                    "message": "This request appears to involve nudity or explicit content, which LoveAssist won't help with. Try rephrasing — we keep things respectful and tasteful.",
                },
            )
        return {"suggestions": suggestions}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("AI suggestion error")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")


@api_router.post("/ai/first-message")
async def ai_first_message(
    req: FirstMessageRequest, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    await require_mode_access(user, req.mode)
    sys_msg = build_system_message(req.mode, req.language, "opening / first")
    user_text = (
        f"About the person I want to message: {req.about_person}\n"
        f"Extra context: {req.context or 'none'}\n\n"
        f"Generate {req.count} distinct first messages to break the ice. They must feel personalized, "
        f"warm, and never generic. Return ONLY a JSON array of strings."
    )
    try:
        text = await call_claude(sys_msg, user_text)
        suggestions = parse_json_list(text)[: req.count]
        if check_safety_block(suggestions):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "SAFETY_BLOCKED",
                    "message": "This request appears to involve nudity or explicit content, which LoveAssist won't help with. Try rephrasing — we keep things respectful and tasteful.",
                },
            )
        return {"suggestions": suggestions}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("AI first-message error")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")


@api_router.post("/ai/screenshot")
async def ai_screenshot(
    req: ScreenshotRequest, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    await require_mode_access(user, req.mode)
    sys_msg = build_system_message(req.mode, req.language, "reply")
    user_text = (
        "This is a screenshot of an ongoing chat. Identify which messages are mine "
        "(usually right-aligned) and which are from the other person (left-aligned). "
        "Then generate replies *I* could send next.\n"
        f"Extra context from me: {req.extra_context or 'none'}\n"
        f"Generate {req.count} varied replies. Return ONLY a JSON array of strings."
    )
    b64 = req.image_base64 or ""
    if "," in b64 and b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    if not b64:
        raise HTTPException(status_code=400, detail="image_base64 required")
    try:
        text = await call_claude(sys_msg, user_text, image_b64=b64)
        suggestions = parse_json_list(text)[: req.count]
        if check_safety_block(suggestions):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "SAFETY_BLOCKED",
                    "message": "This screenshot appears to contain nudity or explicit content, which LoveAssist won't analyze. Please upload a regular chat screenshot.",
                },
            )
        return {"suggestions": suggestions}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("AI screenshot error")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")


@api_router.post("/ai/first-message-from-bio")
async def ai_first_message_from_bio(
    req: BioOpenerRequest, authorization: Optional[str] = Header(None)
):
    """Generate personalized opening messages from a dating app bio screenshot.

    Accepts a screenshot of a profile (Tinder, Hinge, Bumble, Instagram bio, etc.),
    extracts visible interests/prompts/photos, and returns highly tailored openers.
    """
    user = await get_user_from_token(authorization)
    await require_mode_access(user, req.mode)
    sys_msg = build_system_message(req.mode, req.language, "opening / first")
    user_text = (
        "This is a screenshot of a dating-app profile or bio (Tinder / Hinge / Bumble / "
        "Instagram / etc.). Carefully read EVERY visible detail: name, age, prompts, "
        "interests, hobbies, job, school, location, anchors, and what's shown in their photos "
        "(activities, places, pets, outfits, vibe). Identify the 2–3 most personality-revealing "
        "or unique details — NOT generic ones.\n\n"
        f"Extra context from me: {req.extra_context or 'none'}\n\n"
        f"Now generate {req.count} distinct opening messages I could send them as a first DM. "
        "Each opener MUST reference something specific you actually saw on the profile (a prompt, a "
        "photo detail, an interest) — never generic. Keep them short (1–2 sentences), warm, "
        "curious, and easy to reply to. Use light playful energy where appropriate. "
        "Avoid: 'hey beautiful', compliments on looks, pickup lines, anything creepy. "
        "Return ONLY a JSON array of strings."
    )
    b64 = req.image_base64 or ""
    if "," in b64 and b64.startswith("data:"):
        b64 = b64.split(",", 1)[1]
    if not b64:
        raise HTTPException(status_code=400, detail="image_base64 required")
    try:
        text = await call_claude(sys_msg, user_text, image_b64=b64)
        suggestions = parse_json_list(text)[: req.count]
        if check_safety_block(suggestions):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "SAFETY_BLOCKED",
                    "message": "This profile screenshot appears to contain nudity or explicit content, which LoveAssist won't analyze. Please upload a regular bio screenshot.",
                },
            )
        return {"suggestions": suggestions}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("AI bio-opener error")
        raise HTTPException(status_code=500, detail=f"AI error: {e}")


# ===================== Translate =====================
def build_translate_system(target_lang_name: str, preserve_tone: bool) -> str:
    return (
        f"You are a precise translator. Translate the user's text(s) into {target_lang_name}. "
        f"{'Preserve the original tone, intent, emoji, and punctuation. ' if preserve_tone else ''}"
        "Do NOT add commentary. Do NOT transliterate names. "
        f"If the source contains nudity/explicit/sexual content, refuse and return: [\"{SAFETY_BLOCK_TOKEN}\"]. "
        "Return ONLY a JSON array of strings — one translated string per input, in order. "
        "No numbering, no quotes within strings."
    )


@api_router.post("/ai/translate")
async def ai_translate(
    req: TranslateRequest, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    # Premium-gated feature
    sub = await get_subscription(user["user_id"])
    if sub.get("status") not in ("trialing", "active"):
        raise HTTPException(
            status_code=402,
            detail={
                "code": "PREMIUM_REQUIRED",
                "message": "Live translate is a premium feature. Start your 7-day free trial or upgrade to unlock.",
            },
        )
    if not req.texts:
        raise HTTPException(status_code=400, detail="texts required")
    target = LANG_NAMES.get(req.target_language, req.target_language)
    sys_msg = build_translate_system(target, req.preserve_tone)
    user_text = (
        f"Source language: {LANG_NAMES.get(req.source_language or '', 'auto-detect')}\n"
        f"Target language: {target}\n\n"
        f"Translate these {len(req.texts)} item(s):\n"
        + json.dumps(req.texts, ensure_ascii=False)
    )
    try:
        text = await call_claude(sys_msg, user_text)
        out = parse_json_list(text)
        if check_safety_block(out):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "SAFETY_BLOCKED",
                    "message": "This text appears to contain nudity or explicit content. Translation refused.",
                },
            )
        # Pad/trim to same length as input
        if len(out) < len(req.texts):
            out = out + [""] * (len(req.texts) - len(out))
        out = out[: len(req.texts)]
        return {"translations": out, "target_language": req.target_language}
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("AI translate error")
        raise HTTPException(status_code=500, detail=f"Translate error: {e}")


# ===================== Payments =====================
PREMIUM_USD_PRICE = float(os.environ.get("PREMIUM_USD_PRICE", "7.60"))
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID", "")
PAYPAL_CLIENT_SECRET = os.environ.get("PAYPAL_CLIENT_SECRET", "")
PAYPAL_MODE = os.environ.get("PAYPAL_MODE", "sandbox").lower()
PAYPAL_BASE = (
    "https://api-m.sandbox.paypal.com"
    if PAYPAL_MODE != "live"
    else "https://api-m.paypal.com"
)


def _is_placeholder(v: str) -> bool:
    if not v:
        return True
    return "placeholder" in v.lower()


async def activate_premium_for(user_id: str, gateway: str, ref: str, days: int = 30):
    now = datetime.now(timezone.utc)
    premium_until = now + timedelta(days=days)
    await db.subscriptions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "user_id": user_id,
                "status": "active",
                "mode": gateway,
                "premium_until": premium_until,
                "updated_at": now,
                "last_payment_ref": ref,
            }
        },
        upsert=True,
    )
    await db.payments.insert_one(
        {
            "user_id": user_id,
            "gateway": gateway,
            "ref": ref,
            "amount_usd": PREMIUM_USD_PRICE,
            "created_at": now,
        }
    )


# --- Razorpay ---
@api_router.post("/payments/razorpay/create-link")
async def razorpay_create_link(
    req: CreatePaymentRequest, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    if _is_placeholder(RAZORPAY_KEY_ID) or _is_placeholder(RAZORPAY_KEY_SECRET):
        raise HTTPException(status_code=503, detail="Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in production env.")
    # Razorpay charges in paise; we keep USD by default. Multiply by 100.
    amount_paise = int(round(PREMIUM_USD_PRICE * 100))
    body = {
        "amount": amount_paise,
        "currency": "USD",
        "accept_partial": False,
        "description": "LoveAssist AI Premium — Monthly",
        "customer": {
            "name": user.get("name", "LoveAssist User"),
            "email": user.get("email", ""),
        },
        "notify": {"sms": False, "email": True},
        "reminder_enable": False,
        "notes": {"user_id": user["user_id"], "plan": req.plan},
        "callback_url": req.return_url or "https://example.com/payment-success",
        "callback_method": "get",
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as http:
            r = await http.post(
                "https://api.razorpay.com/v1/payment_links",
                json=body,
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Razorpay error: {r.text}")
        data = r.json()
        await db.payments.insert_one(
            {
                "user_id": user["user_id"],
                "gateway": "razorpay",
                "ref": data.get("id"),
                "status": data.get("status", "created"),
                "amount_usd": PREMIUM_USD_PRICE,
                "created_at": datetime.now(timezone.utc),
            }
        )
        return {
            "simulated": False,
            "payment_link_id": data.get("id"),
            "short_url": data.get("short_url"),
            "amount_usd": PREMIUM_USD_PRICE,
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Razorpay create-link error")
        raise HTTPException(status_code=500, detail=f"Razorpay error: {e}")


@api_router.post("/payments/razorpay/verify/{payment_link_id}")
async def razorpay_verify(
    payment_link_id: str, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    if payment_link_id.startswith("sim_rzp_"):
        await activate_premium_for(user["user_id"], "razorpay_simulated", payment_link_id)
        return {
            "ok": True,
            "simulated": True,
            "subscription": await get_subscription(user["user_id"]),
        }
    if _is_placeholder(RAZORPAY_KEY_ID) or _is_placeholder(RAZORPAY_KEY_SECRET):
        raise HTTPException(status_code=503, detail="Razorpay not configured")
    try:
        async with httpx.AsyncClient(timeout=15.0) as http:
            r = await http.get(
                f"https://api.razorpay.com/v1/payment_links/{payment_link_id}",
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Razorpay error: {r.text}")
        data = r.json()
        status = data.get("status")
        if status == "paid":
            await activate_premium_for(user["user_id"], "razorpay", payment_link_id)
        return {
            "ok": status == "paid",
            "status": status,
            "subscription": await get_subscription(user["user_id"]),
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("Razorpay verify error")
        raise HTTPException(status_code=500, detail=f"Razorpay verify error: {e}")


# --- PayPal ---
async def _paypal_token() -> str:
    async with httpx.AsyncClient(timeout=15.0) as http:
        r = await http.post(
            f"{PAYPAL_BASE}/v1/oauth2/token",
            data={"grant_type": "client_credentials"},
            auth=(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET),
            headers={"Accept": "application/json"},
        )
    if r.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"PayPal auth error: {r.text}")
    return r.json()["access_token"]


@api_router.post("/payments/paypal/create-order")
async def paypal_create_order(
    req: CreatePaymentRequest, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    if _is_placeholder(PAYPAL_CLIENT_ID) or _is_placeholder(PAYPAL_CLIENT_SECRET):
        ref = f"sim_pp_{uuid.uuid4().hex[:10]}"
        await db.payments.insert_one(
            {
                "user_id": user["user_id"],
                "gateway": "paypal",
                "ref": ref,
                "status": "simulated_pending",
                "amount_usd": PREMIUM_USD_PRICE,
                "created_at": datetime.now(timezone.utc),
            }
        )
        return {
            "simulated": True,
            "order_id": ref,
            "approve_url": f"about:blank#simulated-paypal-{ref}",
            "amount_usd": PREMIUM_USD_PRICE,
            "message": "PayPal credentials are placeholders. Live order will be created once you set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in production env.",
        }
    token = await _paypal_token()
    body = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": user["user_id"],
                "description": "LoveAssist AI Premium — Monthly",
                "amount": {"currency_code": "USD", "value": f"{PREMIUM_USD_PRICE:.2f}"},
            }
        ],
        "application_context": {
            "brand_name": "LoveAssist AI",
            "user_action": "PAY_NOW",
            "return_url": req.return_url or "https://example.com/payment-success",
            "cancel_url": req.cancel_url or "https://example.com/payment-cancelled",
        },
    }
    try:
        async with httpx.AsyncClient(timeout=20.0) as http:
            r = await http.post(
                f"{PAYPAL_BASE}/v2/checkout/orders",
                json=body,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"PayPal error: {r.text}")
        data = r.json()
        approve_url = next(
            (lk["href"] for lk in data.get("links", []) if lk.get("rel") == "approve"),
            None,
        )
        await db.payments.insert_one(
            {
                "user_id": user["user_id"],
                "gateway": "paypal",
                "ref": data["id"],
                "status": data.get("status", "CREATED"),
                "amount_usd": PREMIUM_USD_PRICE,
                "created_at": datetime.now(timezone.utc),
            }
        )
        return {
            "simulated": False,
            "order_id": data["id"],
            "approve_url": approve_url,
            "amount_usd": PREMIUM_USD_PRICE,
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("PayPal create-order error")
        raise HTTPException(status_code=500, detail=f"PayPal error: {e}")


@api_router.post("/payments/paypal/capture")
async def paypal_capture(
    req: CapturePayPalRequest, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    order_id = req.order_id
    if order_id.startswith("sim_pp_"):
        await activate_premium_for(user["user_id"], "paypal_simulated", order_id)
        return {
            "ok": True,
            "simulated": True,
            "subscription": await get_subscription(user["user_id"]),
        }
    if _is_placeholder(PAYPAL_CLIENT_ID) or _is_placeholder(PAYPAL_CLIENT_SECRET):
        raise HTTPException(status_code=503, detail="PayPal not configured")
    token = await _paypal_token()
    try:
        async with httpx.AsyncClient(timeout=20.0) as http:
            r = await http.post(
                f"{PAYPAL_BASE}/v2/checkout/orders/{order_id}/capture",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"PayPal capture error: {r.text}")
        data = r.json()
        if data.get("status") == "COMPLETED":
            await activate_premium_for(user["user_id"], "paypal", order_id)
        return {
            "ok": data.get("status") == "COMPLETED",
            "status": data.get("status"),
            "subscription": await get_subscription(user["user_id"]),
        }
    except HTTPException:
        raise
    except Exception as e:
        logging.exception("PayPal capture error")
        raise HTTPException(status_code=500, detail=f"PayPal capture error: {e}")


@api_router.get("/payments/pricing")
async def pricing():
    return {
        "currency": "USD",
        "price": PREMIUM_USD_PRICE,
        "plan": "monthly_premium",
        "trial_days": 7,
        "gateways": {
            "razorpay": not _is_placeholder(RAZORPAY_KEY_ID),
            "paypal": not _is_placeholder(PAYPAL_CLIENT_ID),
            "any_simulated": _is_placeholder(RAZORPAY_KEY_ID)
            or _is_placeholder(PAYPAL_CLIENT_ID),
        },
    }


# ===================== History =====================
@api_router.post("/history")
async def save_history(
    req: SaveHistoryRequest, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    item = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "kind": req.kind,
        "prompt_summary": req.prompt_summary[:200],
        "suggestions": req.suggestions,
        "mode": req.mode,
        "language": req.language,
        "created_at": datetime.now(timezone.utc),
    }
    await db.history.insert_one(item)
    item.pop("_id", None)
    item["created_at"] = item["created_at"].isoformat()
    return {"item": item}


@api_router.get("/history")
async def list_history(authorization: Optional[str] = Header(None)):
    user = await get_user_from_token(authorization)
    cursor = (
        db.history.find({"user_id": user["user_id"]}, {"_id": 0})
        .sort("created_at", -1)
        .limit(100)
    )
    items = await cursor.to_list(length=100)
    for it in items:
        if isinstance(it.get("created_at"), datetime):
            it["created_at"] = _aware(it["created_at"]).isoformat()
    return {"items": items}


@api_router.delete("/history/{item_id}")
async def delete_history(item_id: str, authorization: Optional[str] = Header(None)):
    user = await get_user_from_token(authorization)
    res = await db.history.delete_one({"id": item_id, "user_id": user["user_id"]})
    return {"deleted": res.deleted_count}


# ===================== Settings =====================
@api_router.patch("/me/settings")
async def update_settings(
    req: UpdateSettingsRequest, authorization: Optional[str] = Header(None)
):
    user = await get_user_from_token(authorization)
    updates = {k: v for k, v in req.dict().items() if v is not None}
    if updates:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": updates})
    user_fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"user": user_fresh}


@api_router.get("/")
async def root():
    return {"app": "LoveAssist AI", "status": "ok"}


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        await db.users.create_index("email", unique=True)
        await db.users.create_index("user_id", unique=True)
        await db.user_sessions.create_index("session_token", unique=True)
        await db.user_sessions.create_index("user_id")
        await db.history.create_index([("user_id", 1), ("created_at", -1)])
        await db.login_events.create_index([("created_at", -1)])
        await db.login_events.create_index("user_id")
    except Exception as e:
        logging.warning(f"Index creation: {e}")


@app.on_event("shutdown")
async def shutdown():
    mongo_client.close()


logging.basicConfig(level=logging.INFO)
