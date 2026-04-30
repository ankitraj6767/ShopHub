## 2024-05-19 - Adding Accessible Interactive Elements to ProductCards
**Learning:** Icon-only buttons used inside dense grid layouts like Product Cards often miss essential ARIA labels. Additionally, these buttons lack focus indicators making keyboard navigation nearly impossible for users relying on tab keys to browse the store.
**Action:** Always verify that every interactive, icon-only button receives an `aria-label` describing its action and a `focus-visible` ring constraint, especially in repeating component structures like Product Cards.
