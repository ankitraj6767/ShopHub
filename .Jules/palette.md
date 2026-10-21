## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.
## 2024-10-21 - Accessible Newsletter Form
**Learning:** Isolated input components (like newsletter subscriptions) without a visual `<label>` are commonly placed inside standard `<div>` elements, rendering native keyboard submission ("Enter" key) broken and screen readers without context.
**Action:** Always wrap isolated inputs in a `<form>` element, attach an explicit `aria-label` to the input, and ensure the submit `<button>` has `type="submit"`. Also, provide `onSubmit={(e) => e.preventDefault()}` to avoid unwanted full-page reloads.
