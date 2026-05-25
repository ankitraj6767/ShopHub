## 2024-05-14 - Fix hover-revealed accessibility traps
**Learning:** Tailwind CSS classes like `opacity-0 group-hover:opacity-100` are commonly used to hide buttons until hover. This completely breaks keyboard navigation because the buttons receive focus but remain invisible (opacity 0) to screen readers/keyboard users if they do not hover.
**Action:** When using `opacity-0 group-hover:opacity-100` to hide UI elements, ALWAYS pair it with `focus-visible:opacity-100` (or `focus:opacity-100`) so that they appear when focused via keyboard.
