## 2024-05-15 - [A11y] Hidden elements on hover missing focus states
**Learning:** Buttons or UI elements that are revealed only via hover (`opacity-0 group-hover:opacity-100`) become invisible traps for keyboard navigation if they lack a focus state.
**Action:** Always append `focus-visible:opacity-100` (for individual elements) or `focus-within:opacity-100` (for parent containers) alongside `group-hover:opacity-100` to ensure interactive elements are visible when focused via keyboard.
