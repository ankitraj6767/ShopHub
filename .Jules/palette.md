
## 2024-06-19 - Dynamic ARIA Labels for Icon Counters
**Learning:** Icon-only buttons with counter badges (like Cart or Wishlist) often fail to convey their state to screen readers if the `aria-label` is static. Screen readers might announce "Shopping Cart" but miss the "3 items" badge if it's visually separate or nested without context.
**Action:** Always combine the icon's purpose and the badge counter into a single dynamic `aria-label` on the parent interactive element (e.g., `aria-label={count > 0 ? \`Shopping Cart, ${count} items\` : "Shopping Cart"}`). This ensures the full context is announced clearly and natively in one go.
