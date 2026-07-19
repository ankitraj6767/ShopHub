## 2024-07-19 - ARIA Labels on Icon-only Buttons
**Learning:** Found multiple instances where icon-only buttons lacked accessible names. Even visually clear icons (like FiX or FiMessageCircle) need `aria-label`s for screen readers. Furthermore, adding `aria-hidden="true"` to the nested SVG element is important to prevent redundant or confusing screen reader announcements.
**Action:** Always verify if a button contains only an icon and ensure both `aria-label` on the button and `aria-hidden="true"` on the SVG are present.
