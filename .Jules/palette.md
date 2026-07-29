## 2024-07-29 - Modal Accessibility Polish
**Learning:** Floating interactive elements (like the QuickViewModal) are particularly prone to accessibility pitfalls when focus indicators are stripped by fixed/absolute positioning. Custom icon-only buttons nested within modals require explicit `aria-label`, `focus-visible` styling, and `aria-hidden="true"` on SVGs to ensure screen readers do not announce redundant/confusing structure.
**Action:** Always include semantic roles (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) on the container, and add `focus-visible:ring-2` to all interactive buttons within custom modal components.

## 2024-07-29 - Modal Accessibility Polish
**Learning:** Floating interactive elements (like the QuickViewModal) are particularly prone to accessibility pitfalls when focus indicators are stripped by fixed/absolute positioning. Custom icon-only buttons nested within modals require explicit `aria-label`, `focus-visible` styling, and `aria-hidden="true"` on SVGs to ensure screen readers do not announce redundant/confusing structure.
**Action:** Always include semantic roles (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) on the container, and add `focus-visible:ring-2` to all interactive buttons within custom modal components.
