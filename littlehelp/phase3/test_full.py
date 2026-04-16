"""Full pipeline test: Places -> Scraper (Playwright) -> Ranker."""
import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from places import find_nearby
from scraper import get_availability
from ranker import rank_providers

CARE_TYPE = "gp"
LOCATION = "Sydney CBD 2000"

print(f"=== Phase 3 Test: Finding {CARE_TYPE} near {LOCATION} ===\n")

# Step 1: Google Places
print("Step 1: Finding places via Google Maps...")
places = find_nearby(CARE_TYPE, LOCATION)
print(f"  Found {len(places)} places")
for p in places[:3]:
    print(f"    - {p['name']} | {p['website']}")
print()

# Step 2: Scrape availability (Playwright)
print("Step 2: Scraping availability from HotDoc/HealthEngine (Playwright)...")
scraped = get_availability(CARE_TYPE, LOCATION)
print(f"  Found {len(scraped)} scraped results")
for s in scraped[:5]:
    print(f"    - [{s['source']}] {s['name']} | Next: {s.get('next_available', 'N/A')}")
print()

# Step 3: Rank
print("Step 3: Ranking providers...")
ranked = rank_providers(places, scraped, care_type=CARE_TYPE)

print(f"\n=== Top 5 Results ===\n")
for i, r in enumerate(ranked[:5], 1):
    print(f"{i}. {r['name']} (score: {r['score']})")
    print(f"   Address: {r['address']}")
    print(f"   Open now: {r['open_now']}")
    print(f"   Phone: {r['phone']}")
    print(f"   Website: {r['website']}")
    print(f"   Availability: {r['availability']}")
    print()
