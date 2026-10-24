#!/usr/bin/env bash
# deploy-pm2.sh — Deploy manual Dinarweb dengan PM2
# Jalankan sebagai root atau user dengan sudo: bash deploy-pm2.sh

set -e

APP_DIR="/srv/dinarweb"
REPO_URL="https://github.com/jagatraya2508/dinar.git"
APP_PORT="8765"
APP_USER="dinar"
LOG_DIR="/var/log/dinarweb"

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()    { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

# ── 1. Cek root ──────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  fail "Script ini harus dijalankan sebagai root. Coba: sudo bash deploy-pm2.sh"
fi

echo ""
echo "============================================"
echo "  Deploy Dinarweb — PM2"
echo "============================================"
echo ""

# ── 2. Install Python3 jika belum ada ────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  info "Menginstall Python3..."
  apt-get update -qq
  apt-get install -y python3
fi
info "Python: $(python3 --version)"

# ── 3. Install Node.js jika belum ada ────────────────────────────────────────
if ! command -v node &>/dev/null; then
  info "Menginstall Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
info "Node: $(node --version)"

# ── 4. Install PM2 jika belum ada ────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  info "Menginstall PM2..."
  npm install -g pm2
fi
info "PM2: $(pm2 --version)"

# ── 5. Buat user aplikasi jika belum ada ─────────────────────────────────────
if ! id "$APP_USER" &>/dev/null; then
  info "Membuat user $APP_USER..."
  useradd -r -s /bin/bash -m -d "$APP_DIR" "$APP_USER"
fi

# ── 6. Siapkan direktori ──────────────────────────────────────────────────────
info "Menyiapkan direktori..."
mkdir -p "$APP_DIR/data" "$APP_DIR/assets/web/uploads" "$LOG_DIR"

# ── 7. Clone atau pull kode ───────────────────────────────────────────────────
if [[ -d "$APP_DIR/.git" ]]; then
  info "Repo sudah ada. Menarik kode terbaru..."
  TMP_DIR=$(mktemp -d)
  git clone "$REPO_URL" "$TMP_DIR"
  rsync -a --delete \
    --exclude='.git' \
    --exclude='data/admin.json' \
    --exclude='assets/web/uploads/' \
    "$TMP_DIR/" "$APP_DIR/"
  rm -rf "$TMP_DIR"
else
  info "Mengkloning repo ke $APP_DIR..."
  TMP_DIR=$(mktemp -d)
  git clone "$REPO_URL" "$TMP_DIR"
  rsync -a \
    --exclude='.git' \
    --exclude='data/admin.json' \
    --exclude='assets/web/uploads/' \
    "$TMP_DIR/" "$APP_DIR/"
  rm -rf "$TMP_DIR"
  info "Kode berhasil dikloning."
fi

# ── 8. Atur kepemilikan file ──────────────────────────────────────────────────
chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$LOG_DIR"

# ── 9. Jalankan atau reload PM2 ───────────────────────────────────────────────
if sudo -u "$APP_USER" pm2 list | grep -q "dinarweb"; then
  info "App sudah berjalan. Melakukan reload..."
  sudo -u "$APP_USER" pm2 reload "$APP_DIR/ecosystem.config.js" --update-env
else
  info "Menjalankan app untuk pertama kali..."
  sudo -u "$APP_USER" pm2 start "$APP_DIR/ecosystem.config.js"
fi

sudo -u "$APP_USER" pm2 save

# ── 10. Setup startup otomatis saat reboot ────────────────────────────────────
info "Mengkonfigurasi startup otomatis..."
pm2 startup systemd -u "$APP_USER" --hp "$APP_DIR" | tail -1 | bash || true
systemctl enable "pm2-$APP_USER" 2>/dev/null || true

# ── 11. Verifikasi ─────────────────────────────────────────────────────────────
info "Menunggu server siap..."
sleep 4

if curl -sf "http://127.0.0.1:$APP_PORT/" -o /dev/null; then
  echo ""
  echo -e "${GREEN}================================================${NC}"
  echo -e "${GREEN}  Berhasil! Server berjalan di port $APP_PORT${NC}"
  echo -e "${GREEN}================================================${NC}"
  echo ""
  sudo -u "$APP_USER" pm2 list
else
  echo ""
  warn "Server tidak merespons. Cek log berikut:"
  sudo -u "$APP_USER" pm2 logs dinarweb --lines 30 --nostream
  fail "Deploy gagal."
fi

echo ""
info "Perintah berguna:"
echo "  pm2 logs dinarweb          # lihat log"
echo "  pm2 monit                  # monitor resource"
echo "  pm2 reload dinarweb        # reload tanpa downtime"
echo "  pm2 restart dinarweb       # restart penuh"
echo "  pm2 stop dinarweb          # stop"
echo ""
