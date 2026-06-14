## 2024-06-14 - [Live Chat Accessibility]
**Learning:** Floating, highly visible UI components like live chat widgets often rely entirely on icons (message bubble, minimize, close). Without `aria-label`s, screen reader users cannot interact with these primary support features, and without `focus-visible` outlines, keyboard users cannot navigate floating interfaces effectively.
**Action:** Always add `aria-label` and `focus-visible` styles to floating, icon-only widget controls.
