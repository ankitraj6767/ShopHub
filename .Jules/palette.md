## 2024-05-21 - Dynamic Navigation Icons
**Learning:** Icon-only navigation links that contain dynamic state (like a cart with a dynamic items count) should have their `aria-label` reflect that specific dynamic state rather than just the generic link name, providing a much richer experience for screen reader users.
**Action:** Always include the dynamic count/value in the `aria-label` for icon-only elements that contain a badge or count, e.g., `aria-label={`Cart, ${itemsCount} items`}`.
