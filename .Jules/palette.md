## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.
## 2024-10-23 - Newsletter Accessibility and Submission UX
**Learning:** Isolated input and button combinations for tasks like "Newsletter Subscription" often rely purely on `onClick` handlers, which means users cannot intuitively press the "Enter" key to submit the form. Additionally, input fields that rely solely on `placeholder` attributes lack accessible labels for screen readers.
**Action:** Always wrap isolated inputs and buttons in a semantic `<form>` element, set the button to `type="submit"`, and provide an explicit `aria-label` to the input if it lacks a visual `<label>`. This immediately provides native keyboard submission and vastly improves screen reader accessibility.
