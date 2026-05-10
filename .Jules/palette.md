## 2024-05-10 - [Dynamic E-commerce Cart Accessibility]
**Learning:** Adding `aria-live="polite"` and `aria-atomic="true"` to dynamically updating cart values (like quantity indicators) alongside standard `aria-label`s on control buttons makes a significant difference for screen reader users by preventing them from losing context during updates.
**Action:** Always wrap dynamically changing numerical counters or status indicators in ARIA live regions, especially when they are updated without a full page reload.
