
## 2024-05-18 - [Accessible Icon-Only and Hover-Revealed Buttons]
**Learning:** Icon-only buttons used heavily in e-commerce components (like `ProductCard`) are entirely invisible to screen readers without an `aria-label`. Furthermore, buttons that are visually hidden using `opacity-0` and revealed on hover (`group-hover:opacity-100`) become inaccessible traps for keyboard users unless `focus-visible:opacity-100` is also applied.
**Action:** Always ensure that any button without text content has a descriptive `aria-label`. For interactive elements hidden until hovered, always append `focus-visible:opacity-100` and explicit focus rings (`focus-visible:ring-2`) to ensure they are discoverable and navigable via keyboard.
