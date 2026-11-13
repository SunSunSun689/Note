#!/usr/bin/env bash
# 一键构建 + 打包 crx + 部署 Chrome 强制安装（Linux 自用）
# 用法: ./scripts/install-linux.sh     （第 4 步需要 sudo）
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_DIR"

EXT_ID="oaphiomanbkpiaoleeonclikdfljihik"   # 由 dist/selfhost/key.pem 决定，key 不变则 id 不变
VERSION="$(node -p 'require("./package.json").version')"
NODE_BIN="$(command -v node)"

echo "==> 1/4 构建浏览器插件（chromium）"
ELECTRON_SKIP_BINARY_DOWNLOAD=1 pnpm build-browser-extension

echo "==> 2/4 打包 crx（复用现有 key.pem）"
mkdir -p dist/selfhost
pnpm exec crx3 dist/browser-extension/chromium \
    -o dist/selfhost/translator.crx \
    -p dist/selfhost/key.pem \
    -x dist/selfhost/update.xml \
    --crxURL http://localhost:8930/translator.crx \
    --appVersion "$VERSION"

echo "==> 3/4 部署本地更新服务（systemd user service，开机自启）"
mkdir -p ~/.config/systemd/user
sed -e "s|__NODE__|$NODE_BIN|" -e "s|__REPO_DIR__|$REPO_DIR|" \
    scripts/translator-update.service > ~/.config/systemd/user/translator-update.service
systemctl --user daemon-reload
systemctl --user enable --now translator-update
loginctl enable-linger "$USER" 2>/dev/null || true
sleep 1
curl -sf http://localhost:8930/update.xml > /dev/null || {
    echo "!! 更新服务未响应，请检查: systemctl --user status translator-update" >&2
    exit 1
}

echo "==> 4/4 写入 Chrome 策略（强制安装）"
sudo mkdir -p /etc/opt/chrome/policies/managed
printf '{\n  "ExtensionInstallForcelist": ["%s;http://localhost:8930/update.xml"]\n}\n' "$EXT_ID" \
    | sudo tee /etc/opt/chrome/policies/managed/translator.json > /dev/null

echo
echo "完成 ✅  重启 Chrome 后扩展自动安装/更新。"
echo "验证: chrome://policy 应显示 ExtensionInstallForcelist；chrome://extensions 应显示 NextAI Translator。"
