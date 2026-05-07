## 2024-05-07 - Missing ARIA Labels on Icon Buttons
**Learning:** Many interactive icon-only buttons in the ProductCard and Cart components lack explicit `aria-label` attributes, relying solely on `title` which is insufficient for screen readers.
**Action:** Adding ARIA labels to icon-only buttons is a crucial micro-UX and accessibility enhancement that greatly improves the experience for users with assistive technologies.
