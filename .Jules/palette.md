## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.
## 2024-09-07 - Form Keyboard Submission and Labels
**Learning:** Isolated input fields like newsletter subscriptions or search bars that rely purely on placeholder text are inaccessible to screen readers, and standalone inputs next to buttons do not allow users to natively submit their data by pressing the "Enter" key unless wrapped in a form.
**Action:** Always wrap single input + button combinations in a `<form>` tag with `type="submit"` on the button, and add an explicit `aria-label` to the input if a visual `<label>` isn't present, to ensure both keyboard and screen reader accessibility.
