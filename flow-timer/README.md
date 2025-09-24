# FlowTimer Notes (MV3 Extension)

A sleek, modern note & task timer extension. Add a task, start/pause it, and complete it when done. Includes a Pomodoro timer and a simple completion heatmap. Timers persist even when you close the popup. Data is stored locally using the browser's extension storage (with a localStorage fallback for standalone testing).

## Features

- Tabs: Tasks, Pomodoro, Completed, Heatmap
- Tasks: start, pause, complete per task; inline title edit; Pause all; Reset
- Completed: view & clear completed tasks for today
- Pomodoro: configurable work/break/long-break durations and cycles
- Heatmap: last 84 days of daily completions
- Import/Export JSON backups
- Responsive popup (fluid in standalone HTML; constrained in extension popup)
- Neutral, solid color palette; no gradients
- MV3, uses `storage` permission only

## File structure

- `manifest.json` — MV3 manifest with popup UI and storage permission
- `popup.html` — Popup UI markup
- `popup.css` — Neutral, solid palette with responsive layout and tab styles
- `popup.js` — Logic for tasks, timers, storage (with fallback), tabs, Pomodoro, and heatmap

## Install (Chrome / Edge)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable "Developer mode".
3. Click "Load unpacked" and select this project folder.
4. Pin the extension and click the icon to open the popup.

## Install (Firefox)

Firefox supports MV3. To load temporarily during development:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click "Load Temporary Add-on...".
3. Select `manifest.json` from this project folder.

Note: A sample `browser_specific_settings.gecko.id` is provided in the manifest for Firefox development.

## Standalone testing (no extension)

You can open the UI directly:

1. Open `popup.html` in a normal browser tab (via `file://` or a local server).
2. The app will automatically fall back to `localStorage` for data.
3. Sizing is fluid in this mode; when loaded as an extension, the popup uses a fixed size for ergonomics.

## Notes

- Timers are computed from saved `elapsedMs` + current running span (`Date.now() - startedAt`). No background script is required.
- All data is stored under the key `tasks_v1` in extension storage; in standalone mode, keys are stored in `localStorage`.
- The last selected tab is remembered across sessions.
- In extension popup mode, the document gets an `is-extension` class to constrain width/height.
- This project purposefully avoids external fonts/libraries to keep the bundle small and fast.

## Future ideas

- Option to enforce only one running timer at a time
- Categories/labels and filtering
- Keyboard shortcuts
- Cloud sync option (with opt-in)
