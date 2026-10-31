#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
worker_dir="$repo_root/workers/catalog-api"
persist_dir="$worker_dir/.wrangler/local-order-qa-state"

mkdir -p "$persist_dir"
cd "$worker_dir"

exec npx --yes wrangler@4.156.0 dev \
  --local \
  --ip 127.0.0.1 \
  --port 8787 \
  --persist-to "$persist_dir"
