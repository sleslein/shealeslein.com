#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="$(dirname "$0")/../backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/bloodbowl-$TIMESTAMP.db"

mkdir -p "$BACKUP_DIR"

echo "Backing up /data/bloodbowl.db → backups/bloodbowl-$TIMESTAMP.db"
fly sftp get /data/bloodbowl.db "$BACKUP_FILE"
echo "Backup saved."
