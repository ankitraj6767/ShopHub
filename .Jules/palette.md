## 2025-05-27 - [A11y/UX Improvement] Focus-visible for Hover-Revealed Elements
**Learning:** Elements that are revealed only on hover (`opacity-0 group-hover:opacity-100`) become invisible traps for keyboard users because they cannot be focused via keyboard navigation unless `focus-visible:opacity-100` or similar is added, or they lack an indicator when focused.
**Action:** Always ensure hover-revealed elements are also visible on focus using `focus-visible:opacity-100` or similar focus-within states on parent, so keyboard users can discover and interact with them.
