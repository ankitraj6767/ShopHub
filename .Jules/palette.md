## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.
## 2024-07-28 - Isolated Input Form Context
**Learning:** Isolated input fields like a newsletter subscribe bar without a `<form>` context prevent native keyboard submission (the Enter key). Users expect this behavior and it is crucial for accessibility. Relying solely on a placeholder text is also insufficient for screen reader accessibility; an explicit `aria-label` must be provided.
**Action:** Always wrap grouped inputs and submission buttons in a semantic `<form>` tag and provide `onSubmit={(e) => e.preventDefault()}` if it is a client-side action. Set the button `type="submit"`, give it `focus-visible` styles, and ensure the input has a descriptive `aria-label`.
