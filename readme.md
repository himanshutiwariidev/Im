# IndiaMart Lead Bot CRM

### Quick Start:
Double-click `Start IndiaMart CRM.command` on macOS. It starts the server and launches Google Chrome with remote debugging enabled so the bot captures leads directly in your active Chrome profile (no incognito).

### Manual Start:
```bash
cd /Users/himanshukumartiwari/Desktop/im
source venv/bin/activate
uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```
