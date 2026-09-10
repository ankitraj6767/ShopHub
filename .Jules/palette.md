## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.

## 2024-10-24 - Modal Accessibility
**Learning:** Icon-only action buttons inside modals (like Close, quantity adjustments, wishlist toggling, and thumbnail selection) frequently lack descriptive labels and can incorrectly announce their inner SVG icons if they are not explicitly hidden from screen readers.
**Action:** Always add descriptive `aria-label` attributes to icon-only buttons (dynamically if they contain state) and pair them with `aria-hidden="true"` on the enclosed `<svg>` elements to create a clean accessibility tree.
