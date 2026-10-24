#!/usr/bin/env bash
# deploy-docker.sh — Deploy manual Dinarweb dengan Docker
# Jalankan sebagai root atau user dengan sudo: bash deploy-docker.sh

set -e

APP_DIR="/srv/dinarweb"
REPO_URL="https://github.com/jagatraya2508/dinar.git"
APP_PORT="8765"

GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()    { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }
confirm() {
  read -rp "$1 [y/N]: " ans
  [[ "${ans,,}" == "y" ]] || { echo "Dibatalkan."; exit 0; }
}

# ── 1. Cek root ──────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  fail "Script ini harus dijalankan sebagai root. Coba: sudo bash deploy-docker.sh"
fi

echo ""
echo "============================================"
echo "  Deploy Dinarweb — Docker"
echo "============================================"
echo ""

# ── 2. Install Docker jika belum ada ─────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Docker tidak ditemukan. Menginstall Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  info "Docker berhasil diinstall."
else
  info "Docker sudah tersedia: $(docker --version)"
fi

# ── 3. Siapkan direktori ──────────────────────────────────────────────────────
info "Menyiapkan direktori $APP_DIR..."
mkdir -p "$APP_DIR/data" "$APP_DIR/assets/web/uploads"

# ── 4. Clone atau pull kode ───────────────────────────────────────────────────
if [[ -d "$APP_DIR/.git" ]]; then
  info "Repo sudah ada. Menarik kode terbaru..."
  git -C "$APP_DIR" fetch origin main
  # Jaga file data agar tidak tertimpa
  git -C "$APP_DIR" checkout origin/main -- \
    $(git -C "$APP_DIR" ls-tree --name-only origin/main | grep -v "^data$" | grep -v "^assets$")
  info "Kode berhasil diperbarui."
else
  info "Mengkloning repo ke $APP_DIR..."
  # Clone ke temp dulu agar tidak menimpa data/uploads yang sudah ada
  TMP_DIR=$(mktemp -d)
  git clone "$REPO_URL" "$TMP_DIR"
  # Salin semua kecuali data/admin.json dan uploads (jaga data yang sudah ada)
  rsync -a --exclude='.git' \
    --exclude='data/admin.json' \
    --exclude='assets/web/uploads/' \
    "$TMP_DIR/" "$APP_DIR/"
  rm -rf "$TMP_DIR"
  info "Kode berhasil dikloning."
fi

# ── 5. Build dan jalankan container ──────────────────────────────────────────
info "Membangun Docker image..."
docker compose -f "$APP_DIR/docker-compose.yml" build --no-cache

info "Menjalankan container..."
docker compose -f "$APP_DIR/docker-compose.yml" up -d --force-recreate

# ── 6. Verifikasi ─────────────────────────────────────────────────────────────
info "Menunggu server siap..."
sleep 4

if curl -sf "http://127.0.0.1:$APP_PORT/" -o /dev/null; then
  echo ""
  echo -e "${GREEN}================================================${NC}"
  echo -e "${GREEN}  Berhasil! Server berjalan di port $APP_PORT${NC}"
  echo -e "${GREEN}================================================${NC}"
  echo ""
  docker compose -f "$APP_DIR/docker-compose.yml" ps
else
  echo ""
  warn "Server tidak merespons. Cek log berikut:"
  docker compose -f "$APP_DIR/docker-compose.yml" logs --tail=30
  fail "Deploy gagal."
fi

echo ""
info "Perintah berguna:"
echo "  docker compose -f $APP_DIR/docker-compose.yml logs -f     # lihat log"
echo "  docker compose -f $APP_DIR/docker-compose.yml restart     # restart"
echo "  docker compose -f $APP_DIR/docker-compose.yml down        # stop"
echo ""
