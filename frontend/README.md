# Frontend (React UI)

This folder contains the React single-page application for Astrologi-AI.

## Getting started

```bash
npm install
cp .env.example .env   # optional: configure custom API base URL
npm run dev
```

The development server proxies API requests to `http://localhost:5000/api` by default. If you are running the backend elsewhere, update `VITE_API_BASE_URL` inside `.env` accordingly.
