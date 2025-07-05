# AGENTS.md

## JavaScript Module Scope
This folder contains all frontend logic for the GN Mapbox Plugin, including:

- Mapbox GL map initialization
- Marker loading from ACF data
- Navigation with Directions API
- Voice-guided route playback
- Terrain and elevation rendering
- Debug panels and floating UI controls

## Code Style
- Use ES6+ syntax: `let`, `const`, arrow functions, destructuring.
- Use 2 spaces for indentation.
- Use camelCase for variables and functions.
- Always wrap logic in `DOMContentLoaded` or `window.onload`.
- Avoid inline event handlers (`onclick=`); use `addEventListener`.

## File Guidelines
- `mapbox-init.js`: The main entry point. All new features must be modularized and wrapped in `DOMContentLoaded`.
- Separate large components into files if they exceed 500 lines.
- Use modular design—avoid global scope unless needed.
- Preserve existing voice, navigation, and elevation rendering functions.

## Testing
Manual test steps (until automated tests are set up):
- Confirm map loads with live markers.
- Validate route draws correctly between all ACF locations.
- Toggle voice navigation and confirm Greek TTS works.
- Check elevation chart loads after path selection.

## Linting
- Use `eslint` with the WordPress + ES6 config.
- Always run `eslint .` before committing.

## Known Issues
- Avoid duplicate route layers or popups when reloading.
- Do not interfere with `gnMapData` passed via `wp_localize_script`.

## Codex Agent Notes
- Add new buttons or panels using DOM APIs, not innerHTML injection.
- If debugging, use `console.log()` prefixed with `[GN DEBUG]`.
- Group related helper functions together and name clearly.
- If unsure where to place new logic, create a new module file.
