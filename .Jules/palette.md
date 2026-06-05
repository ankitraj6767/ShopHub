## 2026-06-05 - Focus Traps in Hover-Revealed UI
**Learning:** When using Tailwind CSS for UI elements that are revealed only on hover (e.g., `opacity-0 group-hover:opacity-100`), they become invisible traps for users navigating via keyboard focus. Screen reader users can focus them, but sighted keyboard users cannot see where their focus is.
**Action:** Always append `focus-visible:opacity-100` (for individual elements) or `focus-within:opacity-100` (for parent containers) alongside `group-hover:opacity-100`, and ensure standard focus rings (e.g., `focus-visible:ring-2`) are applied.
