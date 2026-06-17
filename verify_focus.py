from playwright.sync_api import sync_playwright

def test_focus_state():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # HTML content mimicking the Quick View button with Tailwind classes
        html_content = r'''
        <!DOCTYPE html>
        <html>
        <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
                body { background-color: #f3f4f6; padding: 50px; }
            </style>
        </head>
        <body>
            <div class="relative w-64 h-64 bg-gray-200 group">
                <!-- Mock Quick View Button -->
                <button
                    id="quick-view-btn"
                    class="absolute top-10 right-2 p-2 rounded-full bg-white/80 text-gray-600 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus:outline-none"
                    aria-label="Quick View"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </button>
            </div>
        </body>
        </html>
        '''

        page.set_content(html_content)

        # Wait for tailwind to process
        page.wait_for_timeout(2000)

        # Focus the button
        page.focus("#quick-view-btn")

        # Take a screenshot to verify it is visible
        page.screenshot(path="focus-state-test.png")
        print("Screenshot taken. Verify focus state in 'focus-state-test.png'.")

        browser.close()

if __name__ == "__main__":
    test_focus_state()
