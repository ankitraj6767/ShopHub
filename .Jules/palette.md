## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.
## 2024-05-18 - [Theme Toggle Accessibility]
**Learning:** While `aria-label`s provide text alternatives for icon-only buttons, the internal SVG icons themselves can still be errantly read by screen readers if they lack `aria-hidden="true"`, causing redundant or confusing announcements. Furthermore, theme toggles placed in primary nav headers are prime targets for keyboard navigation, making visible `focus-visible` styling essential.
**Action:** Always append `aria-hidden="true"` to SVG elements within icon-only buttons, and explicitly define focus rings (`focus-visible:ring-2 focus-visible:ring-primary-500`) to guarantee keyboard accessibility.
