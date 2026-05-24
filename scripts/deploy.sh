#!/usr/bin/env bash
set -euo pipefail

bash "$(dirname "$0")/backup.sh"

fly deploy
