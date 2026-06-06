## 2024-06-06 - [A11y: Avoid Keyboard Focus Traps on Hover Revealed Elements]
**Learning:** Elements styled with Tailwind's `opacity-0 group-hover:opacity-100` are hidden by default but can still receive keyboard focus if they are interactive (like `<button>`). Without an explicit focus style, this creates an invisible focus trap for keyboard users.
**Action:** Always append `focus-visible:opacity-100` (or `focus-within:opacity-100` on containers) to such elements so that when they are focused via keyboard, they become visible to the user.
