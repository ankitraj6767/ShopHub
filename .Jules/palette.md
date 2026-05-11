## 2025-05-11 - Live Chat Widget Accessibility

**Learning:** When using modern icon libraries (like `react-icons`) in interactive elements, icon-only buttons often lack accessible names by default. In the `LiveChatWidget`, crucial interactive buttons like open, close, minimize, and send were missing both `aria-label`s for screen readers and visible focus states for keyboard users.
**Action:** When implementing new UI components, always ensure icon-only interactive elements receive descriptive `aria-label`s, `title`s (for mouse hover tooltips), and explicit `focus-visible` ring styles (e.g., `focus-visible:ring-2 focus-visible:ring-primary-500`) to guarantee accessibility for all input methods.
