#!/usr/bin/env bash
set -euo pipefail

TIMEFORMAT='[timing] cd: %3R seconds'
time cd "$(dirname "$0")"
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
