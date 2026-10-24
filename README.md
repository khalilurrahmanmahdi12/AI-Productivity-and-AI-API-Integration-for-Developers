# DevPulse AI — AI Productivity & AI API Integration for Developers 🚀

![Hacktiv8 Certified](https://img.shields.io/badge/Certified-Hacktiv8_Indonesia-EA580C?logo=academia&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-API_Integration-4285F4?logo=google&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?logo=tailwindcss&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![GitHub REST API](https://img.shields.io/badge/GitHub_REST_API-Live_Inspector-181717?logo=github&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green.svg)

**DevPulse AI** adalah aplikasi web cerdas berbasis Artificial Intelligence (NLP / LLM) yang dirancang dan dibangun oleh **KHALILURRAHMAN MAHDI** sesuai dengan standar kompetensi sertifikasi **Maju bareng AIx Hacktiv8 Indonesia**: *"AI Productivity and AI API Integration for Developers"*.

Aplikasi ini memberikan kendali penuh kepada pengembang untuk mengonfigurasi parameter AI secara kreatif (persona, domain spesifik, dan kreativitas suhu), mengelola memori percakapan berkesinambungan (*multi-turn memory*), serta mengintegrasikan berbagai **API Eksternal** secara *real-time* (seperti GitHub REST API, Weather & Timezone API, HackerNews Feed, dan In-Chat JavaScript Code Sandbox) dalam antarmuka web modern yang bersih, antislop, dan responsif.

---

## 🚀 Live Demo & Kode Sumber

- 📜 **Sertifikat Kompetensi Hacktiv8**: https://students.hacktiv8.com/certificates/c2c97ee5-03d5-4c03-b600-60b41d7c123e
- 💻 **Local Host**: `http://localhost:3000` (atau `http://localhost:5173`)
- 📁 **Repository**: [https://github.com/khalilurrahmanmahdi12/AI-Productivity-and-AI-API-Integration-for-Developers](https://github.com/khalilurrahmanmahdi12/AI-Productivity-and-AI-API-Integration-for-Developers)
- 💼 **Portofolio**: [https://khalildev.web.id/](https://khalildev.web.id/)

---

## ✨ Fitur Utama

### 🎯 1. Parameter Kreatif & Kustomisasi Persona AI
Pusat pengaturan perilaku model AI sesuai kebutuhan spesifik pengembang:
- **Pilihan Gaya Bahasa & Persona AI**:
  - 🧠 **Tech Lead / Senior Mentor**: Menghasilkan jawaban mendalam, terstruktur, dan berorientasi pada *clean code* serta *best practices*.
  - ☕ **Santai / Casual Peer Dev**: Gaya komunikasi sejawat yang ramah, santai, dan solutif.
  - ⚡ **Code Optimizer**: Jawaban ringkas, to-the-point, dan berfokus pada efisiensi algoritma (Big-O Notation).
  - 📜 **Formal & Structured**: Bahasa Indonesia baku dengan poin-poin sistematis dan dokumentasi rapi.
  - 👶 **ELI5 (Explain Like I'm 5)**: Menyederhanakan konsep arsitektur rumit dengan analogi dunia nyata.
- **Domain Pengetahuan Spesifik**:
  - 🌐 *Web Development & Full-Stack* (React, Node.js, TypeScript, Tailwind)
  - 📊 *Data Science & AI/ML* (Python, PyTorch, SQL, Prompt Engineering)
  - ☁️ *DevOps & Cloud Architecture* (Docker, Kubernetes, CI/CD, AWS)
  - 🏛️ *System Design & Security* (Microservices, Scalability, Caching, OWASP)
  - 💼 *Career & Productivity* (Code Review, Portfolio, Workflow Tools)
- **Temperature & Creativity Slider**: Pengaturan fleksibel dari 0.0 (sangat presisi/deterministik) hingga 1.0 (kreatif/eksploratif).

### 🧠 2. Manajemen Memori Konteks Percakapan (Conversation Memory)
- Menjaga keutuhan riwayat dialog multi-putaran (*multi-turn context awareness*).
- Indikator status memori aktif pada antarmuka pengguna.
- Tombol *Reset Memory* untuk membersihkan riwayat percakapan secara instan ketika beralih konteks bahasan.

### 🔌 3. Integrasi Live External Tools & API Real-Time
1. 🐙 **GitHub REST API Inspector**: Mengambil informasi repositori publik secara langsung (jumlah bintang, fork, open issues, lisensi) serta profil pengembang.
2. 🌤️ **Live Weather & Timezone API**: Memantau cuaca dan waktu lokal di berbagai pusat teknologi dunia (Jakarta, Nusantara/Kalimantan, Tokyo, San Francisco, London).
3. 📰 **HackerNews Developer Feed**: Mengambil tren berita teknologi terkini langsung dari HackerNews API.
4. 🧪 **In-Chat JavaScript Code Sandbox**: Menjalankan snippet kode JavaScript secara aman langsung di dalam UI percakapan dengan penangkap log konsol (*console capture*).

### ⚡ 4. Developer Productivity Toolkit
- 📝 **Preset Template Prompt Quick Action**: Shortcut perintah siap pakai (*Refactor Code, React Hooks, GitHub Search, Tech News*).
- 📂 **Ekspor Riwayat Percakapan**: Mengunduh seluruh dialog ke format **Markdown (.md)** atau **JSON (.json)** untuk dokumentasi.
- 🎤 **Voice Input (Speech-to-Text)**: Mendukung input pertanyaan menggunakan suara secara praktis.
- 🎨 **Code Syntax Highlighting**: Pewarnaan sintaksis kode otomatis menggunakan Prism.js.
- 🔑 **Dual-Engine Model Architecture**: Mendukung Google Gemini API Key secara langsung, dan dilengkapi *Smart Fallback Engine* bawaan saat berjalan tanpa API key.

---

## 🏗️ Visualisasi Arsitektur Pipeline & Integrasi API

Alur orkestrasi pemrosesan pesan dan eksekusi tool eksternal:

```text
[1. User Interface / Chat Input]
       │
       ├─────────────────────────────────────────────┐
       ↓ (Prompt / Pertanyaan)                       ↓ (Tool Trigger / API Command)
[2. DevPulse AI Core Engine]                 [3. External API Gateway]
       │                                             ├── 🐙 GitHub REST API
       │ (System Prompt + Persona + Memory)          ├── 🌤️ OpenWeather & Timezone API
       ↓                                             ├── 📰 HackerNews Tech Feed
[4. Model Service (Gemini / Smart Fallback)]         └── 🧪 In-Chat JS Code Sandbox
       │                                                     │
       └──────────────────────┬──────────────────────────────┘
                              ↓
              [5. Context Merger & Formatter]
                              ↓
       [6. Markdown Rendering, Code Highlights, & UI Response]
```

---

## 📱 Desain Responsif & Antislop UI

Aplikasi ini mengadopsi prinsip desain antislop modern standar alat pengembang profesional (terinspirasi dari Linear.app dan Vercel):
- **Estetika Minimalis & Fokus**: Memadukan tema gelap/terang modern dengan palet warna netral dan aksen biru pengembang.
- **Tipografi Bersih**: Tipografi sans-serif modern yang dipadukan dengan font monospace untuk blok kode program.
- **Tata Letak Mobile-First**:
  - Modal konfigurasi parameter otomatis menyesuaikan ukuran layar tanpa merusak proporsi kontrol.
  - Eksekutor sandbox JavaScript dan kartu respons API eksternal responsif di perangkat desktop, tablet, maupun ponsel pintar.

---

## 🛠️ Teknologi yang Digunakan

- **Vite 5.4** (Next Generation Frontend Tooling)
- **Vanilla JavaScript (ES6+)**
- **Tailwind CSS** (Utility-First CSS Framework)
- **Google Gemini API** (Generative AI Integration)
- **GitHub REST API v3**
- **Open-Meteo & Timezone API**
- **HackerNews Firebase REST API**
- **Prism.js** (Code Syntax Highlighting)

---

## 🚀 Menjalankan Project

### 1. Clone Repositori
```bash
git clone https://github.com/khalilurrahmanmahdi12/AI-Productivity-and-AI-API-Integration-for-Developers.git
cd AI-Productivity-and-AI-API-Integration-for-Developers
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Jalankan Development Server
```bash
npm run dev
```
Buka browser pada alamat yang tertera (biasanya `http://localhost:5173` atau `http://localhost:3000`).

### 4. Build untuk Production
```bash
npm run build
```

---

## 📂 Struktur Utama Project

```text
AI-Productivity-and-AI-API-Integration-for-Developers/
├── index.html                  # Dokumen HTML Utama
├── package.json                # Metadata dependensi & skrip proyek
├── vite.config.js              # Konfigurasi bundler Vite
├── tailwind.config.js          # Konfigurasi Tailwind CSS
├── README.md                   # Dokumentasi teknis proyek
└── src/
    ├── main.js                 # Logika utama aplikasi & event listeners
    ├── style.css               # Definisi styling Tailwind & custom styling
    ├── components/
    │   └── PromptTemplates.js  # Preset prompt siap pakai untuk developer
    └── services/
        ├── aiService.js        # Integrasi Google Gemini API & Fallback Engine
        └── externalApis.js     # Handler GitHub API, Weather, News & Sandbox
```

---

## 📌 Status Project

- ✅ Pengaturan Parameter AI Kreatif (Persona, Domain, Temperature)
- ✅ Sistem Memori Percakapan Multi-Turn Berkesinambungan
- ✅ Integrasi GitHub REST API untuk Inspeksi Repositori & Profil
- ✅ Integrasi Cuaca & Zona Waktu Global secara Real-Time
- ✅ Feed Berita Teknologi Terkini dari HackerNews API
- ✅ In-Chat JavaScript Code Sandbox Executor Aman
- ✅ Ekspor Percakapan ke Format Markdown (.md) dan JSON (.json)
- ✅ Input Perintah Suara (Speech-to-Text)
- ✅ 100% Responsif di Layar Desktop, Tablet, & Smartphone
- ✅ Verifikasi dan Kepatuhan Kurikulum Sertifikasi Hacktiv8 Indonesia

---

## 👨💻 Developer & Creator

**KHALILURRAHMAN MAHDI**  
*Software Engineer - Full Stack Developer*  
Hacktiv8 Certified: *AI Productivity and AI API Integration for Developers*

- 📜 **Sertifikat Kelulusan**: [students.hacktiv8.com/certificates/c2c97ee5-03d5-4c03-b600-60b41d7c123e](https://students.hacktiv8.com/certificates/c2c97ee5-03d5-4c03-b600-60b41d7c123e)
- 🔗 **GitHub**: [github.com/khalilurrahmanmahdi12](https://github.com/khalilurrahmanmahdi12)
- 💼 **Portofolio**: [https://khalildev.web.id/](https://khalildev.web.id/)
- 📁 **Project Repository**: [AI-Productivity-and-AI-API-Integration-for-Developers](https://github.com/khalilurrahmanmahdi12/AI-Productivity-and-AI-API-Integration-for-Developers)

---

## 📄 Lisensi & Dukungan

Proyek ini dilisensikan di bawah **MIT License**.  
Jika proyek ini bermanfaat bagi produktivitas Anda, jangan lupa berikan ⭐ pada repositori ini!
