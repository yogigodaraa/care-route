# Little Help

**Stop guessing. Get the right care, right now.**

AI-powered care routing — helps people figure out *where* to go when they're unwell (GP, urgent care, pharmacy, or ED) before they default to the emergency department.

Built for the 2025 Visagio Hackathon under the *Agentic AI* track.

## The problem

Australian EDs are overwhelmed by patients who didn't need to be there — a persistent cough, a child's fever, a minor injury. When it's 10pm and you're stressed, the ER feels like the only option. Little Help intercepts those cases *before* they reach ED.

## How it works

1. **Describe symptoms** in plain language
2. **AI triage** — Claude assesses urgency and recommends the right setting
3. **Find nearby providers** — real-time search via Google Places, availability via HotDoc scraping
4. **Go get care** — directions, hours, booking links

## Tech stack

**Frontend**
- Next.js 16, React 19, TypeScript
- Tailwind CSS v4, shadcn/ui
- Claude API for conversational triage

**Backend** (`littlehelp/phase3`)
- FastAPI (Python)
- Provider scraping + availability ranking
- Google Places API

## Getting started

App lives in `littlehelp/`. See that directory for setup.

```bash
# Frontend
cd littlehelp
npm install
npm run dev            # http://localhost:3000

# Backend
cd phase3
pip install -r requirements.txt
uvicorn main:app --reload  # http://localhost:8000
```

## Repo layout

```
littlehelp/                Main application (Next.js + FastAPI)
problem-statement/         Hackathon brief + research
distribution-strategy.md   Go-to-market: multi-channel (GP sites, WhatsApp, SMS)
```

## Status

Hackathon prototype (Visagio 2025). Not clinically validated. No production-grade safety review. Not yet licensed for production use.
