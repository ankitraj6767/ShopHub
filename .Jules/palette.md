## 2026-05-06 - Icon-Only Button Accessibility
**Learning:** Across the frontend, many crucial interactive components (mobile menus, notifications, search clear functionality) use icon-only `<button>` tags without `aria-label` attributes. This is an inaccessible pattern that prevents screen reader users from understanding the purpose of these interactions.
**Action:** Always verify that buttons containing only icons (like from `react-icons`) have a clear, descriptive `aria-label` or screen-reader-only text associated with them.
