#!/bin/bash
set -e

REPO="https://github.com/llleeesss2000/claude-drawer"
INSTALL_DIR="$HOME/.local/share/claude-drawer"
BIN_DIR="$HOME/.local/bin"
APP_DIR="$HOME/.local/share/applications"

# ── 顏色 ────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }
info() { echo -e "${YELLOW}⏳ $1${NC}"; }

echo ""
echo "  Claude 抽屜 安裝程式"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. 檢查 Node.js ─────────────────────────────────────
info "檢查 Node.js..."
if ! command -v node &>/dev/null; then
  err "未安裝 Node.js，請先前往 https://nodejs.org/ 安裝 Node.js 18 以上版本"
fi

NODE_VER=$(node -e "console.log(parseInt(process.versions.node.split('.')[0]))")
if [ "$NODE_VER" -lt 18 ]; then
  err "Node.js 版本過舊（目前：v$NODE_VER），請升級至 v18 以上"
fi
ok "Node.js v$(node -v | tr -d 'v') 版本符合"

# ── 2. 下載專案 ─────────────────────────────────────────
info "正在下載 Claude 抽屜..."
rm -rf "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

if command -v git &>/dev/null; then
  git clone --depth 1 "$REPO" "$INSTALL_DIR" --quiet
else
  curl -fsSL "$REPO/archive/refs/heads/main.tar.gz" \
    | tar -xz -C "$INSTALL_DIR" --strip-components=1
fi
ok "下載完成"

# ── 3. 安裝相依套件 ─────────────────────────────────────
info "正在安裝相依套件..."
cd "$INSTALL_DIR"
npm install --production --ignore-scripts --silent
ok "相依套件安裝完成"

# ── 4. 建立啟動器 ───────────────────────────────────────
mkdir -p "$BIN_DIR"
cat > "$BIN_DIR/claude-drawer" << LAUNCHER
#!/bin/bash
exec node "$INSTALL_DIR/bin/claude-drawer.js" "\$@"
LAUNCHER
chmod +x "$BIN_DIR/claude-drawer"

# 確保 ~/.local/bin 在 PATH 中
SHELL_RC=""
if [ -f "$HOME/.zshrc" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
  SHELL_RC="$HOME/.bashrc"
fi

if [ -n "$SHELL_RC" ] && ! grep -q '\.local/bin' "$SHELL_RC"; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
fi
ok "啟動器建立完成"

# ── 5. 尋找桌面路徑 ─────────────────────────────────────
DESKTOP_PATH=""
if command -v xdg-user-dir &>/dev/null; then
  XDG_DESKTOP=$(xdg-user-dir DESKTOP 2>/dev/null || echo "")
  if [ -n "$XDG_DESKTOP" ] && [ "$XDG_DESKTOP" != "$HOME" ] && [ -d "$XDG_DESKTOP" ]; then
    DESKTOP_PATH="$XDG_DESKTOP"
  fi
fi

if [ -z "$DESKTOP_PATH" ]; then
  for d in "Desktop" "桌面" "desktop"; do
    if [ -d "$HOME/$d" ]; then
      DESKTOP_PATH="$HOME/$d"
      break
    fi
  done
fi

# ── 6. 建立 .desktop 捷徑 ──────────────────────────────
DESKTOP_CONTENT="[Desktop Entry]
Type=Application
Name=Claude 抽屜
Comment=Claude Code 圖形化管理工具
Exec=$BIN_DIR/claude-drawer
Terminal=false
StartupNotify=true
Categories=Utility;"

# 應用程式選單
mkdir -p "$APP_DIR"
echo "$DESKTOP_CONTENT" > "$APP_DIR/claude-drawer.desktop"
chmod +x "$APP_DIR/claude-drawer.desktop"
update-desktop-database "$APP_DIR" 2>/dev/null || true

# 桌面捷徑
if [ -n "$DESKTOP_PATH" ]; then
  echo "$DESKTOP_CONTENT" > "$DESKTOP_PATH/claude-drawer.desktop"
  chmod +x "$DESKTOP_PATH/claude-drawer.desktop"
  # GNOME 桌面需要標記為信任才能雙擊執行
  gio set "$DESKTOP_PATH/claude-drawer.desktop" metadata::trusted true 2>/dev/null || true
  ok "桌面捷徑建立完成：$DESKTOP_PATH/claude-drawer.desktop"
else
  echo -e "${YELLOW}⚠️  找不到桌面資料夾，已安裝至應用程式選單${NC}"
fi

# ── 完成 ────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ok "Claude 抽屜安裝完成！"
echo ""
echo "  👉 桌面上的「Claude 抽屜」圖示雙擊即可啟動"
echo "  👉 或在應用程式選單搜尋「Claude 抽屜」"
echo ""
