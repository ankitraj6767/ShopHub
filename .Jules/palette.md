## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.

## 2024-07-17 - Dynamic Counters in ARIA Labels
**Learning:** Screen readers often announce nested notification badges poorly (e.g. "Chat button, 3"). It's significantly clearer to combine the button's purpose and its dynamic state/count into a single, cohesive `aria-label`.
**Action:** When implementing icon links or buttons with counter badges (like Chat, Cart, or Notifications), dynamically update the parent element's `aria-label` to include both the purpose and item count (e.g., ``aria-label={`Open chat${count > 0 ? `, ${count} unread messages` : ''}`}``), and ensure the inner badge is skipped or redundant reading is avoided.
