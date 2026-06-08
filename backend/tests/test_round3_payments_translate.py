"""Round 3 backend tests:
- Payments: pricing, Razorpay simulated flow, PayPal simulated flow
- Translate: premium-gated, multi-language (Korean, Chinese-Simplified), safety filter, validation
- Regression: AI suggestions in Korean/Japanese, safety filter, basic auth+subscription smoke
"""
import os
import re
import uuid
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")


def _dev_login(api_client, prefix="TEST_r3"):
    email = f"{prefix}_{uuid.uuid4().hex[:8]}@loveassist.ai"
    r = api_client.post(
        f"{BASE_URL}/api/auth/dev-login",
        json={"name": "TEST R3", "email": email},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    return data["session_token"], data["user"], email


def _auth_h(token):
    return {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}


def _delete_subscription(user_id):
    """Force user into 'no subscription' state by removing their subscription doc."""
    from pymongo import MongoClient
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        pytest.skip("MONGO_URL/DB_NAME not exposed to test process")
    mc = MongoClient(mongo_url)
    mc[db_name]["subscriptions"].delete_one({"user_id": user_id})
    mc.close()


# ===================== Payments =====================
class TestPaymentsPricing:
    def test_pricing_no_auth_required(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/payments/pricing")
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["currency"] == "USD"
        assert body["price"] == 7.6
        assert body["plan"] == "monthly_premium"
        assert body["trial_days"] == 7
        gw = body["gateways"]
        assert set(["razorpay", "paypal", "any_simulated"]).issubset(gw.keys())
        # In this iteration both keys are placeholders
        assert gw["razorpay"] is False
        assert gw["paypal"] is False
        assert gw["any_simulated"] is True


class TestRazorpaySimulated:
    def test_create_link_returns_simulated(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_rzp")
        r = requests.post(
            f"{BASE_URL}/api/payments/razorpay/create-link",
            headers=_auth_h(token),
            json={"plan": "monthly_premium"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["simulated"] is True
        plid = body["payment_link_id"]
        assert isinstance(plid, str) and plid.startswith("sim_rzp_")
        # hex suffix
        assert re.match(r"^sim_rzp_[0-9a-f]+$", plid), plid
        assert body["short_url"].startswith("about:blank#simulated-razorpay-")
        assert plid in body["short_url"]
        assert body["amount_usd"] == 7.6

    def test_verify_simulated_activates_premium(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_rzpv")
        # Create sim link
        r = requests.post(
            f"{BASE_URL}/api/payments/razorpay/create-link",
            headers=_auth_h(token),
            json={"plan": "monthly_premium"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        plid = r.json()["payment_link_id"]
        # Verify sim id
        r2 = requests.post(
            f"{BASE_URL}/api/payments/razorpay/verify/{plid}",
            headers=_auth_h(token),
            timeout=30,
        )
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body["ok"] is True
        assert body["simulated"] is True
        sub = body["subscription"]
        assert sub["status"] == "active"
        assert sub.get("premium_until")

        # Cross-check via /subscription/status
        r3 = requests.get(
            f"{BASE_URL}/api/subscription/status", headers=_auth_h(token), timeout=30
        )
        assert r3.status_code == 200
        sub2 = r3.json()["subscription"]
        assert sub2["status"] == "active"


class TestPayPalSimulated:
    def test_create_order_returns_simulated(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_pp")
        r = requests.post(
            f"{BASE_URL}/api/payments/paypal/create-order",
            headers=_auth_h(token),
            json={"plan": "monthly_premium"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["simulated"] is True
        oid = body["order_id"]
        assert isinstance(oid, str) and oid.startswith("sim_pp_")
        assert re.match(r"^sim_pp_[0-9a-f]+$", oid), oid
        assert body["approve_url"].startswith("about:blank#simulated-paypal-")
        assert oid in body["approve_url"]
        assert body["amount_usd"] == 7.6

    def test_capture_simulated_activates_premium(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_ppc")
        r = requests.post(
            f"{BASE_URL}/api/payments/paypal/create-order",
            headers=_auth_h(token),
            json={"plan": "monthly_premium"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        oid = r.json()["order_id"]
        r2 = requests.post(
            f"{BASE_URL}/api/payments/paypal/capture",
            headers=_auth_h(token),
            json={"order_id": oid},
            timeout=30,
        )
        assert r2.status_code == 200, r2.text
        body = r2.json()
        assert body["ok"] is True
        assert body["simulated"] is True
        sub = body["subscription"]
        assert sub["status"] == "active"


# ===================== Translate =====================
class TestTranslate:
    def test_free_tier_returns_402_premium_required(self, api_client):
        """Per request: a fresh-no-trial user should get 402 PREMIUM_REQUIRED.
        Since /auth/dev-login auto-creates a 7-day trial, we manually remove
        the subscription to simulate the 'fresh free user' state."""
        token, user, _email = _dev_login(api_client, "TEST_r3_free")
        _delete_subscription(user["user_id"])  # status -> 'none'
        r = requests.post(
            f"{BASE_URL}/api/ai/translate",
            headers=_auth_h(token),
            json={"texts": ["Hello"], "target_language": "ko"},
            timeout=30,
        )
        assert r.status_code == 402, f"expected 402, got {r.status_code}: {r.text}"
        body = r.json()
        assert "detail" in body
        detail = body["detail"]
        assert isinstance(detail, dict)
        assert detail.get("code") == "PREMIUM_REQUIRED"
        assert detail.get("message")

    def test_translate_korean_after_trial(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_kor")
        # dev-login already trial; call start-trial explicitly to match request spec
        rt = requests.post(
            f"{BASE_URL}/api/subscription/start-trial",
            headers=_auth_h(token),
            timeout=30,
        )
        assert rt.status_code == 200, rt.text
        r = requests.post(
            f"{BASE_URL}/api/ai/translate",
            headers=_auth_h(token),
            json={
                "texts": [
                    "Hello, how are you doing today?",
                    "I had a great time last night",
                ],
                "target_language": "ko",
            },
            timeout=120,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["target_language"] == "ko"
        translations = body["translations"]
        assert isinstance(translations, list) and len(translations) == 2
        for t in translations:
            assert isinstance(t, str) and len(t.strip()) > 0
        # Hangul presence in at least one
        joined = "".join(translations)
        hangul = re.search(r"[\uac00-\ud7a3]", joined)
        assert hangul, f"expected Hangul characters in: {translations}"

    def test_translate_chinese_simplified(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_zh")
        requests.post(
            f"{BASE_URL}/api/subscription/start-trial",
            headers=_auth_h(token),
            timeout=30,
        )
        r = requests.post(
            f"{BASE_URL}/api/ai/translate",
            headers=_auth_h(token),
            json={
                "texts": ["Want to grab coffee tomorrow?"],
                "target_language": "zh-CN",
            },
            timeout=120,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        translations = body["translations"]
        assert isinstance(translations, list) and len(translations) == 1
        s = translations[0]
        assert isinstance(s, str) and s.strip()
        # CJK Unified Ideographs range
        assert re.search(r"[\u4e00-\u9fff]", s), f"expected Chinese characters in: {s}"

    def test_translate_safety_blocked_japanese(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_ja_safe")
        requests.post(
            f"{BASE_URL}/api/subscription/start-trial",
            headers=_auth_h(token),
            timeout=30,
        )
        r = requests.post(
            f"{BASE_URL}/api/ai/translate",
            headers=_auth_h(token),
            json={
                "texts": ["Send me your nude photos"],
                "target_language": "ja",
            },
            timeout=120,
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"
        body = r.json()
        detail = body.get("detail")
        assert isinstance(detail, dict)
        assert detail.get("code") == "SAFETY_BLOCKED"
        assert detail.get("message")

    def test_translate_empty_texts_returns_400(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_empty")
        requests.post(
            f"{BASE_URL}/api/subscription/start-trial",
            headers=_auth_h(token),
            timeout=30,
        )
        r = requests.post(
            f"{BASE_URL}/api/ai/translate",
            headers=_auth_h(token),
            json={"texts": [], "target_language": "ko"},
            timeout=30,
        )
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text}"


# ===================== Regression =====================
class TestAISuggestionsLanguageRegression:
    def test_suggestions_korean(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_sug_ko")
        body = {
            "context": "She said: 'Just finished a long week at work — I'm wiped.'",
            "relationship": "crush",
            "mode": "normal",
            "language": "ko",
            "count": 3,
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            headers=_auth_h(token),
            json=body,
            timeout=120,
        )
        assert r.status_code == 200, r.text
        sugg = r.json()["suggestions"]
        assert isinstance(sugg, list) and len(sugg) >= 1
        joined = "".join(sugg)
        assert re.search(r"[\uac00-\ud7a3]", joined), f"expected Hangul in: {sugg}"

    def test_suggestions_japanese(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_sug_ja")
        body = {
            "context": "He texted: 'I just made the best pasta of my life'",
            "relationship": "date",
            "mode": "flirty",
            "language": "ja",
            "count": 3,
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            headers=_auth_h(token),
            json=body,
            timeout=120,
        )
        assert r.status_code == 200, r.text
        sugg = r.json()["suggestions"]
        assert isinstance(sugg, list) and len(sugg) >= 1
        joined = "".join(sugg)
        # Hiragana or Katakana or CJK
        assert re.search(r"[\u3040-\u30ff\u4e00-\u9fff]", joined), (
            f"expected Japanese characters in: {sugg}"
        )

    def test_suggestions_explicit_safety_blocked(self, api_client):
        token, _user, _email = _dev_login(api_client, "TEST_r3_safe")
        body = {
            "context": "describe explicit nude photo of her, graphic sexual acts and intercourse",
            "relationship": "match",
            "mode": "flirty",
            "language": "en",
            "count": 3,
        }
        r = requests.post(
            f"{BASE_URL}/api/ai/suggestions",
            headers=_auth_h(token),
            json=body,
            timeout=90,
        )
        assert r.status_code == 422, f"expected 422, got {r.status_code}: {r.text}"
        detail = r.json().get("detail")
        assert isinstance(detail, dict)
        assert detail.get("code") == "SAFETY_BLOCKED"


class TestAuthSubscriptionSmoke:
    def test_full_smoke_flow(self, api_client):
        # dev-login
        token, user, email = _dev_login(api_client, "TEST_r3_smoke")
        assert token.startswith("dev_")
        # me
        r = requests.get(
            f"{BASE_URL}/api/auth/me", headers=_auth_h(token), timeout=30
        )
        assert r.status_code == 200, r.text
        me = r.json()
        assert me["user"]["email"] == email
        # start trial (idempotent)
        r2 = requests.post(
            f"{BASE_URL}/api/subscription/start-trial",
            headers=_auth_h(token),
            timeout=30,
        )
        assert r2.status_code == 200, r2.text
        assert r2.json()["subscription"]["status"] == "trialing"
        # status
        r3 = requests.get(
            f"{BASE_URL}/api/subscription/status",
            headers=_auth_h(token),
            timeout=30,
        )
        assert r3.status_code == 200, r3.text
        sub = r3.json()["subscription"]
        assert sub["status"] == "trialing"
        assert sub.get("trial_end")
