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


class SaveHistoryRequest(BaseModel):
    kind: str
    prompt_summary: str
    suggestions: List[str]
    mode: str
    language: str


class UpdateSettingsRequest(BaseModel):
    preferred_language: Optional[str] = None
    default_mode: Optional[str] = None


class DevLoginRequest(BaseModel):
    name: str = "Demo User"
    email: str = "demo@loveassist.ai"


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
    # Auto-start 7-day free trial on signup
    await db.subscriptions.update_one(
        {"user_id": user_id},
        {
            "$setOnInsert": {
                "user_id": user_id,
                "status": "trialing",
                "mode": "simulated",
                "trial_end": now + timedelta(days=7),
                "premium_until": now + timedelta(days=7),
                "created_at": now,
            }
        },
        upsert=True,
    )
    return user_doc


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
    return {"session_token": session_token, "user": user_fresh}


@api_router.post("/auth/dev-login")
async def dev_login(req: DevLoginRequest):
    user = await get_or_create_user(req.email, req.name, None)
    session_token = f"dev_{uuid.uuid4().hex}"
    now = datetime.now(timezone.utc)
    await db.user_sessions.insert_one(
        {
            "session_token": session_token,
            "user_id": user["user_id"],
            "expires_at": now + timedelta(days=7),
            "created_at": now,
        }
    )
    user_fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return {"session_token": session_token, "user": user_fresh}


@api_router.get("/auth/me")
async def auth_me(authorization: Optional[str] = Header(None)):
    user = await get_user_from_token(authorization)
    sub = await get_subscription(user["user_id"])
    return {"user": user, "subscription": sub}


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        await db.user_sessions.delete_one({"session_token": token})
    return {"ok": True}


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
    except Exception as e:
        logging.warning(f"Index creation: {e}")


@app.on_event("shutdown")
async def shutdown():
    mongo_client.close()


logging.basicConfig(level=logging.INFO)
