# Frontend (React UI)

This folder contains the React single-page application for Astrologi-AI.

## Getting started

```bash
npm install
cp .env.example .env   # optional: configure custom API base URL
npm run dev
```

The development server proxies API requests to `http://localhost:5000/api` by default. If you are running the backend elsewhere, update `VITE_API_BASE_URL` inside `.env` accordingly.

### Uygulama Sekmeleri

- **Home** — Günlük içgörü ve yıllık öngörü formları.
- **Bond** — İki kişilik sinastri raporu için doğum bilgilerini toplar.
- **Story Studio** — Doğum bilgilerini ve temayı kullanarak kart/hikâye isteyen istek gönderir.
- **AI Chat** — Pluto sohbet API'si ile mesajlaşmanı sağlar.
- **Profil** — Kullanıcı bilgilerinin ve tercihlerin yönetildiği statik arayüz.
