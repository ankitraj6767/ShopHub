## 2024-06-13 - Focus Visible on Hover-Only Elements
**Learning:** Elements styled with `opacity-0 group-hover:opacity-100` become completely invisible to keyboard users who navigate via the Tab key, creating an invisible focus trap where the user loses track of where their focus is.
**Action:** Always append `focus-visible:opacity-100` and explicit focus ring styles (like `focus-visible:ring-2 focus-visible:outline-none`) to interactive elements that are visually hidden by default but revealed on hover.
