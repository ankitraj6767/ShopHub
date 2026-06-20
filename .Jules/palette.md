## 2025-01-24 - [Avoid Invisible Keyboard Traps]
**Learning:** When using Tailwind CSS `opacity-0 group-hover:opacity-100` to reveal elements only on hover, they become invisible traps for users navigating via keyboard focus. The element can receive focus, but the user cannot see it, breaking accessibility.
**Action:** Always append `focus-visible:opacity-100` along with explicit focus indicators (e.g. `focus-visible:ring-2 focus-visible:outline-none`) to interactive elements hidden via opacity so they become visible when tabbed into.
