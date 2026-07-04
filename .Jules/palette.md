## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.
## 2025-03-09 - [Quick View Modal Accessibility]
**Learning:** Icon-only interactive elements in modals (e.g. Close, Next/Prev Image, Quantity buttons, Wishlist toggles) frequently omit `aria-label`s and focus states. Screen readers either announce nothing or announce the SVG content redundantly unless `aria-hidden="true"` is explicitly set on inner SVGs alongside `aria-label` on the parent button.
**Action:** Always provide explicit `aria-label` strings for icon-only buttons in modals and ensure inner SVGs use `aria-hidden="true"`. Also verify keyboard focus visibility using standard Tailwind focus classes (`focus:outline-none focus-visible:ring-2`).
