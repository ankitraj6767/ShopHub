## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.

## 2024-06-27 - Layout Variant Accessibility Parity
**Learning:** When a component has multiple layout variants (e.g., List View and Grid View in ProductCard), accessibility features can easily diverge. The Grid view had proper `aria-label`s and `focus-visible` states, but the List view lacked them, creating an inconsistent experience for keyboard and screen reader users depending on which view they selected.
**Action:** Always verify accessibility parity across all visual variants of a component. If a button exists in multiple layouts, its accessibility attributes must be duplicated or abstracted into a shared sub-component.
