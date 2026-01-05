# Checkmate — QR-based attendance (Frontend)

This repository contains the frontend for "Checkmate", a small React + Vite single-page app that demonstrates QR-based session creation (organizer) and QR scanning (participant).

What this repo includes
- Organizer view: create a session string and generate a QR image to present to participants (`src/pages/Organizer.jsx`).
- Participant/Scan view: scan a QR code using the device camera (`src/pages/Scan.jsx`) via `html5-qrcode`.
- Small UI components and styling in `src/`.

Tech stack
- React 19 (JSX)
- Vite dev server and build
- html5-qrcode for camera-based scanning
- qrcode for QR image generation (data URLs)

Quick start (Windows / PowerShell)

1. Install dependencies

```powershell
npm install
```

2. Start dev server

```powershell
npm run dev
```

3. Open your browser at the address printed by Vite (usually http://localhost:5173)

Usage notes
- To create a session QR: open the Organizer page, enter an optional session name or leave blank, then click "Create Session & Generate QR". A QR image will appear which you can download.
- To scan a session QR: open the Scan page (the app uses `html5-qrcode`). Allow camera access when prompted. When a valid QR is decoded, the scanned text is shown in the console and via an alert (the project currently alerts with the decoded text).

Files of interest
- `src/pages/Organizer.jsx` — Organizer dashboard and QR generation UI.
- `src/pages/Scan.jsx` — QR scanning logic using `html5-qrcode` (already working).
- `src/App.jsx` and `src/main.jsx` — app wiring and routing.
- `package.json` — scripts and dependencies.

Available scripts
- `npm run dev` — start Vite development server
- `npm run build` — produce production build
- `npm run preview` — preview production build
- `npm run lint` — run ESLint

Small notes about the QR features
- Scanning: implemented with `html5-qrcode` in `src/pages/Scan.jsx`. The scanner renders into an element with id `qr-reader` and calls back with the decoded text.
- Generation: implemented using the `qrcode` package which produces a data URL image. The Organizer UI now exposes a session name input, a generate button, and displays the resulting QR (with a download link).

Recommendations & possible improvements
1. Improve UX
	- Replace the alert on successful scan with an in-app confirmation modal and a friendly checkmark animation.
	- Show scan history and allow organizer to see who scanned (requires backend).

2. Add a small backend or serverless API
	- A backend to create and store sessions, issue signed/short-lived tokens, and record attendance would make the system production-ready.
	- QR payloads should be signed or session IDs mapped server-side to prevent spoofing.

3. TypeScript
	- Add TypeScript for stronger typing and better IDE support.

4. Tests & CI
	- Add unit tests for components (React Testing Library + Vitest/Jest) and wire up GitHub Actions for builds and tests.

5. Accessibility & mobile
	- Ensure inputs and buttons are accessible (labels, aria-*) and test scanner UI on a variety of mobile devices.

6. Linting & formatting
	- Enforce consistent code style with Prettier and extend ESLint rules to cover best practices.

7. Security
	- Avoid placing sensitive info in QR payloads. If you must, encrypt or sign the payload.

8. Performance & production
	- Optimize bundle sizes, lazy-load pages (scan page can be lazy), and consider offline strategies if needed.

If you'd like, I can:
- wire up a minimal backend (Express or serverless function) to create session IDs and verify scans; or
- add TypeScript conversions for a single page; or
- implement a nicer scan-result UI and persist scans locally.

Contact/Contributing
If you want me to make any of the improvements above or to adjust the README further, tell me which item to prioritize and I’ll implement it next.

---
Small verification performed in this edit session
- Implemented QR generation in `src/pages/Organizer.jsx` using the `qrcode` package and added the package to `package.json`.
- Please run `npm install` locally and then `npm run dev` to verify everything on your machine.
