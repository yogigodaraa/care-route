# Little Help

[![CI](https://github.com/yogigodaraa/care-route/actions/workflows/ci.yml/badge.svg)](https://github.com/yogigodaraa/care-route/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Status: maintenance](https://img.shields.io/badge/status-maintenance%20only-lightgrey)

> **Status: complete — maintenance only.** This project works and stays online, but no new features are planned. Security updates are still applied.

> [!WARNING]
> **Not medical advice.** Little Help is a hackathon prototype for *care navigation*. It doesn't diagnose,
> and it isn't clinically validated. **In an emergency, call 000.**

**Stop guessing. Get the right care, right now.**

AI-powered care routing — helps people figure out *where* to go when they're unwell (GP, urgent care, pharmacy, or ED) before they default to the emergency department.

Built for the 2025 Visagio Hackathon under the *Agentic AI* track.

## The problem

Australian EDs are overwhelmed by patients who didn't need to be there — a persistent cough, a child's fever, a minor injury. When it's 10pm and you're stressed, the ER feels like the only option. Little Help intercepts those cases *before* they reach ED.

## How it works

1. **Describe symptoms** in plain language
2. **Triage**: a rule-based engine (`littlehelp/phase3/triage.py`, modelled on the Australian Triage Scale) plus a guided question flow (`model2.py`) picks ED, urgent clinic, GP or pharmacy. Voice mode uses [Vapi](https://vapi.ai).
3. **Find nearby providers** — real-time search via Google Places, availability via HotDoc scraping
4. **Go get care** — directions, hours, booking links

## Tech stack

**Frontend**
- Next.js 16, React 19, TypeScript
- Tailwind CSS v4, shadcn/ui
- Vapi voice assistant (optional)

**Backend** (`littlehelp/phase3`)
- FastAPI (Python)
- Rule-based triage + guided questions
- Provider scraping (Playwright) + availability ranking
- Google Places API
- SMS via Mobile Message (optional)

## Getting started

App lives in `littlehelp/`. See that directory for setup.

```bash
# Frontend
cd littlehelp
cp .env.example .env   # keys are optional for the demo screens
npm ci
npm run dev            # http://localhost:3000

# Backend
cd phase3
pip install -r requirements.txt
uvicorn main:app --reload  # http://localhost:8000
```

### Tests and checks

```bash
cd littlehelp/phase3 && pytest && ruff check .   # triage + ranker tests, offline
cd littlehelp && npm run typecheck && npm run build
python run_full_pipeline.py                       # manual end-to-end run (needs API keys + network)
```

## Repo layout

```
littlehelp/                Main application (Next.js + FastAPI)
problem-statement/         Hackathon brief + research
distribution-strategy.md   Go-to-market: multi-channel (GP sites, WhatsApp, SMS)
```

## Status

Hackathon prototype (Visagio 2025). Not clinically validated. No production-grade safety review. Not yet licensed for production use.
