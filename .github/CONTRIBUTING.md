# Contributing

Thanks for your interest in improving Room to Speak.

## Getting started
1. Fork the repo and branch from `main`: `git checkout -b feat/your-change`
2. Install with Node 22+: `npm ci`
3. For real detection locally, copy the env template and add your own key: `cp .env.example .env.local`, then set `GEMINI_API_KEY`. `.env*` files are gitignored; never commit a key.
4. Start the dev server: `npm run dev` and open http://localhost:5173

## Before you open a pull request
- `npm run typecheck` and `npm test` pass. Neither needs a key.
- `npm run e2e` passes. It builds the app, then runs the Playwright specs with detection and the device voice stubbed.
- Behaviour changes come with a test. A bug fix gets a regression test named for the bug.
- Commits use the conventional style: `feat:`, `fix:`, `docs:`, `test:`, `chore:`.

## Photos and privacy
Room to Speak is used inside someone's home. Please don't attach photos of a real person's room, face or papers to issues or pull requests. Describe the scene, or use one of the AI-generated example rooms in `public/samples/`.

## Reporting bugs and requesting features
Open an issue with one of the templates. For a security problem, follow [SECURITY.md](SECURITY.md) instead of opening an issue.
