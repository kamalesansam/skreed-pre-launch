#!/usr/bin/env bash
# Build the production site with the lead forms on and upload it to skreed.shop on Hostinger over SSH.
# Needs SKREED_SSH (user@host from hPanel, Advanced, SSH Access) and an SSH key added there; the port defaults to 65002.
# The static site replaces public_html (old files removed); the PHP library goes to ~/skreed-api/ in the account's home,
# outside the site, where the server's own config.php (never in git) is left alone.
set -euo pipefail
: "${SKREED_SSH:=u918474217@88.223.84.31}"
PORT="${SKREED_SSH_PORT:-65002}"
ROOT="${SKREED_REMOTE_ROOT:-domains/skreed.shop}"
KEY="${SKREED_SSH_KEY:-$HOME/.ssh/skreed_hostinger}"
SSH="ssh -p $PORT -i $KEY -o IdentitiesOnly=yes"

PUBLIC_LEADS=on npm run build
node scripts/deploy/htaccess.mjs dist
mkdir -p dist/api && cp server/public/api/*.php dist/api/

$SSH "$SKREED_SSH" "mkdir -p skreed-api/lib && test -f skreed-api/config.php || echo 'WARNING: ~/skreed-api/config.php is missing: the forms will answer 500 until it is written'"
rsync -az --delete -e "$SSH" server/lib/ "$SKREED_SSH:skreed-api/lib/"
# the dated mailings' command, run by the hPanel cron job (docs/DEPLOY-HOSTINGER.md); uploading it starts nothing
rsync -az -e "$SSH" server/mailing.php "$SKREED_SSH:skreed-api/mailing.php"
# the quiz email's wallpapers (Sam's, git-ignored: node scripts/quiz/prepare-wallpapers.mjs "<folder>" makes them)
if [ -f server/wallpapers/index.json ]; then rsync -az --delete -e "$SSH" server/wallpapers/ "$SKREED_SSH:skreed-api/wallpapers/"
else echo 'WARNING: server/wallpapers/ is empty: the quiz email goes without its wallpapers (scripts/quiz/prepare-wallpapers.mjs)'; fi
rsync -az --delete --exclude '.well-known' -e "$SSH" dist/ "$SKREED_SSH:$ROOT/public_html/"
echo "Deployed to https://skreed.shop"
