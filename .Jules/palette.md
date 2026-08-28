## 2024-08-28 - ARIA expansion pattern for toggle buttons
**Learning:** For toggle-like floating actions (like minimizing/expanding a widget), an explicit `aria-expanded` and an accurate contextual label are essential, since absolute-positioned elements frequently strip native HTML roles.
**Action:** When auditing custom interactive absolute-positioned widgets, enforce that any visual state change (minimize/expand) uses dynamically updated ARIA labels or `aria-expanded` attributes combined with focus-visible accessibility.

## 2024-08-28 - ARIA expansion pattern for toggle buttons
**Learning:** For toggle-like floating actions (like minimizing/expanding a widget), an explicit `aria-expanded` and an accurate contextual label are essential, since absolute-positioned elements frequently strip native HTML roles.
**Action:** When auditing custom interactive absolute-positioned widgets, enforce that any visual state change (minimize/expand) uses dynamically updated ARIA labels or `aria-expanded` attributes combined with focus-visible accessibility.
