
## 2024-06-09 - Keyboard Accessibility with Hover-Revealed Elements
**Learning:** `opacity-0 group-hover:opacity-100` makes elements accessible to mouse users but completely hides them from keyboard users who tab through interactive elements.
**Action:** Always append `focus-visible:opacity-100` to elements that appear on hover (or `focus-within:opacity-100` on parent containers) to ensure keyboard users can discover and interact with them.
