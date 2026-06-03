## 2026-06-03 - Added aria-labels to icon-only navigation elements
**Learning:** Icon-only navigation elements (like floating action buttons and header links) frequently lack explicit `aria-label` attributes even when tooltips (`title`) are present. This leads to poor screen reader experiences as `title` isn't reliably announced.
**Action:** Always ensure that icon-only interactive elements (both buttons and links) have an explicit `aria-label` for screen readers.
