"""Debug: see what Playwright actually loads on HotDoc."""
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        locale="en-AU",
        timezone_id="Australia/Sydney",
    )
    page = context.new_page()

    url = "https://www.hotdoc.com.au/search?filters=gp&in=Sydney+CBD+2000&purpose=gp-consultation"
    print(f"Loading: {url}")
    page.goto(url, wait_until="networkidle", timeout=30000)

    # Screenshot
    page.screenshot(path="hotdoc_debug.png", full_page=True)
    print("Screenshot saved: hotdoc_debug.png")

    # Dump page title and some HTML structure
    print(f"Title: {page.title()}")
    print(f"URL: {page.url}")

    # Get all major elements to understand the DOM
    html = page.content()
    # Print first 3000 chars of body
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, "html.parser")

    # Find any elements that look like search results
    for tag in ["article", "section", "div"]:
        elements = soup.find_all(tag, class_=True)
        classes = set()
        for el in elements:
            for cls in el.get("class", []):
                if any(kw in cls.lower() for kw in ["card", "result", "practice", "search", "list", "item"]):
                    classes.add(cls)
        if classes:
            print(f"\n{tag} classes with result-like names: {sorted(classes)}")

    browser.close()
