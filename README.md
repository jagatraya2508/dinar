# Dinar Seafood — Website

Website profil restoran **Dinar Seafood**, seafood dengan cita rasa khas Makassar, berlokasi di Pluit, Jakarta Utara. Berdiri sejak 2002.

## Cara Menjalankan (Lokal)

Butuh Python 3.10 atau lebih baru.

```bash
python server.py
```

Server berjalan di `http://127.0.0.1:8765`. Panel admin di `http://127.0.0.1:8765/admin`.

Login pertama: `admin` / `dinar2026`. Ganti password setelah masuk.

## Deploy ke Server Linux

Pilih salah satu:

```bash
# Opsi Docker
curl -fsSL https://raw.githubusercontent.com/jagatraya2508/dinar/main/scripts/deploy-docker.sh | sudo bash

# Opsi PM2
curl -fsSL https://raw.githubusercontent.com/jagatraya2508/dinar/main/scripts/deploy-pm2.sh | sudo bash
```

## Struktur Project

```
├── index.html              # Halaman utama
├── server.py               # Python HTTP server + REST API
├── data/content.json       # Konten website (dikelola via admin)
├── admin/                  # Panel admin
├── assets/web/             # Foto dan aset
├── css/style.css
├── js/site.js
├── scripts/
│   ├── deploy-docker.sh
│   └── deploy-pm2.sh
└── .github/workflows/
    └── deploy.yml          # CI/CD GitHub Actions
```

## CI/CD

Setiap push ke branch `main` akan otomatis deploy ke server via GitHub Actions self-hosted runner.
