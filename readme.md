# IndiaMart Lead Bot CRM

### Quick Start:
Double-click `Start IndiaMart CRM.command` on macOS. It starts the CRM server and opens the dashboard in your browser (`http://127.0.0.1:8000/`).

### Private / Incognito Window & Anti-Detection Features:
- **Private Window / Incognito Support**: You can log in to IndiaMart inside a private/incognito window or separate Chrome tab. The bot automatically detects the open IndiaMart session across all browser windows and attaches directly.
- **Anti-Bot / Stealth Protection**: Hides `navigator.webdriver`, disables automation flags, and emulates genuine Chrome desktop plugins, permissions, and runtime to prevent IndiaMart restrictions and account blocks.
- **Humanized Interaction**: Natural mouse hover, human reaction hesitation, and randomized micro-jitter on scan loops to bypass behavioral bot detection.
- **Session & Inactivity Protection**: Saves session cookies and handles inactivity popups to ensure 24/7 lead capture.

### Manual Start:
```bash
cd /Users/himanshukumartiwari/Desktop/im
source venv/bin/activate
uvicorn main:app --app-dir backend --reload --host 127.0.0.1 --port 8000
```
