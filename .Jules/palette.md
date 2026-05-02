## 2026-05-02 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Found a consistent pattern across this application's frontend where icon-only buttons (like password toggles, mobile menu toggles, and chat toggles) lack `aria-label` attributes. This makes these interactive elements inaccessible to screen readers.
**Action:** Always verify that buttons containing only icons (like from `react-icons`) have an explicit `aria-label` that describes their function or state (e.g., 'Show password' or 'Hide password').
