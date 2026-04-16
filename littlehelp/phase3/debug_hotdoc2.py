"""Debug: try different HotDoc URL patterns and direct GP website scraping."""
import os
from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        locale="en-AU",
        timezone_id="Australia/Sydney",
    )
    page = context.new_page()

    # Try 1: HotDoc location-based URL
    urls = [
        "https://www.hotdoc.com.au/medical-centres/sydney-NSW-2000/gp",
        "https://www.hotdoc.com.au/search?in=Sydney%20NSW%202000&filters=gp",
    ]

    for url in urls:
        print(f"\n--- Trying: {url}")
        try:
            page.goto(url, wait_until="networkidle", timeout=20000)
            print(f"  Final URL: {page.url}")
            print(f"  Title: {page.title()}")
            page.screenshot(path=f"hotdoc_{urls.index(url)}.png", full_page=False)

            # Check for results
            html = page.content()
            soup = BeautifulSoup(html, "html.parser")
            # Look for any links to medical centres
            links = soup.find_all("a", href=True)
            mc_links = [l for l in links if "/medical-centres/" in l.get("href", "") and l.get_text(strip=True)]
            print(f"  Medical centre links found: {len(mc_links)}")
            for l in mc_links[:5]:
                print(f"    {l.get_text(strip=True)[:60]} -> {l['href'][:80]}")
        except Exception as e:
            print(f"  Error: {e}")

    # Try 2: Scrape a GP website directly for HotDoc widget
    print("\n--- Trying direct GP website: https://ocnlst.com.au/")
    try:
        page.goto("https://ocnlst.com.au/", wait_until="networkidle", timeout=20000)
        html = page.content()
        soup = BeautifulSoup(html, "html.parser")

        # Look for HotDoc booking widget or booking links
        hotdoc_refs = [el for el in soup.find_all(["a", "iframe", "script", "div"])
                       if "hotdoc" in str(el).lower() or "book" in str(el).lower()]
        print(f"  HotDoc/booking references found: {len(hotdoc_refs)}")
        for ref in hotdoc_refs[:10]:
            if ref.name == "a":
                print(f"    <a> {ref.get_text(strip=True)[:50]} -> {ref.get('href', '')[:80]}")
            elif ref.name == "iframe":
                print(f"    <iframe> src={ref.get('src', '')[:80]}")
            elif ref.name == "script":
                src = ref.get("src", "")
                if src:
                    print(f"    <script> src={src[:80]}")
            else:
                text = ref.get_text(strip=True)[:50]
                if text:
                    print(f"    <{ref.name}> {text}")

        page.screenshot(path="gp_website.png", full_page=False)
    except Exception as e:
        print(f"  Error: {e}")

    browser.close()
