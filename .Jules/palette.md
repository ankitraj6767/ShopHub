## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.

## 2024-07-25 - Custom Modal Accessibility
**Learning:** In this application, custom modals built from scratch lack the inherent accessibility features provided by headless UI libraries. They require manual addition of `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` referencing the modal's title to ensure screen readers correctly interpret and announce the modal context.
**Action:** When creating or updating any custom modal components in the frontend, always ensure these fundamental ARIA attributes are present on the container and linked to the correct title element.
