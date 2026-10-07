# Copilot instructions for Little Help (care-route)

- **What it is:** care-navigation prototype (Visagio Hackathon 2025). Not a diagnostic tool. Every user-facing path must keep the "call 000" escape hatch.
- **Frontend:** `littlehelp/`, Next.js 16, React 19, TypeScript, Tailwind v4, shadcn/ui. `npm ci`, `npm run typecheck`, `npm run build`, `npm run lint`.
- **API:** `littlehelp/phase3/`, FastAPI, Python 3.12. `pip install -r requirements.txt`, `pytest`, `ruff check .`.
- **Triage logic** lives in `phase3/triage.py` (keywords + combination rules) and `phase3/model2.py`. **Any change must keep or add tests in `phase3/tests/test_triage.py`.** Changes may only escalate red-flag symptoms, never downgrade them, without a clinical reason.
- **Don't:** commit `.env`, real phone numbers or patient descriptions; remove the "not medical advice" notices; add network calls to tests (`run_full_pipeline.py` is the manual network script).
- **When reviewing PRs:** treat edits to emergency keyword lists or combo rules as high risk.
