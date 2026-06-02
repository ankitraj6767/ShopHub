import asyncio
from playwright.async_api import async_playwright
import os

async def verify_modal():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Start a local vite server in the background
        os.system("cd frontend && pnpm run preview --port 4173 &")

        # Wait a bit for server to start
        await asyncio.sleep(8)

        try:
            # Navigate to the home page
            print("Navigating to http://localhost:4173...")
            await page.goto("http://localhost:4173", timeout=10000, wait_until="domcontentloaded")
            await asyncio.sleep(2)

            await page.screenshot(path="frontend/home_screenshot.png")
            print("Screenshot saved to frontend/home_screenshot.png")

        except Exception as e:
            print(f"Playwright error: {e}")
        finally:
            await browser.close()
            os.system("kill $(lsof -t -i:4173) 2>/dev/null || true")

asyncio.run(verify_modal())
