## 2025-05-19 - Accessible Context for Navigation Badges
**Learning:** Raw SVG icons used for top-level navigation links (like Wishlist and Cart) with dynamically updating numerical badges provide no context to screen reader users about what the number represents.
**Action:** When implementing icon links with counter badges, dynamically update the parent element's `aria-label` to combine both the icon's purpose and the item count (e.g., `aria-label={\`Shopping Cart, \${itemsCount} items\`}`).
