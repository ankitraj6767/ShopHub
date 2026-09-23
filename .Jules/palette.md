## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.
## 2024-08-09 - Accessible Footer Newsletter Subscriptions
**Learning:** Footer newsletter inputs often lack a visible label and fail to submit on 'Enter' due to being nested in a simple `div` wrapper instead of a `form`. This makes keyboard navigation unnatural and creates accessibility barriers.
**Action:** Always wrap isolated inputs (like search bars or newsletter boxes) in a `<form>` element, ensure the submit button has `type="submit"`, use `onSubmit={(e) => e.preventDefault()}`, and apply `aria-label` when visible `<label>`s are missing.
