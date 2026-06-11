
## 2026-06-11 - [Accessible Icon-Only Buttons and Invisible Focus Traps]
**Learning:** Found a recurring pattern in the application's components (e.g., `ProductCard`) where icon-only buttons lacked `aria-label`s, breaking screen reader accessibility. Additionally, a critical keyboard navigation trap was identified: elements hidden with `opacity-0` (only revealed on `group-hover`) remained focusable but invisible.
**Action:** When creating or modifying icon-only buttons, always explicitly set an `aria-label` and `title`. For elements using `opacity-0` hover reveals, mandate the addition of `focus-visible:opacity-100` alongside visible focus rings to prevent invisible keyboard focus traps.
