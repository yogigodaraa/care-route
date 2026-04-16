# Little Help — Where to Go When

**Stop guessing. Get the right care, right now.**

Little Help is an AI-powered care routing tool that helps people figure out *where* to go when they're unwell — before they default to the emergency department. It triages symptoms through a friendly chat interface, finds nearby providers (GPs, urgent care, pharmacies), and gives a clear recommendation in seconds.

Built for the [Visagio Hackathon 2025](https://www.visagio.com/) under the "Agentic AI" track.

---

## The Problem

Emergency departments across Australia are overwhelmed with patients who didn't need to be there. A persistent cough, a child's fever, a minor injury — conditions better handled at a GP, urgent care clinic, or pharmacy. But when you're stressed and it's 10pm, the ER feels like the only option.

**Little Help gets to people *before* they get to ED.**

---

## How It Works

1. **Describe what's going on** — type your symptoms in plain language
2. **AI triage** — Claude assesses urgency and recommends the right care setting (GP, urgent care, pharmacy, or ED)
3. **Find nearby providers** — real-time search for open providers near you, ranked by relevance
4. **Go get care** — directions, hours, and booking links ready to go

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, shadcn/ui |
| **AI Triage** | Claude API (Anthropic) |
| **Provider Search** | Python + FastAPI, Google Places API, HotDoc scraping |
| **Voice Input** | Vapi AI |
| **Deployment** | Vercel (frontend) |

---

## Project Structure

```
littlehelp/
  app/                    # Next.js pages & API routes
    api/
      triage/             # Symptom triage endpoint
      find-provider/      # Provider search endpoint
      whatsapp/           # WhatsApp integration
      sms/                # SMS integration
      voicemail-redirect/ # Voicemail integration
      childcare-alert/    # Childcare alert integration
      places/             # Google Places proxy
  components/
    baby-health/          # Main app screens
  phase3/                 # Python backend
    main.py               # FastAPI server
    scraper.py            # HotDoc provider scraper
    ranker.py             # Provider ranking algorithm
    places.py             # Google Places integration
    triage.py             # Triage logic
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- API keys: Anthropic (Claude), Google Places, Vapi (optional)

### Frontend

```bash
cd littlehelp
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Backend (Provider Search)

```bash
cd littlehelp/phase3
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --reload --port 8000
```

### Environment Variables

Create a `.env.local` file in `littlehelp/`:

```env
ANTHROPIC_API_KEY=your-key-here
GOOGLE_PLACES_API_KEY=your-key-here
VAPI_API_KEY=your-key-here          # optional, for voice
TWILIO_ACCOUNT_SID=your-sid-here    # optional, for SMS/WhatsApp
TWILIO_AUTH_TOKEN=your-token-here    # optional, for SMS/WhatsApp
```

---

## Multi-Channel Distribution

Little Help isn't just an app — it's designed to meet people where they already are:

- **Google Search** — SEO landing pages for health-panic searches
- **GP & clinic websites** — embeddable widget
- **HotDoc / HealthEngine** — platform integrations
- **WhatsApp & SMS** — text-based triage
- **Voicemail redirect** — after-hours GP lines route to Little Help
- **Childcare centres** — alerts when a child is sick at daycare

---

## Team

Built by the Little Help team at the Visagio Hackathon 2025.

---

## License

This project was built for a hackathon. Not yet licensed for production use.
