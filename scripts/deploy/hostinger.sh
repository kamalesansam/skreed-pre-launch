#!/usr/bin/env bash
# Build the production site with the lead forms on and upload it to skreed.shop on Hostinger over SSH.
# Needs SKREED_SSH (user@host from hPanel, Advanced, SSH Access) and an SSH key added there; the port defaults to 65002.
# The static site replaces public_html (old files removed); the PHP library goes to skreed-api/ beside it, where the
# server's own config.php (never in git) is left alone.
set -euo pipefail
: "${SKREED_SSH:?set SKREED_SSH=u918474217@<host>}"
PORT="${SKREED_SSH_PORT:-65002}"
ROOT="${SKREED_REMOTE_ROOT:-domains/skreed.shop}"
SSH="ssh -p $PORT"

PUBLIC_LEADS=on npm run build
node scripts/deploy/htaccess.mjs dist
mkdir -p dist/api && cp server/public/api/*.php dist/api/

$SSH "$SKREED_SSH" "mkdir -p $ROOT/skreed-api/lib && test -f $ROOT/skreed-api/config.php || echo 'WARNING: $ROOT/skreed-api/config.php is missing: the forms will answer 500 until it is written'"
rsync -az --delete -e "$SSH" server/lib/ "$SKREED_SSH:$ROOT/skreed-api/lib/"
rsync -az --delete --exclude '.well-known' -e "$SSH" dist/ "$SKREED_SSH:$ROOT/public_html/"
echo "Deployed to https://skreed.shop"
