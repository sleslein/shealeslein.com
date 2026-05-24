#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bloodbowl-$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

# Fly auto-stops idle machines; start it if needed before connecting via sftp
MACHINE_ID=$(fly machine list --json | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
echo "Ensuring machine is running..."
fly machine start "$MACHINE_ID" 2>/dev/null || true
fly machine wait --state started "$MACHINE_ID"

echo "Backing up /data/bloodbowl.db → backups/bloodbowl-$TIMESTAMP.db"
fly sftp get /data/bloodbowl.db "$BACKUP_FILE"
echo "Backup saved."
