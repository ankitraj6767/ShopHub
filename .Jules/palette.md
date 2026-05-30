## 2024-05-30 - Focus states for hover-revealed elements
**Learning:** Elements revealed only on hover (`opacity-0 group-hover:opacity-100`) become invisible traps for keyboard navigation if they do not also become visible on focus.
**Action:** Always append `focus-visible:opacity-100` (for individual elements) or `focus-within:opacity-100` (for parent containers) alongside hover states.
