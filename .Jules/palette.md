## 2024-06-04 - [Fix keyboard accessibility traps for hidden elements]
**Learning:** Elements hidden with `opacity-0 group-hover:opacity-100` are completely inaccessible to keyboard users because tabbing to them does not make them visible. This pattern is common in product cards or lists where secondary actions (like 'Quick View', 'Add to Wishlist', etc.) are hidden until hovered.

**Action:** Whenever using `opacity-0 group-hover:opacity-100`, always pair it with `focus-visible:opacity-100` (for the element itself) or `focus-within:opacity-100` (on the parent container, useful if it contains multiple interactive items) to ensure the interactive elements become visible and usable for keyboard navigators.
