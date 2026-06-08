# LoveAssist AI – PRD

## Overview
A mobile app (Expo) that acts as a personal conversation wingman: AI message suggestions, screenshot reply analysis, first-message generator, modes (Normal/Flirty/Exclusive Premium), 5 languages, 7-day free trial → Premium.

## Tech
- Expo SDK 54 + expo-router, React Native
- FastAPI + MongoDB
- Auth: Emergent-managed Google Auth (`expo-web-browser` + session token)
- LLM: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via emergentintegrations (text + vision)
- Subscription: simulated trial/premium in MongoDB (Stripe stub for later — real Stripe Payment Sheet requires native dev build)

## Features
1. Google Sign-In (Emergent) with onboarding screen
2. Home dashboard with quick actions
3. AI message suggestions (context + mode + language → suggestions)
4. Screenshot analysis (upload chat screenshot → reply suggestions)
5. First-message generator (who/context/mode → openers)
6. Modes: Normal, Flirty, Exclusive (premium-locked)
7. Multi-language: English, Spanish, French, Hindi, Portuguese
8. 7-day free trial flag with countdown banner
9. Premium upgrade screen (simulated activation in MVP)
10. History of suggestions, copy to clipboard
11. Settings: language, mode default, logout

## API
- `POST /api/auth/google/session` — exchange Emergent session_token → backend bearer token
- `GET /api/auth/me` — current user
- `POST /api/auth/logout`
- `POST /api/ai/suggestions` — generate reply suggestions from text context
- `POST /api/ai/first-message` — generate opener suggestions
- `POST /api/ai/screenshot` — generate replies from base64 chat screenshot
- `GET/POST/DELETE /api/history` — saved suggestions
- `GET /api/subscription/status`
- `POST /api/subscription/start-trial`
- `POST /api/subscription/upgrade`
