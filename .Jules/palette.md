## 2024-05-19 - [ARIA live region usage on Dynamic UI state in Vite]
**Learning:** Adding `aria-live="polite"` and `aria-atomic="true"` to simple, rapidly changing numeric displays (like the quantity counter in `QuickViewModal`) correctly broadcasts state changes to screen readers without needing complex React state announcements, and is easy to do inline.
**Action:** Always check dynamically updating span elements to ensure they have `aria-live` attributes.
