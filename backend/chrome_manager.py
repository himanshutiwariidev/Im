import os
import urllib.request

CDP_PORT = int(os.environ.get("CRM_CHROME_CDP_PORT", "9222"))
CDP_URL = f"http://127.0.0.1:{CDP_PORT}"


def is_cdp_available() -> bool:
    try:
        req = urllib.request.urlopen(f"{CDP_URL}/json/version", timeout=1.0)
        return req.status == 200
    except Exception:
        return False
