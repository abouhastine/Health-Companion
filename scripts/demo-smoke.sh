#!/usr/bin/env bash
set -euo pipefail

api_base="${API_BASE_URL:-http://localhost:8080}"
curl --fail --silent "$api_base/api/practitioners" >/dev/null
echo "Practitioner directory: OK"
echo "Register/login a synthetic patient, upload a text PDF as admin, then verify document chat with the configured AI provider."
