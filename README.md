# JuiceQu

> Website e-commerce toko juice dengan integrasi AI untuk pengalaman berbelanja yang personal dan efisien.

## Screenshots

<!-- TODO: Add screenshots before submission -->
| Home | Menu | Chatbot |
|------|------|---------|
| ![Home](./docs/screenshots/home.png) | ![Menu](./docs/screenshots/menu.png) | ![Chatbot](./docs/screenshots/chatbot.png) |

| POS Kasir | Admin Dashboard |
|-----------|-----------------|
| ![POS](./docs/screenshots/pos.png) | ![Admin](./docs/screenshots/admin.png) |

## Demo

- **Live URL**: [https://juicequ.web.app](https://juicequ.web.app) <!-- TODO: Update after deploy -->
- **Video Demo**: [YouTube Link](https://youtube.com/...) <!-- TODO: Add video link -->

---

## Features

### Pembeli (Customer)
- Pemesanan online dengan pre-order
- AI Chatbot (tanya produk, nutrisi, rekomendasi)
- Voice ordering
- Review produk
- AI Fotobooth
- Loyalty program

### Kasir
- POS dengan voice input
- Laporan penjualan
- Manajemen stok
- AI Assistant

### Admin
- Manajemen produk & kategori
- Manajemen user & role
- Manajemen promo
- Analytics & monitoring

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Python 3.11+, FastAPI, SQLAlchemy |
| Database | Google Cloud SQL (PostgreSQL) |
| AI/LLM | Kolosal AI API, ChromaDB |
| Voice | Google Cloud Speech-to-Text |
| Storage | Google Cloud Storage |
| Deploy | Google Cloud Run |

---

## Project Structure

```
juicequ/
├── backend/          # Python FastAPI Backend
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── models/   # Database models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── core/     # Auth, security
│   └── alembic/      # Migrations
│
├── frontend/         # Next.js 14 Frontend
│   └── src/
│       ├── app/      # Pages (App Router)
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── stores/
│
├── docs/             # Documentation & screenshots
└── infra/            # Infrastructure configs
```

---

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (atau Docker)
- Google Cloud account (untuk STT & Storage)
- Kolosal AI API key

### Step 1: Clone Repository
```bash
git clone https://github.com/[username]/juicequ.git
cd juicequ
```

### Step 2: Backend Setup
```powershell
# Masuk ke folder backend
cd backend

# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment (Windows)
.\venv\Scripts\Activate.ps1

# Atau untuk Linux/Mac
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
# Edit .env dengan credentials Anda

# Jalankan database migrations
alembic upgrade head

# (Optional) Seed data demo
python scripts/seed_db.py

# Jalankan server
uvicorn app.main:app --reload --port 8000
```

Backend akan berjalan di: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### Step 3: Frontend Setup
```powershell
# Buka terminal baru, masuk ke folder frontend
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env.local
# Edit .env.local

# Jalankan development server
npm run dev
```

Frontend akan berjalan di: `http://localhost:3000`

### Step 4: (Optional) Docker
```powershell
# Jalankan semua services dengan Docker
docker-compose up -d
```

---

## Environment Variables

### Backend (`backend/.env`)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/juicequ

# JWT Authentication
JWT_SECRET_KEY=your-super-secret-key-min-32-characters
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Kolosal AI
KOLOSAL_API_KEY=your-kolosal-api-key
KOLOSAL_API_URL=https://api.kolosal.ai/v1
KOLOSAL_MODEL=qwen-3-30b

# Google Cloud
GOOGLE_CLOUD_PROJECT=your-gcp-project
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
GCS_BUCKET_NAME=juicequ-assets
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## API Documentation

Setelah backend berjalan, akses API docs di:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Main Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user baru |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/products` | List produk |
| POST | `/api/v1/orders` | Buat pesanan |
| POST | `/api/v1/ai/chat` | Chat dengan AI |
| POST | `/api/v1/ai/voice` | Voice input |

---

## Usage Guide

### Untuk Pembeli
1. Buka website di browser
2. Browse menu juice yang tersedia
3. Gunakan chatbot untuk bertanya tentang produk/nutrisi
4. Atau gunakan voice ordering: klik icon mic, ucapkan pesanan
5. Tambah ke keranjang dan checkout

### Untuk Kasir
1. Login dengan akun kasir
2. Akses POS di `/pos`
3. Input pesanan manual atau via voice
4. Konfirmasi dan selesaikan pesanan

### Untuk Admin
1. Login dengan akun admin
2. Akses dashboard di `/admin`
3. Kelola produk, user, dan promo
4. Lihat analytics dan laporan

---

## Accessibility

Project ini mengikuti **WCAG 2.1 Level AA**:
- Semantic HTML
- Keyboard navigation
- Screen reader compatible
- Color contrast 4.5:1+
- Focus indicators
- Skip links

---

## Additional Documentation

- [INSTRUCTIONS.md](./INSTRUCTIONS.md) - Dokumentasi lengkap
- [RULES.md](./RULES.md) - Coding standards
- [EXECUTION_PLAN.md](./EXECUTION_PLAN.md) - Implementation plan
- [HACKATHON_RULES.md](./HACKATHON_RULES.md) - Scoring criteria

---

## License

MIT License - see [LICENSE](./LICENSE)

## Team

- [Your Name] - Full Stack Developer

---

Built for Hackathon 2025
