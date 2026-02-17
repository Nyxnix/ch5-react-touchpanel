#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-xpanel}"
HOST="${2:-0.0.0.0}"
PROJECT_NAME="crestron-touchpanel-template"
ARCHIVE_PATH="archive/${PROJECT_NAME}.ch5z"

case "$TARGET" in
  xpanel)
    DEPLOY_TARGET="web"
    EXTRA_ARGS=()
    ;;
  panel)
    DEPLOY_TARGET="touchscreen"
    EXTRA_ARGS=("--slow-mode")
    ;;
  mobile)
    DEPLOY_TARGET="mobile"
    EXTRA_ARGS=()
    ;;
  *)
    echo "Invalid target: $TARGET"
    echo "Usage: $0 [xpanel|panel|mobile] [host]"
    exit 1
    ;;
esac

echo "[1/3] Building project..."
npm run build

echo "[2/3] Creating CH5 archive..."
npm run archive

echo "[3/3] Deploying to ${DEPLOY_TARGET} at host ${HOST}..."
ch5-cli deploy -p -H "$HOST" -t "$DEPLOY_TARGET" "$ARCHIVE_PATH" "${EXTRA_ARGS[@]}"

echo "Done: ${ARCHIVE_PATH} deployed to ${HOST} (${DEPLOY_TARGET})"
