# Astrologi-AI

Modern bir Flask + React mimarisine sahip Astrologi-AI projesi. Backend tarafında Flask tabanlı bir REST API, frontend tarafında ise Vite ile yapılandırılmış React uygulaması bulunur.

## Proje yapısı

```
Astrologi-AI/
├── backend/          # Flask API kaynak kodu
├── frontend/         # React kullanıcı arayüzü
├── .gitignore
└── README.md
```

## Kurulum

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows için .venv\Scripts\activate
pip install -r requirements.txt
flask --app wsgi run --debug
```

### Frontend

```bash
cd frontend
cp .env.example .env # isteğe bağlı, API tabanı yapılandırması için
npm install
npm run dev
```

Geliştirme sırasında frontend proxy ayarı sayesinde `/api` istekleri otomatik olarak `http://localhost:5000` adresine yönlendirilir.

## Testler

Backend, horoscope yardımcı fonksiyonları ve API uç noktası için pytest tabanlı bir test seti içerir. Sanal ortamı aktifleştirdikten sonra aşağıdaki komut ile testleri çalıştırabilirsiniz:

```bash
cd backend
pytest
```
