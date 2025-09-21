#!/usr/bin/env bash
set -euo pipefail
ID="$1"         # e.g. 021
SLUG="$2"       # e.g. experiments
DIR="specs/${ID}-${SLUG}"
mkdir -p "$DIR"
cp templates/spec-template.md "${DIR}/spec.md"
echo "Created ${DIR}/spec.md"
