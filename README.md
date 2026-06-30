# Glovo Menu Ingestion Prototype

Next.js prototype for AI-assisted restaurant menu ingestion, review, and export.

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add at least one provider key to `.env.local`:

- `GEMINI_API_KEY` for Gemini models
- `ANTHROPIC_API_KEY` for Claude models

Then open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run build
```

## Deploying to Vercel

Import this GitHub repository into Vercel as a Next.js project. The repository root is the app root.

Use the default install and build settings:

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: Next.js default

Set these environment variables in Vercel for Production and Preview:

- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`

The app pins Node.js to `22.x` in `package.json` so Vercel builds and serverless API routes use a compatible runtime.
