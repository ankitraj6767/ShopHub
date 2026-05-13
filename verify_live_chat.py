import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Setting up page routes...")
        # Mock API calls to ensure app loads quickly and without backend errors
        page.route("**/api/products**", lambda route: route.fulfill(status=200, json={"success": True, "data": []}))
        page.route("**/api/auth/me", lambda route: route.fulfill(status=200, json={"success": True, "data": {"_id": "123", "name": "Test User", "email": "test@example.com", "role": "user"}}))
        page.route("**/api/users/profile", lambda route: route.fulfill(status=200, json={"success": True, "data": {"_id": "123", "name": "Test User", "email": "test@example.com", "role": "user"}}))
        page.route("**/api/notifications", lambda route: route.fulfill(status=200, json={"success": True, "data": []}))
        page.route("**/api/cart", lambda route: route.fulfill(status=200, json={"success": True, "data": {"items": []}}))
        # Handle any other API calls
        page.route("**/api/**", lambda route: route.fulfill(status=200, json={"success": True, "data": {}}))

        # We will dispatch an action to Redux store directly to set auth
        # But first navigate to page
        print("Navigating to http://localhost:5173")
        page.goto("http://localhost:5173", wait_until="networkidle")

        print("Setting localStorage for authentication...")
        # Mock authentication state
        page.evaluate("""() => {
            localStorage.setItem('accessToken', 'fake-access-token');
            localStorage.setItem('refreshToken', 'fake-refresh-token');
            localStorage.setItem('userData', JSON.stringify({_id: '123', name: 'Test User', email: 'test@example.com', role: 'user'}));
        }""")

        # We can also hack the Redux store if it's exposed, but we can just reload.
        print("Reloading to apply auth state...")
        page.reload(wait_until="networkidle")

        print("Checking if user is authenticated...")
        is_auth = page.evaluate("""() => {
            return localStorage.getItem('accessToken') !== null;
        }""")
        print(f"Auth token in local storage: {is_auth}")

        # We can navigate to a private route like /profile to force auth
        page.goto("http://localhost:5173/profile", wait_until="networkidle")

        # Wait for the chat button to become visible.
        # Ensure it has the correct aria-label we added.
        print("Waiting for chat button...")
        try:
            chat_button = page.locator('button[aria-label="Open support chat"]')
            chat_button.wait_for(state="visible", timeout=10000)
            print("Chat button found!")

            # Focus the button so we can see the focus-visible ring
            print("Focusing chat button...")
            chat_button.focus()
            # Give it a moment to render focus outline
            page.wait_for_timeout(500)

            print("Taking screenshot...")
            page.screenshot(path="live_chat_button.png", full_page=True)
            print("Screenshot saved to live_chat_button.png")

            # Now click it to open the widget
            print("Opening chat widget...")
            chat_button.click()

            # Wait for the window to open
            close_button = page.locator('button[aria-label="Close support chat"]')
            close_button.wait_for(state="visible", timeout=3000)

            # Focus the minimize button
            minimize_button = page.locator('button[aria-label="Minimize chat window"]')
            minimize_button.focus()
            page.wait_for_timeout(500)

            print("Taking screenshot of open widget...")
            page.screenshot(path="live_chat_window.png", full_page=True)
            print("Screenshot saved to live_chat_window.png")

        except Exception as e:
            print(f"Error finding elements: {e}")
            page.screenshot(path="error.png", full_page=True)
            print("Error screenshot saved to error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
