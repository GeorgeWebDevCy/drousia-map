# AGENTS.md

## Purpose
This folder contains all custom styles for the GN Mapbox Plugin, used to style map containers, floating UI panels, elevation charts, debug tools, and responsive layouts.

---

## 🧱 Structure Guidelines

- All files should use `.css` extension (no inline `<style>` blocks).
- Organize code into logical sections using clear comments.
- Example sections:
  - Layout (containers, wrappers)
  - Mapbox integration styles
  - Floating panels (e.g., navigation box, debug panel)
  - Responsive overrides
  - Animations or transitions

---

## 🧑‍🎨 CSS Conventions

- Use 2-space indentation.
- Use lowercase, hyphenated class names (e.g., `.gn-mapbox-debug-panel`).
- Prefer `clamp()` for responsive font sizes or spacing when possible.
- Use `:root {}` for custom variables only if needed and scoped clearly.
- Avoid `!important` unless overriding external libraries like Mapbox GL.
- Use utility class patterns when repeating layout behavior (e.g. `.is-hidden`, `.is-floating`).

---

## 🧪 Testing Guidelines

1. Ensure map container is full-width and responsive on all screen sizes.
2. Floating elements like voice panel and debug panel must:
   - Not block core map interactivity.
   - Be movable or closeable on mobile.
3. Use media queries to optimize:
   - Button placement
   - Panel spacing
   - Font scaling

---

## Do Not Modify

- Third-party styles injected by Mapbox (target them via overrides only).
- Global WordPress admin styles.

---

## Codex Agent Notes

- Group similar class rules together (e.g., all `.gn-nav-*` styles).
- Don’t inline styles in HTML or PHP—update the CSS file instead.
- If a style only affects mobile, wrap it in a `@media (max-width: 768px)` block.
- If adding new features (e.g. new buttons or panels), name them with `gn-` prefix and match plugin’s BEM naming approach.

---

## File Example

You can structure new rules like this:

```css
/* === Floating Navigation Panel === */
.gn-mapbox-nav-box {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

/* Responsive Fixes */
@media (max-width: 768px) {
  .gn-mapbox-nav-box {
    width: 90%;
    right: 5%;
    top: auto;
    bottom: 1rem;
  }
}
