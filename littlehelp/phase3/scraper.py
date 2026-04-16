"""Web scraper for healthcare provider availability using Playwright.

Uses a headless browser to scrape HotDoc for real-time appointment
availability for GPs, clinics, and pharmacies in Australia.

Key discovery: HotDoc's /find/ pages render full results with appointment
times as <a> links containing booking URLs with clinic ID, doctor ID, and time.
"""

import re
from urllib.parse import unquote
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup


# HotDoc /find/ URL — this is the page that actually renders results
HOTDOC_FIND_URL = "https://www.hotdoc.com.au/find/{care_type}/{state}/{suburb_slug}"

CARE_TYPE_HOTDOC_SLUG = {
    "gp": "doctor",
    "pharmacy": "pharmacy",
    "clinic": "doctor",
    "ed": None,
}


def _location_to_slug(location: str) -> dict:
    """Convert location like 'Sydney CBD 2000' to state and suburb slug.

    Returns dict with 'state' (e.g. 'NSW') and 'suburb_slug' (e.g. 'sydney-2000').
    HotDoc URL format: /find/doctor/NSW/sydney-2000
    """
    postcode_match = re.search(r"\b(\d{4})\b", location)
    postcode = postcode_match.group(1) if postcode_match else ""

    # Remove postcode and common extras from suburb name
    name = re.sub(r"\b\d{4}\b", "", location).strip().rstrip(",").strip()
    # Remove "CBD" as HotDoc doesn't use it in slugs
    name = re.sub(r"\bCBD\b", "", name, flags=re.IGNORECASE).strip()
    # Remove state abbreviations (NSW, VIC, QLD, WA, SA, TAS, NT, ACT) and full names
    name = re.sub(r"\b(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)\b", "", name, flags=re.IGNORECASE).strip()
    name = re.sub(r"\b(New South Wales|Victoria|Queensland|Western Australia|South Australia|Tasmania|Northern Territory|Australian Capital Territory|Australia)\b", "", name, flags=re.IGNORECASE).strip()
    # Clean up leftover commas and spaces
    name = re.sub(r"[,\s]+", " ", name).strip()

    state = "NSW"
    if postcode:
        pc = int(postcode)
        if 2000 <= pc <= 2999:
            state = "NSW"
        elif 3000 <= pc <= 3999:
            state = "VIC"
        elif 4000 <= pc <= 4999:
            state = "QLD"
        elif 5000 <= pc <= 5999:
            state = "SA"
        elif 6000 <= pc <= 6999:
            state = "WA"
        elif 7000 <= pc <= 7999:
            state = "TAS"
        elif 800 <= pc <= 899:
            state = "NT"
        elif 2600 <= pc <= 2618:
            state = "ACT"

    suburb = name.lower().replace(" ", "-").replace(",", "").strip("-")
    suburb_slug = f"{suburb}-{postcode}" if postcode else suburb

    return {"state": state, "suburb_slug": suburb_slug}


def _launch_browser(playwright):
    return playwright.chromium.launch(
        headless=True,
        args=["--disable-blink-features=AutomationControlled"],
    )


def _get_or_create_browser(playwright):
    """Reuse browser across multiple scraping calls in the same session."""
    return playwright.chromium.launch(
        headless=True,
        args=["--disable-blink-features=AutomationControlled"],
    )


def _new_context(browser):
    """Create a new browser context with realistic browser settings."""
    return browser.new_context(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        locale="en-AU",
        timezone_id="Australia/Sydney",
    )


def scrape_hotdoc(care_type: str, location: str) -> list[dict]:
    """
    Scrape HotDoc /find/ page for providers and their next available appointments.

    The /find/ page renders practice cards with:
    - Practice name and address
    - Open/closed status
    - Appointment time links with booking URLs containing clinic_id, doctor_id, datetime

    Returns list of dicts with practice info and appointment slots.
    """
    hotdoc_slug = CARE_TYPE_HOTDOC_SLUG.get(care_type)
    if hotdoc_slug is None:
        return []

    slug_info = _location_to_slug(location)
    url = HOTDOC_FIND_URL.format(
        care_type=hotdoc_slug,
        state=slug_info["state"],
        suburb_slug=slug_info["suburb_slug"],
    )

    results = []
    with sync_playwright() as p:
        browser = _launch_browser(p)
        try:
            context = _new_context(browser)
            page = context.new_page()

            print(f"[HotDoc] Loading: {url}")
            page.goto(url, wait_until="networkidle", timeout=30000)
            print(f"[HotDoc] Final URL: {page.url}")

            html = page.content()
            soup = BeautifulSoup(html, "html.parser")

            # Find all booking links — they contain appointment data
            booking_links = soup.find_all("a", href=re.compile(r"/medical-centres/book/appointment/start"))

            # Build doctor_id → doctor_name mapping from page
            doctor_names = {}
            # HotDoc renders doctor names in links like /medical-centres/.../dr-john-smith
            doctor_links = soup.find_all("a", href=re.compile(r"/medical-centres/[^/]+/[^/]+/dr-"))
            for dl in doctor_links:
                name = dl.get_text(strip=True)
                dhref = dl.get("href", "")
                # Find nearby booking link to get doctor_id
                parent = dl.find_parent()
                if parent:
                    nearby = parent.find("a", href=re.compile(r"doctor=(\d+)"))
                    if nearby:
                        dm = re.search(r"doctor=(\d+)", nearby.get("href", ""))
                        if dm and name:
                            doctor_names[dm.group(1)] = name

            # Also look for "Dr" text patterns in the page
            for tag in soup.find_all(string=re.compile(r"^Dr\s+\w+")):
                text = tag.strip()
                if len(text) < 50:  # Reasonable name length
                    parent = tag.find_parent()
                    if parent:
                        nearby = parent.find("a", href=re.compile(r"doctor=(\d+)"))
                        if nearby:
                            dm = re.search(r"doctor=(\d+)", nearby.get("href", ""))
                            if dm and dm.group(1) not in doctor_names:
                                doctor_names[dm.group(1)] = text

            # Group by clinic
            clinics = {}
            for link in booking_links:
                href = link.get("href", "")
                time_text = link.get_text(strip=True)

                # Parse clinic ID and doctor ID from URL
                clinic_match = re.search(r"clinic=(\d+)", href)
                doctor_match = re.search(r"doctor=(\d+)", href)
                when_match = re.search(r"when=([\d-]+)", href)

                clinic_id = clinic_match.group(1) if clinic_match else None
                if not clinic_id:
                    continue

                if clinic_id not in clinics:
                    clinics[clinic_id] = {
                        "clinic_id": clinic_id,
                        "slots": [],
                        "doctors": set(),
                    }

                doc_id = doctor_match.group(1) if doctor_match else None
                doc_name = doctor_names.get(doc_id) if doc_id else None
                if doc_name:
                    clinics[clinic_id]["doctors"].add(doc_name)

                clinics[clinic_id]["slots"].append({
                    "time": time_text,
                    "doctor_id": doc_id,
                    "doctor_name": doc_name,
                    "date": when_match.group(1) if when_match else None,
                    "booking_url": f"https://www.hotdoc.com.au{href}" if not href.startswith("http") else href,
                })

            # Find practice names and addresses from practice links
            practice_links = soup.find_all("a", href=re.compile(r"/medical-centres/[^/]+-\w+-\d+/[^/]+/doctors"))

            for plink in practice_links:
                text = plink.get_text(strip=True)
                href = plink.get("href", "")

                # Extract practice name (before address info) and address
                # Text format: "Practice NameAddress line, Suburb STATEClosed·Opens..."
                # or similar patterns
                if not text or len(text) < 3:
                    continue

                # Try to find the clinic ID from nearby booking links
                parent = plink.find_parent()
                nearby_booking = None
                if parent:
                    nearby_booking = parent.find("a", href=re.compile(r"clinic=(\d+)"))

                clinic_id = None
                if nearby_booking:
                    cm = re.search(r"clinic=(\d+)", nearby_booking.get("href", ""))
                    clinic_id = cm.group(1) if cm else None

                # Parse name and address from the text
                # Usually: "Name\nAddress\nStatus"
                parts = re.split(r"(?:Closed|Open|·)", text)
                name_addr = parts[0].strip() if parts else text

                # Try to split name from address at the street number
                addr_match = re.search(r"(\d+\s+\w)", name_addr)
                if addr_match:
                    split_pos = addr_match.start()
                    name = name_addr[:split_pos].strip()
                    address = name_addr[split_pos:].strip()
                else:
                    # Check for "Level" or "Suite" as address start
                    level_match = re.search(r"(Level|Suite|Shop|Unit)\s", name_addr)
                    if level_match:
                        split_pos = level_match.start()
                        name = name_addr[:split_pos].strip()
                        address = name_addr[split_pos:].strip()
                    else:
                        name = name_addr
                        address = ""

                # Determine open status
                is_open = "Open" in text and "Closed" not in text.split("Open")[0][-10:]

                profile_url = href if href.startswith("http") else f"https://www.hotdoc.com.au{href}"

                # Get slots and doctor names for this clinic
                clinic_data = clinics.get(clinic_id, {}) if clinic_id else {}
                slots = clinic_data.get("slots", [])
                next_available = slots[0]["time"] if slots else None
                next_doctor = slots[0].get("doctor_name") if slots else None
                clinic_doctors = sorted(clinic_data.get("doctors", set())) if clinic_data.get("doctors") else []

                # Also grab parent/grandparent text for broader keyword matching
                card_text = text
                if parent:
                    grandparent = parent.find_parent()
                    card_text = parent.get_text(separator=" ")
                    if grandparent:
                        card_text = grandparent.get_text(separator=" ")
                card_text_lower = card_text.lower()
                text_lower = text.lower()

                # Detect bulk billing from card text
                bulk_billing = any(kw in card_text_lower for kw in ["bulk bill", "bulk billing", "bulk billed"])

                # Detect services from card/parent text
                service_keywords = {
                    "x-ray": ["x-ray", "xray"],
                    "pathology": ["pathology"],
                    "blood test": ["blood test"],
                    "children": ["children"],
                    "after hours": ["after-hours", "after hours"],
                    "telehealth": ["telehealth"],
                    "vaccination": ["vaccination"],
                    "women's health": ["women's health", "womens health", "women"],
                    "mental health": ["mental health"],
                    "skin": ["skin check", "skin cancer", "skin"],
                }
                services = [svc for svc, keywords in service_keywords.items() if any(kw in card_text_lower for kw in keywords)]

                results.append({
                    "source": "hotdoc",
                    "name": name if name else "Unknown Practice",
                    "address": address,
                    "next_available": next_available,
                    "next_doctor": next_doctor,
                    "doctors": clinic_doctors,
                    "all_slots": slots[:5],  # First 5 available slots
                    "is_open": is_open,
                    "profile_url": profile_url,
                    "clinic_id": clinic_id,
                    "bulk_billing": bulk_billing,
                    "services": services,
                })

        except PlaywrightTimeout:
            print(f"[HotDoc] Timeout loading {url}")
        except Exception as e:
            print(f"[HotDoc] Error: {e}")
        finally:
            browser.close()

    return results


SERVICE_KEYWORDS = [
    "bulk billing", "bulk billed", "x-ray", "xray", "pathology", "blood test",
    "children", "paediatric", "pediatric", "after hours", "after-hours",
    "telehealth", "video consult", "vaccination", "immunisation", "skin check",
    "mental health", "women's health", "travel medicine", "chronic disease",
]


def scrape_hotdoc_profile_services(profile_url: str) -> dict:
    """Scrape a HotDoc practice profile page for services and doctor names.

    Takes a profile URL like https://www.hotdoc.com.au/medical-centres/sydney-NSW-2000/sydney-doctors/doctors
    and extracts service tags, bulk billing status, and doctor names.

    Returns {"services": [...], "bulk_billing": True/False, "doctors": [...]}.
    Uses a 10-second timeout — returns empty results on failure.
    """
    empty = {"services": [], "bulk_billing": False, "doctors": []}

    with sync_playwright() as p:
        browser = _launch_browser(p)
        try:
            context = _new_context(browser)
            page = context.new_page()

            page.goto(profile_url, wait_until="domcontentloaded", timeout=10000)
            html = page.content()
        except PlaywrightTimeout:
            print(f"[HotDoc Profile] Timeout loading {profile_url}")
            return empty
        except Exception as e:
            print(f"[HotDoc Profile] Error loading {profile_url}: {e}")
            return empty
        finally:
            browser.close()

    soup = BeautifulSoup(html, "html.parser")
    page_text = soup.get_text(separator=" ").lower()

    # 1. Keyword scan across whole page text
    found = set()
    for kw in SERVICE_KEYWORDS:
        if kw in page_text:
            found.add(kw)

    # 2. Look for structured service lists near headings like "services", "what we offer"
    for heading in soup.find_all(re.compile(r"^h[1-6]$")):
        heading_text = heading.get_text(strip=True).lower()
        if any(term in heading_text for term in ["service", "what we offer", "capabilities", "specialt"]):
            # Grab the next sibling ul/ol
            sibling = heading.find_next_sibling()
            while sibling and sibling.name not in ("ul", "ol", "h1", "h2", "h3", "h4", "h5", "h6"):
                sibling = sibling.find_next_sibling()
            if sibling and sibling.name in ("ul", "ol"):
                for li in sibling.find_all("li"):
                    item = li.get_text(strip=True).lower()
                    # Check if any keyword matches
                    for kw in SERVICE_KEYWORDS:
                        if kw in item:
                            found.add(kw)
                    # Also add the raw item as a service if it's short enough
                    if len(item) < 60 and item not in found:
                        found.add(item)

    # Normalize: merge synonyms
    normalized = set()
    for svc in found:
        if svc in ("bulk billing", "bulk billed"):
            normalized.add("bulk billing")
        elif svc in ("x-ray", "xray"):
            normalized.add("x-ray")
        elif svc in ("paediatric", "pediatric"):
            normalized.add("paediatric")
        elif svc in ("after hours", "after-hours"):
            normalized.add("after hours")
        else:
            normalized.add(svc)

    bulk_billing = "bulk billing" in normalized

    # Extract doctor names from profile page links
    doctors = []
    for a in soup.find_all("a", href=re.compile(r"/doctors/dr-")):
        name = a.get_text(strip=True)
        if name and name.startswith("Dr") and len(name) < 60 and name not in doctors:
            doctors.append(name)

    return {
        "services": sorted(normalized),
        "bulk_billing": bulk_billing,
        "doctors": doctors,
    }


def scrape_ed_wait_times(state: str = "nsw") -> list[dict]:
    """Scrape ED wait times from state health department websites."""
    state_urls = {
        "nsw": "https://www.emergencywait.health.nsw.gov.au",
        "qld": "https://www.data.qld.gov.au/dataset/emergency-department",
        "vic": "https://www.health.vic.gov.au/emergency-care",
        "wa": "https://ww2.health.wa.gov.au/Reports-and-publications/Emergency-department-activity",
    }

    url = state_urls.get(state.lower())
    if not url:
        return []

    results = []
    with sync_playwright() as p:
        browser = _launch_browser(p)
        try:
            context = _new_context(browser)
            page = context.new_page()

            page.goto(url, wait_until="networkidle", timeout=30000)
            page.wait_for_selector("table, [class*='wait'], [class*='hospital']", timeout=15000)

            html = page.content()
            soup = BeautifulSoup(html, "html.parser")

            rows = soup.find_all("tr")
            for row in rows:
                cells = row.find_all("td")
                if len(cells) >= 2:
                    name = cells[0].get_text(strip=True)
                    wait_time = cells[1].get_text(strip=True)
                    wait_minutes = _parse_wait_time(wait_time)

                    if name and wait_time:
                        results.append({
                            "source": "state_health",
                            "name": name,
                            "wait_time_text": wait_time,
                            "wait_minutes": wait_minutes,
                            "state": state.upper(),
                        })

        except PlaywrightTimeout:
            print(f"[ED] Timeout for {state}")
        except Exception as e:
            print(f"[ED] Error: {e}")
        finally:
            browser.close()

    return results


def _parse_wait_time(text: str) -> int | None:
    """Parse wait time text into total minutes."""
    if not text:
        return None
    total = 0
    hr_match = re.search(r"(\d+)\s*(?:hr|hour)", text, re.IGNORECASE)
    min_match = re.search(r"(\d+)\s*(?:min)", text, re.IGNORECASE)
    if hr_match:
        total += int(hr_match.group(1)) * 60
    if min_match:
        total += int(min_match.group(1))
    return total if total > 0 else None


def get_availability(care_type: str, location: str, state: str = "nsw") -> list[dict]:
    """
    Main entry point: get availability for a care type in a location.
    """
    if care_type == "ed":
        return scrape_ed_wait_times(state)

    results = scrape_hotdoc(care_type, location)

    # Enrich top 5 with detailed profile data (services + doctor names)
    for result in results[:5]:
        if result.get("profile_url"):
            try:
                profile_data = scrape_hotdoc_profile_services(result["profile_url"])
                if profile_data.get("services"):
                    result["services"] = list(set(result.get("services", []) + profile_data["services"]))
                if profile_data.get("bulk_billing") is not None:
                    result["bulk_billing"] = profile_data["bulk_billing"]
                if profile_data.get("doctors"):
                    result["doctors"] = profile_data["doctors"]
                    # Set first doctor as next_doctor if not already set
                    if not result.get("next_doctor"):
                        result["next_doctor"] = profile_data["doctors"][0]
            except Exception:
                pass

    return results
