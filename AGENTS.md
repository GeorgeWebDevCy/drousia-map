# AGENTS.md

## 🔍 Project Overview
This is the "GN Mapbox Plugin", a custom WordPress plugin for dynamic maps using Mapbox. It supports ACF-driven markers, route navigation with voice, elevation profiles, and multilingual compatibility via WPML.

---

## 📁 Directory Structure

- `gn-mapbox-plugin.php`: Main plugin file.
- `css/`: Custom plugin styles.
- `js/`: All frontend logic (Mapbox, voice, navigation).
- `data/`: Static files (JSON markers, path presets).
- `languages/`: WPML translation files (.po/.mo).
- `plugin-update-checker/`: Third-party updater library (do not modify).

---

## ✍️ Coding Guidelines

### PHP
- Use 2-space indentation.
- Follow [PSR-12](https://www.php-fig.org/psr/psr-12/) and WordPress standards.
- Prefix functions with `gn_` or `gnmapbox_`.
- Sanitize all output using `esc_html()`, `esc_url()`, etc.
- Load translations with `load_plugin_textdomain()` inside `init`.

### JavaScript (in `js/`)
- Use `let`, `const`, arrow functions, and modules when possible.
- Group related helper functions.
- Avoid inline event handlers (`onclick=`), use `addEventListener`.
- Voice, routing, elevation, and debug UI must remain modular.
- Log with `console.log('[GN DEBUG]', ...)`.

### CSS
- 2-space indentation.
- Use semantic class names or utility-first approach.
- Enqueue styles conditionally.

---

## 🧪 Testing Instructions

1. Enable ACF and assign coordinates to test posts.
2. Load map and confirm:
   - Markers from ACF show correctly.
   - Directions work in all modes (driving/walking/cycling).
   - Voice guidance in Greek plays as expected.
   - Elevation chart renders when routes are selected.
3. Check responsive layout and floating UI buttons.

---

## ✅ Linting & Build

- PHP: Run `php -l` or `phpcs --standard=PSR12 .`
- JS: Use `eslint` with WordPress + ES6 config if available.
- Avoid committing `.min.js` or `.mo` files.

---

## 🚫 Do Not Modify

- `plugin-update-checker/`
- `languages/`
- Any `.min.js` or `.map` files

---

## 📦 PR & Commit Guidelines

- Title format: `[Feature]`, `[Fix]`, `[Refactor]`, `[Docs]`, etc.
- Describe what changed and how it was tested.
- Assign PRs to `george-n` for review.

---

## 🧠 Codex Agent Notes

- When adding new JS features, extend `mapbox-init.js` or create a new file in `js/`.
- Use `wp_localize_script()` to pass PHP data to JS.
- Wrap all plugin logic inside `add_action('init', ...)` or `add_action('wp_enqueue_scripts', ...)`.
- For front-end interactions, prefer DOM-based approaches, no jQuery unless required.
- Ask before removing existing logic—especially map rendering, routing, or terrain decoding.
