# Repository Guidelines

## Structure and hosting

- HTML tools live at the repo root as standalone files.
- Tools are single-file HTML pages with all CSS/JS inline; no build step or asset pipeline.
- Avoid frameworks that require a build step; keep files copy/paste friendly and portable.
- Tools are self-hosted (e.g., GitHub Pages).
- File names are hyphenated and descriptive (e.g., html-text-extractor.html).
- Tools are typically matched with a .docs.md file providing concise documentation.

## Layout and UX

- Common layout is a centered content column with a max-width (often 600–900px) and simple padding.
- Copy/paste is a core UX pattern; add clipboard buttons and leverage rich clipboard data.
- Use <input type="file"> to read files in-browser; no uploads needed.
- Offer downloads for generated outputs (images, CSV, ICS, etc.).
- For WebSocket tools, include clear connect/disconnect controls and status messaging.

## Dependencies and platform

- Prefer minimal external dependencies; when needed, load them from CDNs with explicit versions.
- Prefer CORS-enabled public APIs; avoid server-side proxies.
- LLM APIs can be called directly via CORS but require user-supplied keys stored locally.
- Use Pyodide/WebAssembly to run Python or other tooling in the browser.
- Use simple DOM updates via innerHTML/textContent or toggling style.display.

## Data, safety, and state

- Persist shareable state in the URL; use localStorage for larger state or secrets like API keys.
- Keep API keys out of the tool unless the API is public and safe for client-side use.
- Validate input before processing or network requests.

## Tooling culture

- Build debugging tools to discover browser capabilities (clipboard, keyboard, CORS, EXIF).
- Remix existing tools as starting points; reuse proven patterns and code.
- Record prompts/transcripts to improve future tool-building and document provenance.
