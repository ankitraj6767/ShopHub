## 2026-05-01 - QuickView Modal Accessibility
**Learning:** Found several icon-only buttons in the QuickViewModal that lacked screen reader support. Modal itself lacked proper dialog semantics.
**Action:** Added `aria-label` to all icon-only buttons (close, images, quantity adjusters, wishlist) and applied `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` to the main modal container to ensure it is properly announced to screen reader users.
