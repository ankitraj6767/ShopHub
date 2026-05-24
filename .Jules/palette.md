## 2024-05-24 - [Visible Focus for Hover-Only Actions]
**Learning:** Action buttons that use `opacity-0` and rely on `group-hover:opacity-100` to appear become completely invisible traps for keyboard users navigating via Tab.
**Action:** Always append `focus-visible:opacity-100` alongside hover opacity states to ensure buttons reveal themselves when receiving keyboard focus.
