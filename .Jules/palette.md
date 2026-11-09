## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.
## 2024-10-27 - Group Hover and Focus Within Accessibility
**Learning:** When using `group-hover:opacity-100` to reveal interactive UI elements (like Quick Actions on a product card), keyboard users cannot see the actions because `group-hover` does not trigger on focus.
**Action:** Always append `focus-within:opacity-100` to the container revealing the elements. Furthermore, ensure absolute positioned overlays that use `pointer-events-none` manually set `pointer-events-auto` on the child buttons, and properly isolate overarching `<Link>` tags from containing `<button>` tags by separating them in the DOM to avoid HTML validation and a11y anti-patterns.
