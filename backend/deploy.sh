#!/bin/bash

# ==========================================
# 🔧 KONFIGURASI SERVER & PROYEK
# ==========================================
SERVER="10.10.10.201"
USER="uch"
KEY_PATH="$HOME/uch"
PROJECT_DIR="/home/uch/uchsuperapp"
BACKEND_DIR="backend"
APP_NAME="uchsuperapp"
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}🚀 Memulai Deploy UCH Super App ke VPS ($SERVER)...${NC}"

if ! ping -c 1 $SERVER &> /dev/null; then
    echo -e "${RED}❌ Gagal konek ke $SERVER. Pastikan VPN terhubung!${NC}"
    exit 1
fi

ssh -i "$KEY_PATH" "$USER@$SERVER" << EOF
    export BUN_INSTALL="\$HOME/.bun"
    export PATH="\$BUN_INSTALL/bin:\$PATH"

    echo "📂 Masuk ke folder project..."
    cd "$PROJECT_DIR" || exit 1
    
    echo "⬇️  Pull update dari GitHub..."
    git pull origin main

    echo "⚙️  Update Ecosystem Config di folder backend..."
    # Pastikan folder backend ada
    if [ ! -d "$BACKEND_DIR" ]; then
        echo "❌ Folder $BACKEND_DIR tidak ditemukan di server!"
        exit 1
    fi
    
    cd "$BACKEND_DIR"
    
    # Overwrite ecosystem.config.cjs
    cat > ecosystem.config.cjs <<INNER_EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'bun',
    args: 'run src/index.ts',
    cwd: '$PROJECT_DIR/$BACKEND_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    env_file: '.env.production',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '500M',
    watch: false,
    restart_delay: 4000
  }]
};
INNER_EOF

    echo "📦 Install Dependencies..."
    bun install

    echo "🗄️  Migrate DB..."
    if [ -f .env.production ]; then
        export \$(cat .env.production | xargs)
        bun run db:migrate
    fi

    echo "📁 Membuat folder logs jika belum ada..."
    mkdir -p logs

    echo "🔄 Restart PM2..."
    pm2 delete $APP_NAME 2>/dev/null || true
    # Start dari dalam folder backend menggunakan config yang baru dibuat
    pm2 start ecosystem.config.cjs
    pm2 save

    echo "✅ Deploy selesai!"
    echo ""
    echo "📊 Status PM2:"
    pm2 status
EOF

echo -e "${GREEN}✅ Deploy berhasil!${NC}"
echo -e "${CYAN}💡 Tips:${NC}"
echo -e "  - Cek logs: ${GREEN}ssh -i ~/uch uch@$SERVER 'pm2 logs $APP_NAME'${NC}"
echo -e "  - Cek status: ${GREEN}ssh -i ~/uch uch@$SERVER 'pm2 status'${NC}"
