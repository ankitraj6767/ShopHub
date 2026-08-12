## 2025-08-12 - Ensure floating UI elements have visible focus rings
**Learning:** Absolute or fixed positioned UI components (like floating action buttons and chat widgets) often lose standard browser keyboard focus rings due to their CSS stacking context. When styling with Tailwind, it's essential to explicitly add focus styles to maintain accessibility.
**Action:** When adding or modifying fixed/absolute interactive elements, always explicitly apply `focus:outline-none focus-visible:ring-2` (and an appropriate ring color/offset) instead of relying on default browser behaviors.
