## 2024-05-15 - Focus Visibility
**Learning:** Hidden elements like tooltip badges or action buttons relying purely on `group-hover:opacity-100` are inaccessible for keyboard users.
**Action:** Always append `focus-within:opacity-100` to the container to ensure that when interactive children receive focus, the parent container makes them visible. Alternatively, `focus-visible:opacity-100` on the item itself.
## 2024-06-24 - Accessibility on Stateful Buttons
**Learning:** When adding ARIA labels to buttons containing state (like a notification unread count), dynamically updating the `aria-label` provides much better context to screen readers than a static label. Additionally, applying `aria-hidden="true"` to SVG icons and redundant text badges within the button prevents the screen reader from reading the information twice (e.g., reading the label, then reading the badge number).
**Action:** Always consider the state of a component when assigning `aria-label` and systematically use `aria-hidden="true"` on non-semantic child elements to create a clean, single-source-of-truth accessibility tree.

## 2024-05-18 - [Invalid HTML interactive nesting causes a11y focus issues]
**Learning:** React Router `<Link>` wrappers around product cards containing internal `<button>`s (like Quick Add) create invalid HTML that prevents proper screen reader interactions and keyboard focus. Wrapping whole blocks in Links is a common anti-pattern that hides inner interactive elements from accessibility trees.
**Action:** Always verify DOM nesting of interactive elements. For product cards with inner buttons, structure them as siblings inside a relative container. Use absolute positioning to float the inner buttons over the image link instead of nesting them inside the link. Ensure the overlay itself supports keyboard focus (e.g. `focus-within:opacity-100`).
