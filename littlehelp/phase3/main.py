"""Phase 3 API - Find nearby healthcare providers with real-time availability."""

import os
from dotenv import load_dotenv

# Load env from project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from places import find_nearby
from scraper import get_availability, scrape_ed_wait_times
from ranker import rank_providers
from triage import triage as triage_engine
from model2 import get_questions, evaluate as model2_evaluate

app = FastAPI(title="Phase 3 - Provider Finder", version="0.1.0")

# Allow the Next.js frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class FindProviderRequest(BaseModel):
    care_type: str  # "gp", "ed", "pharmacy", "clinic"
    location: str   # suburb, postcode, or address (e.g. "Sydney CBD 2000")
    state: str = "nsw"  # Australian state for ED wait times
    lat: float | None = None  # User's latitude (optional, for distance ranking)
    lng: float | None = None  # User's longitude (optional, for distance ranking)
    radius: int = 10000  # Search radius in meters
    bulk_billing_only: bool = False  # Filter to only bulk billing providers


class ProviderResult(BaseModel):
    name: str
    address: str
    phone: str
    website: str
    google_maps_url: str
    score: float
    availability: dict
    opening_hours: list[str]


_ED_FALLBACK_BY_STATE = {
    "nsw": {"nearest_ed": "Royal Prince Alfred Hospital", "estimated_wait_minutes": 195},
    "vic": {"nearest_ed": "The Royal Melbourne Hospital", "estimated_wait_minutes": 210},
    "qld": {"nearest_ed": "Royal Brisbane and Women's Hospital", "estimated_wait_minutes": 200},
    "wa": {"nearest_ed": "Sir Charles Gairdner Hospital", "estimated_wait_minutes": 180},
    "sa": {"nearest_ed": "Royal Adelaide Hospital", "estimated_wait_minutes": 190},
    "tas": {"nearest_ed": "Royal Hobart Hospital", "estimated_wait_minutes": 170},
    "nt": {"nearest_ed": "Royal Darwin Hospital", "estimated_wait_minutes": 150},
    "act": {"nearest_ed": "Canberra Hospital", "estimated_wait_minutes": 175},
}


def _get_ed_comparison(state: str = "nsw") -> dict:
    """Fetch nearest ED wait time, falling back to Australian average for Cat 4/5."""
    try:
        ed_results = scrape_ed_wait_times(state)
        if ed_results:
            # Pick the ED with the shortest wait
            with_wait = [r for r in ed_results if r.get("wait_minutes")]
            if with_wait:
                best = min(with_wait, key=lambda r: r["wait_minutes"])
                mins = best["wait_minutes"]
                hours = mins / 60
                if hours < 1:
                    wait_text = f"{mins} minutes"
                else:
                    low_h = int(hours)
                    high_h = low_h + 1
                    wait_text = f"{low_h}-{high_h} hours"
                return {
                    "nearest_ed": best["name"],
                    "estimated_wait": wait_text,
                    "estimated_wait_minutes": mins,
                    "source": "live",
                }
    except Exception as e:
        print(f"[ED comparison] Scraper failed, using fallback: {e}")

    fb = _ED_FALLBACK_BY_STATE.get(state.lower(), _ED_FALLBACK_BY_STATE["nsw"])
    mins = fb["estimated_wait_minutes"]
    low_h = mins // 60
    high_h = low_h + 1
    return {
        "nearest_ed": fb["nearest_ed"],
        "estimated_wait": f"{low_h}-{high_h} hours",
        "estimated_wait_minutes": mins,
        "source": "estimate",
    }


def _detect_state(location: str, lat: float | None = None, lng: float | None = None) -> str:
    """Detect Australian state from location string or coordinates."""
    import re
    loc = location.lower()

    # Check for state abbreviations or names in location string
    state_patterns = {
        "wa": [r"\bwa\b", r"\bwestern australia\b", r"\bperth\b", r"\bnedlands\b", r"\bfremantle\b", r"\bsubiaco\b"],
        "nsw": [r"\bnsw\b", r"\bnew south wales\b", r"\bsydney\b", r"\bparramatta\b"],
        "vic": [r"\bvic\b", r"\bvictoria\b", r"\bmelbourne\b"],
        "qld": [r"\bqld\b", r"\bqueensland\b", r"\bbrisbane\b"],
        "sa": [r"\bsa\b", r"\bsouth australia\b", r"\badelaide\b"],
        "tas": [r"\btas\b", r"\btasmania\b", r"\bhobart\b"],
        "nt": [r"\bnt\b", r"\bnorthern territory\b", r"\bdarwin\b"],
        "act": [r"\bact\b", r"\bcanberra\b"],
    }
    for state, patterns in state_patterns.items():
        if any(re.search(p, loc) for p in patterns):
            return state

    # Check postcode in location
    pc_match = re.search(r"\b(\d{4})\b", location)
    if pc_match:
        pc = int(pc_match.group(1))
        if 6000 <= pc <= 6999: return "wa"
        if 2000 <= pc <= 2599 or 2619 <= pc <= 2999: return "nsw"
        if 2600 <= pc <= 2618: return "act"
        if 3000 <= pc <= 3999: return "vic"
        if 4000 <= pc <= 4999: return "qld"
        if 5000 <= pc <= 5999: return "sa"
        if 7000 <= pc <= 7999: return "tas"
        if 800 <= pc <= 899: return "nt"

    # Check coordinates (rough bounding boxes)
    if lat and lng:
        if lng < 129: return "wa"
        if lng < 138:
            return "sa" if lat > -30 else "sa"
        if lng < 141:
            return "vic" if lat < -34 else "nsw"
        if lat < -28: return "nsw"
        return "qld"

    return "nsw"


@app.post("/find-provider")
def find_provider(req: FindProviderRequest):
    """
    Main endpoint: Find nearby healthcare providers with availability.

    Flow:
    1. Google Places API → find nearby facilities
    2. Web scraper → check availability on HotDoc/HealthEngine
    3. Ranker → combine and sort by availability + distance
    """
    # Auto-detect state if not explicitly set or defaulted
    state = _detect_state(req.location, req.lat, req.lng) if req.state == "nsw" else req.state

    # Step 1: Find nearby places
    places = find_nearby(
        care_type=req.care_type,
        location=req.location,
        radius=req.radius,
    )

    # Step 2: Scrape availability
    scraped = get_availability(
        care_type=req.care_type,
        location=req.location,
        state=state,
    )

    # Step 3: Rank and combine
    ranked = rank_providers(
        places=places,
        scraped_results=scraped,
        user_lat=req.lat,
        user_lng=req.lng,
        care_type=req.care_type,
    )

    # Step 3.5: Filter to bulk billing only if requested
    if req.bulk_billing_only:
        ranked = [p for p in ranked if p.get("bulk_billing") is True]

    # Step 4: For non-ED care types, fetch ED wait comparison
    ed_comparison = None
    if req.care_type != "ed":
        ed_comparison = _get_ed_comparison(state)

    response = {
        "care_type": req.care_type,
        "location": req.location,
        "results_count": len(ranked),
        "providers": ranked,
    }
    if ed_comparison:
        response["ed_comparison"] = ed_comparison

    return response


@app.get("/phase2-triage")
def phase2_triage(symptom: str = Query(default="headache")):
    """Rule-based medical triage — no external AI API needed."""
    return triage_engine(symptom)


# Backward-compatible endpoint
@app.get("/dummy-phase2")
def dummy_phase2(symptom: str = Query(default="headache")):
    """Legacy endpoint. Use /phase2-triage instead."""
    return triage_engine(symptom)


@app.get("/model2/questions/{symptom_id}")
def model2_questions(symptom_id: str):
    """Get symptom-specific triage questions."""
    return get_questions(symptom_id)


class Model2EvalRequest(BaseModel):
    symptom_id: str
    answers: dict[str, str]


@app.post("/model2/evaluate")
def model2_eval(req: Model2EvalRequest):
    """Evaluate triage answers and return care routing."""
    return model2_evaluate(req.symptom_id, req.answers)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
