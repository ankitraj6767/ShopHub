## 2024-05-15 - Missing ARIA Labels on Icon-Only Controls
**Learning:** Found a recurring pattern in the app where icon-only navigation controls (like cart icons, mobile menu toggles, and user profile buttons) lack `aria-label` attributes and visible keyboard focus states (`focus-visible:ring-2`), making them inaccessible to screen readers and keyboard users.
**Action:** Always verify that interactive elements containing only icons have a descriptive `aria-label` and explicit `focus-visible` outline or ring class to ensure accessibility compliance.
