# JuiceQu

Website e-commerce toko juice dengan integrasi AI untuk pengalaman berbelanja yang personal dan efisien.

---

## Daftar Isi

- [Screenshots](#screenshots)
- [Demo](#demo)
- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Struktur Folder](#struktur-folder)
- [Instalasi](#instalasi)
- [Cara Penggunaan](#cara-penggunaan)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)

---

## Screenshots

| Home | Menu | Chatbot |
|------|------|---------|
| ![Home](./docs/screenshots/home.png) | ![Menu](./docs/screenshots/menu.png) | ![Chatbot](./docs/screenshots/chatbot.png) |

| POS Kasir | Admin Dashboard |
|-----------|-----------------|
| ![POS](./docs/screenshots/pos.png) | ![Admin](./docs/screenshots/admin.png) |

---

## Demo

- **Live URL**: [https://juicequ.app](https://juicequ.app)
- **Video Demo**: [YouTube Link](https://youtube.com/...)

---

## Fitur

### Pembeli (Customer)
- Pemesanan online dengan sistem pre-order
- AI Chatbot untuk tanya produk, nutrisi, dan rekomendasi
- Voice ordering dengan dukungan multi-bahasa (Indonesia, English, Jawa, Sunda)
- Review produk dengan AI Fotobooth
- Multi-currency support (IDR, USD)

### Kasir
- POS (Point of Sale) dengan voice input
- Laporan penjualan harian
- Manajemen stok realtime
- AI Assistant untuk membantu transaksi

### Admin
- Manajemen produk dan kategori
- Manajemen user dan role (admin, kasir, customer)
- Manajemen promo dan diskon
- Analytics dan monitoring
- Pengaturan toko (jam operasional, pembayaran, dll)

### Sistem AI
- Multi-Agent RAG Architecture
- Intent Router untuk deteksi maksud pengguna
- Product Agent untuk informasi dan rekomendasi produk
- Order Agent untuk pemesanan via chat/voice
- Navigation Agent untuk navigasi halaman
- Guard Agent untuk menjaga konteks domain toko

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Zustand |
| Backend | Python 3.12+, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL / SQLite |
| AI/LLM | Kolosal AI API, ChromaDB (Vector DB) |
| Voice | Google Cloud Speech-to-Text |
| Authentication | JWT, Google OAuth 2.0, CSRF Protection |
| Storage | Local VPS Storage |
| Deploy | VPS / Docker / Cloud Run |

---

## Struktur Folder

```
juicequ/
├── backend/                    # Python FastAPI Backend
│   ├── app/
│   │   ├── api/               # API endpoints
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   │           ├── admin/     # Admin endpoints
│   │   │           ├── cashier/   # Kasir endpoints
│   │   │           └── customer/  # Customer endpoints
│   │   ├── core/              # Auth, security, middleware
│   │   ├── db/                # Database config & seeding
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── services/          # Business logic
│   │       └── ai/            # AI services
│   │           ├── agents/    # Multi-Agent system
│   │           │   ├── base.py
│   │           │   ├── guard_agent.py
│   │           │   ├── navigation_agent.py
│   │           │   ├── orchestrator.py
│   │           │   ├── order_agent.py
│   │           │   ├── product_agent.py
│   │           │   └── router.py
│   │           ├── locales/   # STT language config
│   │           ├── kolosal_client.py
│   │           ├── rag_service.py
│   │           └── stt_service.py
│   ├── alembic/               # Database migrations
│   ├── scripts/               # Utility scripts
│   └── requirements.txt
│
├── frontend/                   # Next.js 15 Frontend
│   └── src/
│       ├── app/               # Pages (App Router)
│       │   ├── admin/         # Admin pages
│       │   ├── cashier/       # Kasir pages
│       │   ├── cart/
│       │   ├── checkout/
│       │   ├── menu/
│       │   └── ...
│       ├── components/        # React components
│       │   ├── admin/
│       │   ├── cart/
│       │   ├── home/
│       │   ├── layout/
│       │   ├── products/
│       │   └── ui/
│       ├── hooks/             # Custom React hooks
│       ├── lib/               # Utilities & API clients
│       │   └── api/           # API service modules
│       ├── locales/           # i18n translations (id, en, jv, su)
│       ├── store/             # Zustand stores
│       └── types/             # TypeScript types
│
├── docs/                       # Documentation & screenshots
│   └── screenshots/
│
├── infra/                      # Infrastructure configs
│   ├── cloudbuild.yaml
│   └── docker/
│
├── .env.example               # Environment template
├── docker-compose.yml
├── LICENSE
└── README.md
```

---

## Instalasi

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (atau SQLite untuk development)
- Kolosal AI API key
- (Optional) Google Cloud account untuk Speech-to-Text
- (Optional) Google OAuth credentials untuk login dengan Google

### Langkah 1: Clone Repository

```bash
git clone https://github.com/[username]/juicequ.git
cd juicequ
```

### Langkah 2: Setup Backend

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

# Copy environment file dan sesuaikan konfigurasi
copy .env.example .env
# Edit file .env dengan credentials Anda

# Jalankan database migrations
alembic upgrade head

# (Optional) Seed data demo
python scripts/seed_all.py

# Jalankan server
uvicorn app.main:app --reload --port 8000
```

Backend akan berjalan di: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### Langkah 3: Setup Frontend

```powershell
# Buka terminal baru, masuk ke folder frontend
cd frontend

# Install dependencies
npm install

# Copy environment file dan sesuaikan konfigurasi
copy .env.example .env.local
# Edit file .env.local

# Jalankan development server
npm run dev
```

Frontend akan berjalan di: `http://localhost:3000`

### Langkah 4: (Optional) Docker

```powershell
# Jalankan semua services dengan Docker
docker-compose up -d
```

---

## Cara Penggunaan

### Untuk Pembeli

1. Buka website di browser (`http://localhost:3000`)
2. Browse menu juice yang tersedia di halaman Menu
3. Gunakan chatbot untuk bertanya tentang produk atau nutrisi
4. Atau gunakan voice ordering: klik icon microphone, ucapkan pesanan dalam bahasa Indonesia, Inggris, Jawa, atau Sunda
5. Tambah produk ke keranjang dan lakukan checkout
6. Login dengan email atau akun Google untuk melanjutkan pemesanan

### Untuk Kasir

1. Login dengan akun kasir
2. Akses POS di halaman `/cashier/pos`
3. Input pesanan manual atau via voice
4. Kelola transaksi dan lihat laporan penjualan

### Untuk Admin

1. Login dengan akun admin
2. Akses dashboard di halaman `/admin`
3. Kelola produk, kategori, dan user
4. Atur promo dan pengaturan toko
5. Lihat analytics dan laporan

### Contoh Perintah Voice/Chat

| Perintah | Aksi |
|----------|------|
| "Tampilkan menu" | Navigasi ke halaman menu |
| "Rekomendasi jus yang segar" | Menampilkan rekomendasi produk |
| "Tambahkan Berry Blast ke keranjang" | Menambah produk ke cart |
| "Apa yang paling laris?" | Menampilkan produk bestseller |
| "Checkout" | Navigasi ke halaman checkout |
| "Berapa harga Tropical Paradise?" | Memberikan informasi harga |

---

## Kontribusi

Kami menyambut kontribusi dari siapa saja. Berikut langkah-langkah untuk berkontribusi:

### Langkah Kontribusi

1. **Fork** repository ini
2. **Clone** fork Anda ke lokal
   ```bash
   git clone https://github.com/[username-anda]/juicequ.git
   cd juicequ
   ```
3. **Buat branch** untuk fitur atau perbaikan
   ```bash
   git checkout -b feature/nama-fitur
   ```
4. **Lakukan perubahan** dan pastikan:
   - Kode mengikuti style guide yang ada
   - Tidak ada dead code atau console.log yang tidak perlu
   - Semua tests passing (jika ada)
   - Linter tidak menampilkan error
5. **Commit** dengan pesan yang jelas
   ```bash
   git commit -m "feat: menambahkan fitur X"
   ```
6. **Push** ke fork Anda
   ```bash
   git push origin feature/nama-fitur
   ```
7. **Buat Pull Request** ke branch `main` repository utama

### Konvensi Commit

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Fitur baru
- `fix:` - Perbaikan bug
- `docs:` - Perubahan dokumentasi
- `style:` - Formatting, tidak ada perubahan kode
- `refactor:` - Refactoring kode
- `test:` - Menambah atau memperbaiki tests
- `chore:` - Maintenance tasks

### Code Style

- **Frontend**: ESLint + Prettier (otomatis via npm run lint)
- **Backend**: Ruff/Black formatter
- Penamaan variabel dalam bahasa Inggris
- Komentar seperlunya, jelaskan "why" bukan "what"

---

## Accessibility

Project ini mengikuti standar **WCAG 2.1 Level AA**:

- Semantic HTML
- Keyboard navigation
- Screen reader compatible
- Color contrast 4.5:1+
- Focus indicators
- Skip links

---

## Lisensi

MIT License - lihat file [LICENSE](./LICENSE)

---

Built for Hackathon 2025
