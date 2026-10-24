#!/bin/bash
cd "$(dirname "$0")"

echo "Starting IndiaMart Lead Bot CRM..."
./venv/bin/uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 &
SERVER_PID=$!

# Wait for the server to come up, then open the dashboard in the browser.
for i in $(seq 1 30); do
  if curl -s -o /dev/null http://127.0.0.1:8000/api/auth/status; then
    break
  fi
  sleep 0.5
done

open "http://127.0.0.1:8000/"

echo ""
echo "CRM is running at http://127.0.0.1:8000/"
echo "Close this window (or press Ctrl+C) to stop the bot server."
echo ""

wait $SERVER_PID
