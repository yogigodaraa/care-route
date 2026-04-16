"""Google Places API - Find nearby healthcare facilities."""

import os
import requests

API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
PLACES_URL = "https://places.googleapis.com/v1/places:searchText"

CARE_TYPE_QUERIES = {
    "gp": "general practitioner doctor clinic",
    "ed": "emergency department hospital",
    "pharmacy": "pharmacy chemist",
    "clinic": "medical centre walk in clinic urgent care",
}


def _detect_bulk_billing(name: str, summary: str) -> bool | None:
    """Check if name or editorial summary mentions bulk billing. Returns True/False/None."""
    combined = f"{name} {summary}".lower()
    if "bulk bill" in combined:
        return True
    # If we have summary text but no mention, likely not bulk billing
    if summary.strip():
        return False
    return None


def find_nearby(care_type: str, location: str, radius: int = 10000, max_results: int = 10) -> list[dict]:
    """
    Find nearby healthcare facilities using Google Places Text Search.

    Args:
        care_type: One of 'gp', 'ed', 'pharmacy', 'clinic'
        location: Suburb, postcode, or address string (e.g. "Sydney CBD 2000")
        radius: Search radius in meters (default 10km)
        max_results: Max number of results to return

    Returns:
        List of place dicts with name, address, phone, opening hours, website, location
    """
    query_term = CARE_TYPE_QUERIES.get(care_type, care_type)
    text_query = f"{query_term} near {location}"

    body = {
        "textQuery": text_query,
        "locationBias": {"circle": {"radius": radius}},
        "maxResultCount": max_results,
    }

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": ",".join([
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.regularOpeningHours",
            "places.nationalPhoneNumber",
            "places.websiteUri",
            "places.googleMapsUri",
            "places.editorialSummary",
        ]),
    }

    resp = requests.post(PLACES_URL, json=body, headers=headers, timeout=10)
    resp.raise_for_status()
    data = resp.json()

    places = []
    for p in data.get("places", []):
        places.append({
            "name": p.get("displayName", {}).get("text", "Unknown"),
            "address": p.get("formattedAddress", ""),
            "phone": p.get("nationalPhoneNumber", ""),
            "website": p.get("websiteUri", ""),
            "google_maps_url": p.get("googleMapsUri", ""),
            "lat": p.get("location", {}).get("latitude"),
            "lng": p.get("location", {}).get("longitude"),
            "opening_hours": p.get("regularOpeningHours", {}).get("weekdayDescriptions", []),
            "open_now": p.get("regularOpeningHours", {}).get("openNow"),
            "bulk_billing": _detect_bulk_billing(
                p.get("displayName", {}).get("text", ""),
                p.get("editorialSummary", {}).get("text", ""),
            ),
            "services": [],
        })

    return places
