import time
import json
import os
import sys
import hashlib
import random
import threading
from datetime import datetime
from playwright.sync_api import sync_playwright

try:
    import chrome_manager
except ModuleNotFoundError:
    from backend import chrome_manager

LEADS_URL     = "https://seller.indiamart.com/bltxn/?pref=recent"
SETTINGS_FILE = "bot_settings.json"

STEALTH_JS = """
// 1. Mask navigator.webdriver
Object.defineProperty(navigator, 'webdriver', {
    get: () => undefined,
    configurable: true
});
try {
    delete Object.getPrototypeOf(navigator).webdriver;
} catch(e) {}

// 2. Ensure window.chrome exists and has standard desktop properties
window.chrome = window.chrome || {};
window.chrome.app = window.chrome.app || {
    isInstalled: false,
    InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
    RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
};
window.chrome.runtime = window.chrome.runtime || {
    OnInstalledReason: { CHROME_UPDATE: 'chrome_update', INSTALL: 'install' },
    OnRestartRequiredReason: { APP_UPDATE: 'app_update' },
    PlatformArch: { ARM: 'arm', ARM64: 'arm64', X86_64: 'x86-64' },
    PlatformOs: { MAC: 'mac', WIN: 'win', LINUX: 'linux' },
    connect: function() {},
    sendMessage: function() {}
};
window.chrome.csi = window.chrome.csi || function() {
    return { onloadT: Date.now(), pageT: 2840, startE: Date.now(), tran: 15 };
};
window.chrome.loadTimes = window.chrome.loadTimes || function() {
    return {
        commitLoadTime: Date.now() / 1000,
        connectionInfo: 'h2',
        finishDocumentLoadTime: Date.now() / 1000,
        finishLoadTime: Date.now() / 1000,
        firstPaintAfterLoadTime: 0,
        firstPaintTime: Date.now() / 1000,
        navigationType: 'Other',
        npnNegotiatedProtocol: 'h2',
        requestTime: Date.now() / 1000,
        startLoadTime: Date.now() / 1000,
        wasAlternateProtocolAvailable: false,
        wasFetchedViaSpdy: true,
        wasNpnNegotiated: true
    };
};

// 3. Spoof Plugins & MimeTypes
if (!navigator.plugins || navigator.plugins.length === 0) {
    const fakePlugins = [
        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format" },
        { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "" },
        { name: "Native Client", filename: "internal-nacl-plugin", description: "" }
    ];
    Object.defineProperty(navigator, 'plugins', {
        get: () => fakePlugins,
        configurable: true
    });
}

// 4. Permissions API
if (navigator.permissions && navigator.permissions.query) {
    const originalQuery = navigator.permissions.query;
    navigator.permissions.query = (parameters) => (
        parameters && parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
    );
}

// 5. Languages
Object.defineProperty(navigator, 'languages', {
    get: () => ['en-US', 'en', 'hi'],
    configurable: true
});
"""


def load_settings():
    default = {
        "keywords": [],
        "priority_keywords": [],
        "countries": ["USA", "Australia"],
        "scan_speed": 0.5,
        "require_phone": True,
        "debug_skips": False,
    }
    try:
        with open(SETTINGS_FILE, "r") as f:
            data = json.load(f)
            default.update(data)
    except Exception:
        pass
    return default

def save_settings(data):
    try:
        with open(SETTINGS_FILE, "w") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass


def score_lead(title, country, keywords, priority_keywords, countries):
    score = 0
    matched = []
    is_priority = False
    title_lower = title.lower()

    for kw in priority_keywords:
        if kw.strip() and kw.strip().lower() in title_lower:
            score += 50
            matched.append(f"⭐{kw.strip()}")
            is_priority = True

    for kw in keywords:
        if kw.strip() and kw.strip().lower() in title_lower:
            score += 20
            matched.append(kw.strip())

    countries_lower = [c.strip().lower() for c in countries if c.strip()]
    if not countries_lower or country.strip().lower() in countries_lower:
        score += 20

    if not keywords and not priority_keywords:
        score = max(score, 60)
        matched.append("All Leads")

    return min(score, 100), matched, is_priority


class IndiaMartBot:
    def __init__(self, log_fn, status_fn, lead_fn, settings):
        self.log        = log_fn
        self.set_status = status_fn
        self.on_lead    = lead_fn
        self.settings   = settings
        self.running    = False
        self.playwright = None
        self.browser    = None
        self.page       = None
        self.thread     = None
        self._login_confirmed = False
        self.picked_ids = set()

    def start(self):
        self.running = True
        self.thread  = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        self.set_status("stopping", "Stopping...")
        self.log("🛑 Stop requested.")

    def confirm_login(self):
        self._login_confirmed = True

    def _apply_stealth(self, context=None, page=None):
        """Injects stealth scripts to hide automation flags and emulate genuine Chrome."""
        if context:
            try:
                context.add_init_script(STEALTH_JS)
            except Exception:
                pass
        if page:
            self._apply_stealth_to_page(page)

    def _apply_stealth_to_page(self, page):
        """Applies stealth evasion scripts into an active or new page."""
        if not page:
            return
        try:
            page.add_init_script(STEALTH_JS)
        except Exception:
            pass
        try:
            page.evaluate(STEALTH_JS)
        except Exception:
            pass

    def _find_indiamart_page(self):
        """Scans all contexts and tabs (including Private / Incognito windows) for an active IndiaMart page."""
        if not self.browser:
            return None, None
        try:
            for ctx in self.browser.contexts:
                for p in ctx.pages:
                    try:
                        u = (p.url or "").lower()
                        if "seller.indiamart.com" in u or "indiamart.com/bltxn" in u:
                            return ctx, p
                    except Exception:
                        pass
        except Exception:
            pass
        return None, None

    def _simulate_human_presence(self):
        """Subtly moves the cursor to prevent IndiaMart inactivity popups and idle logout."""
        try:
            if self.page:
                self.page.mouse.move(random.randint(120, 500), random.randint(100, 400))
        except Exception:
            pass

    def _check_already_logged_in(self, page=None):
        target_page = page or self.page
        if not target_page:
            return False
        try:
            current_url = (target_page.url or "").lower()
            if "seller.indiamart.com" not in current_url:
                if not self._safe_goto(LEADS_URL, timeout=30000, page=target_page):
                    return False

            try:
                found = target_page.wait_for_selector(
                    'xpath=//input[@id="mobNo"] | //div[contains(@id,"BLCard")] | //div[@id="bl_listing"] | //span[contains(@class,"usrName")]',
                    timeout=12000
                )
                tag_id = found.get_attribute("id") or ""
                return tag_id != "mobNo"
            except Exception:
                if "bltxn" in (target_page.url or ""):
                    return target_page.locator('input#mobNo').count() == 0
                return False
        except Exception:
            return False

    def _run(self):
        s                 = self.settings
        keywords          = s.get("keywords", [])
        priority_keywords = s.get("priority_keywords", [])
        countries         = s.get("countries", ["USA", "Australia"])
        require_phone     = s.get("require_phone", True)

        self.set_status("starting", "Opening Chrome...")

        try:
            self.playwright = sync_playwright().start()
            self._reused_browser = False

            if chrome_manager.is_cdp_available():
                self.log("🌐 Attaching to active Chrome browser (CDP)...")
                self.browser = self.playwright.chromium.connect_over_cdp(chrome_manager.CDP_URL)
                self._reused_browser = True

                # Apply stealth across all existing contexts
                for ctx in self.browser.contexts:
                    self._apply_stealth(ctx)
                    for p in ctx.pages:
                        self._apply_stealth_to_page(p)

                # Check if an IndiaMart tab is ALREADY open in ANY window (including Private/Incognito)
                indiamart_ctx, indiamart_page = self._find_indiamart_page()

                if indiamart_page:
                    self.log("🌐 Found active IndiaMart tab (Private / Active window) — attaching directly!")
                    self.page = indiamart_page
                    context = indiamart_ctx
                    self._apply_stealth_to_page(self.page)
                else:
                    # Locate CRM tab or context
                    crm_page = None
                    target_context = None

                    for ctx in self.browser.contexts:
                        for p in ctx.pages:
                            try:
                                u = (p.url or "").lower()
                                if ":8000" in u or "localhost" in u:
                                    crm_page = p
                                    target_context = ctx
                                    break
                            except Exception:
                                pass
                        if crm_page:
                            break

                    if not target_context:
                        target_context = self.browser.contexts[0] if self.browser.contexts else self.browser.new_context()

                    self.page = None
                    if crm_page:
                        self.log("🌐 Opening IndiaMart in a new tab...")
                        try:
                            with crm_page.expect_popup(timeout=8000) as popup_info:
                                crm_page.evaluate(f"() => window.open('{LEADS_URL}', '_blank')")
                            self.page = popup_info.value
                        except Exception:
                            try:
                                with target_context.expect_page(timeout=5000) as page_info:
                                    crm_page.evaluate(f"() => window.open('{LEADS_URL}', '_blank')")
                                self.page = page_info.value
                            except Exception:
                                pass

                    if not self.page:
                        self.log("🌐 Opening IndiaMart in Chrome...")
                        self.page = target_context.new_page()

                    context = target_context
                    self._apply_stealth(context, self.page)

            else:
                self.log("🌐 Launching Google Chrome (stealth mode, anti-detection)...")
                if sys.platform == "darwin":
                    profile_dir = os.path.expanduser("~/Library/Application Support/IndiaMart-CRM-ChromeProfile")
                else:
                    profile_dir = os.path.expanduser("~/.config/indiamart-crm-profile")
                os.makedirs(profile_dir, exist_ok=True)

                launch_kwargs = {
                    "user_data_dir": profile_dir,
                    "headless": False,
                    "slow_mo": 0,
                    "ignore_default_args": ["--enable-automation"],
                    "args": [
                        "--disable-blink-features=AutomationControlled",
                        "--no-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-background-timer-throttling",
                        "--disable-backgrounding-occluded-windows",
                        "--disable-renderer-backgrounding",
                        "--no-first-run",
                        "--no-default-browser-check",
                        "--disable-infobars",
                        "--window-position=0,0",
                        "--window-size=1366,768",
                    ],
                }

                try:
                    self.browser = self.playwright.chromium.launch_persistent_context(
                        channel="chrome",
                        **launch_kwargs
                    )
                except Exception:
                    self.browser = self.playwright.chromium.launch_persistent_context(
                        **launch_kwargs
                    )

                context = self.browser
                self._apply_stealth(context)
                self._try_load_cookies(context)
                self.page = self.browser.pages[0] if self.browser.pages else self.browser.new_page()
                self._apply_stealth_to_page(self.page)

            self.page.set_default_timeout(60000)

            # Ensure page navigates to LEADS_URL
            try:
                if not self.page.url or "seller.indiamart.com" not in self.page.url:
                    self.log("▶️  Navigating to IndiaMart leads...")
                    self._safe_goto(LEADS_URL, timeout=60000)
                else:
                    self.page.wait_for_load_state("domcontentloaded", timeout=30000)
            except Exception as e:
                self.log(f"⚠️  Page navigation warning: {str(e)[:100]}")

            # Check if user is already logged in
            self.log("🔎  Checking for active IndiaMart session...")
            already_logged_in = self._check_already_logged_in()

            if already_logged_in:
                self.log("✅  Already logged in — skipping manual login.")
                self._login_confirmed = True
            else:
                self.set_status("waiting", "Waiting for login...")
                self.log("\n" + "="*50)
                self.log("👉  Log in to IndiaMart (in Normal or Private window),")
                self.log("    then click  ✅ LOGIN DONE.")
                self.log("="*50)

                self._login_confirmed = False
                while not self._login_confirmed and self.running:
                    # In case the user logs into IndiaMart in a Private Window or another tab
                    found_ctx, found_page = self._find_indiamart_page()
                    if found_page:
                        if found_page != self.page:
                            self.page = found_page
                            context = found_ctx
                            self._apply_stealth_to_page(self.page)
                        if self._check_already_logged_in(self.page):
                            self.log("✅  IndiaMart login detected in window!")
                            self._login_confirmed = True
                            break
                    time.sleep(0.5)

            if not self.running:
                self._cleanup()
                return

            if not already_logged_in:
                self.log("🔄  Verifying login...")
                if self._safe_goto(LEADS_URL, timeout=60000):
                    time.sleep(2)
                else:
                    self.log("⚠️  Verify nav slow — continuing anyway.")

                try:
                    current_url = self.page.url
                    if "login" in current_url.lower() or "signin" in current_url.lower():
                        self.log("❌  Login failed — redirected to login page.")
                        self.set_status("error", "Login Failed")
                        self._cleanup()
                        return
                    found = self.page.wait_for_selector(
                        'xpath=//input[@id="mobNo"] | //div[contains(@id,"BLCard")] | //div[@id="bl_listing"]',
                        timeout=20000
                    )
                    tag_id = ""
                    try:
                        tag_id = found.get_attribute("id") or ""
                    except Exception:
                        pass
                    if tag_id == "mobNo":
                        self.log("❌  Login failed.")
                        self.set_status("error", "Login Failed")
                        self._cleanup()
                        return
                except Exception:
                    self.log("⚠️  Could not confirm login marker — continuing anyway.")

            self._save_cookies(context)
            self.log("✅  IndiaMart session confirmed!")
            self._apply_foreign_filter_once()

            self.set_status("running", "👁 Watching Leads...")
            self.log(f"\n🚀  Bot running (Stealth active, anti-detection enabled)!")
            self.log(f"    Keywords: {len(keywords)} | Priority: {len(priority_keywords)}")
            self.log(f"    Countries: {', '.join(countries)}")
            self.log(f"    Phone required: {require_phone}\n")

            if not self.page.url or "bltxn" not in self.page.url:
                self._load_fresh_leads()

            watch_count = 0
            while self.running:
                watch_count += 1
                scan_speed = self.settings.get("scan_speed", 0.5)
                self._ensure_correct_page()
                self._dismiss_inactive_popup()

                # Periodically simulate subtle human presence to prevent idle timeout
                if watch_count % 40 == 0:
                    self._simulate_human_presence()

                picked = self._watch_and_pick(
                    keywords, priority_keywords,
                    countries, require_phone, watch_count
                )
                if picked:
                    self.log("🔄  Reloading for fresh leads...")
                    self._load_fresh_leads()
                    watch_count = 0
                else:
                    # Micro-jitter to prevent mechanical bot polling detection
                    jitter = random.uniform(-0.05, 0.12)
                    time.sleep(max(0.2, scan_speed + jitter))

        except Exception as e:
            self.log(f"🚨 Fatal error: {e}")
            self.set_status("error", "Error")
        finally:
            self._cleanup()

    # ── Get all lead cards ─────────────────────────────────────
    def _get_listings(self):
        new = self.page.locator('div[id^="BLCard"]').all()
        if new:
            return new, "new"
        old = self.page.locator('div#bl_listing div.bl_grid').all()
        if old:
            return old, "old"
        return [], "none"

    # ── Extract title and country ──────────────────────────────
    def _extract_title_and_country(self, listing, layout):
        title, country = "", ""

        if layout == "new":
            try:
                spans = listing.locator('span.BuyLdC_m6').all()
                if spans:
                    title = spans[0].inner_text().strip()
            except Exception:
                pass

            try:
                strongs = listing.locator('strong').all()
                for s in strongs:
                    txt = s.inner_text().strip()
                    if txt and len(txt) <= 30 and not any(c.isdigit() for c in txt):
                        country = txt
                        break
            except Exception:
                pass

            if not country:
                try:
                    spans = listing.locator('span.BuyLdC_m6').all()
                    if len(spans) >= 2:
                        country = spans[1].inner_text().strip()
                except Exception:
                    pass

            if title and country:
                return title, country
        else:
            try:
                title   = listing.locator('div.lstNwLftCnt h2').first.inner_text().strip()
                country = listing.locator('span.coutry_click').first.inner_text().strip()
                if title and country:
                    return title, country
            except Exception:
                pass

        return title, country

    # ── Phone check ────────────────────────────────────────────
    def _has_phone(self, item):
        try:
            if isinstance(item, str):
                html = item
            else:
                html = item.inner_html()

            if "Mobile Number is Available" in html:
                return True
            if "Mobile Number" in html:
                return True
            if 'tel:' in html:
                return True
            if 'viewBox="0 0 36 26"' in html:
                return True
            if 'M14.1001' in html:
                return True

            return False
        except Exception:
            return False

    # ── Contact Buyer Now button ───────────────────────────────
    def _get_contact_button(self, listing):
        try:
            btn = listing.locator(
                '.BuyLdC_btn, button.BuyLdC_btn, .btnCBN, button[class*="CBN"], button:has-text("Contact Buyer Now"), a:has-text("Contact Buyer Now")'
            ).first
            if btn.count() > 0 and btn.is_visible(timeout=300):
                return btn
        except Exception:
            pass

        for sel in ['.BuyLdC_btn', 'button.BuyLdC_btn', '.btnCBN', 'button:has-text("Contact Buyer Now")']:
            try:
                el = listing.locator(sel).first
                if el.count() > 0 and el.is_visible(timeout=100):
                    return el
            except Exception:
                pass
        return None

    # ── Offer ID for duplicate prevention ─────────────────────
    def _get_offer_id(self, item, title="", country="", listing=None):
        try:
            if isinstance(item, str):
                html = item
            else:
                html = item.inner_html()

            if 'name="ofrid"' in html:
                start = html.find('name="ofrid"')
                val_s = html.find('value="', start) + 7
                val_e = html.find('"', val_s)
                ofrid = html[val_s:val_e]
                if ofrid:
                    return f"ofr:{ofrid}"

            if not title and not country and not isinstance(item, str):
                title, country = self._extract_title_and_country(item, "new")

            if title and country:
                key = f"{title.strip().lower()}|{country.strip().lower()}"
                fingerprint = hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]
                return f"fp:{fingerprint}"

            target_listing = listing if listing else (item if not isinstance(item, str) else None)
            if target_listing:
                try:
                    text = target_listing.inner_text()
                    normalized = " ".join(text.split())
                    if normalized:
                        return f"fp:{hashlib.sha1(normalized.encode('utf-8')).hexdigest()[:16]}"
                except Exception:
                    pass
        except Exception:
            pass
        return None

    # ── Dismiss inactivity popup ───────────────────────────────
    def _dismiss_inactive_popup(self):
        try:
            dismissed = self.page.evaluate("""
                () => {
                    const byId = document.getElementById('Yes');
                    if (byId && byId.offsetParent !== null) { byId.click(); return 'id=Yes'; }
                    const byClass = document.querySelector('button.send_quo');
                    if (byClass && byClass.offsetParent !== null) { byClass.click(); return 'class=send_quo'; }
                    for (const btn of document.querySelectorAll('button, a.btn, input[type="button"]')) {
                        const txt = (btn.innerText || btn.value || '').trim();
                        if (txt.includes('Fresh Leads') || txt.includes('Stay') || txt.includes('Continue') || txt === 'Yes' || txt === 'OK') {
                            if (btn.offsetParent !== null) {
                                btn.click();
                                return 'text=' + txt;
                            }
                        }
                    }
                    const modal = document.querySelector('.BL_admin_modal, [class*="admin_modal"], [class*="inactivity"]');
                    if (modal && window.getComputedStyle(modal).display !== 'none') {
                        modal.style.display = 'none'; return 'hidden';
                    }
                    return null;
                }
            """)
            if dismissed:
                self.log(f"🔔  Inactivity prompt handled ({dismissed}) ✅")
                time.sleep(0.5)
        except Exception:
            pass

    # ── Ensure correct page ────────────────────────────────────
    def _ensure_correct_page(self):
        try:
            current = self.page.url
            if "bltxn" not in current or "expired" in current or "past" in current:
                self.log("⚠️  Wrong page — navigating back.")
                self._load_fresh_leads()
        except Exception:
            pass

    # ── Load fresh leads page ──────────────────────────────────
    def _load_fresh_leads(self):
        for attempt in range(1, 4):
            if self._safe_goto(LEADS_URL, timeout=60000):
                time.sleep(2)
                return
            self.log(f"⚠️  Page load attempt {attempt}/3 failed, retrying...")
            if attempt < 3:
                time.sleep(3)

    # ── Safe navigation ─────────────────────────────────────────
    def _safe_goto(self, url, timeout=60000, page=None):
        target = page or self.page
        if not target:
            return False
        try:
            target.goto(url, wait_until="commit", timeout=timeout)
        except Exception as e:
            if "interrupted by another navigation" not in str(e):
                self.log(f"⚠️  Navigation issue: {str(e)[:120]}")
                return False
        try:
            target.wait_for_load_state("domcontentloaded", timeout=timeout)
        except Exception:
            pass
        return True

    # ── Session cookies ────────────────────────────────────────
    def _try_load_cookies(self, context):
        try:
            if os.path.exists("session_cookies.json"):
                with open("session_cookies.json", "r") as f:
                    cookies = json.load(f)
                clean_cookies = []
                for c in cookies:
                    clean = {k: v for k, v in c.items() if k in ("name", "value", "domain", "path", "expires", "httpOnly", "secure", "sameSite")}
                    if clean.get("sameSite") not in ("Lax", "None", "Strict"):
                        clean.pop("sameSite", None)
                    clean_cookies.append(clean)
                context.add_cookies(clean_cookies)
                self.log("🍪  Saved session cookies restored!")
        except Exception as e:
            self.log(f"⚠️  Cookie restore note: {e}")

    def _save_cookies(self, context):
        try:
            cookies = context.cookies()
            if cookies:
                with open("session_cookies.json", "w") as f:
                    json.dump(cookies, f, indent=2)
                self.log(f"💾  Session saved ({len(cookies)} cookies stored for auto-reconnect)")
        except Exception:
            pass

    # ── Foreign filter ─────────────────────────────────────────
    def _apply_foreign_filter_once(self):
        countries = self.settings.get("countries", [])
        countries_lower = [c.strip().lower() for c in countries if c.strip()]
        # Only apply foreign filter if user explicitly wants foreign countries and NOT India
        wants_foreign_only = countries_lower and "india" not in countries_lower
        if not wants_foreign_only:
            return

        try:
            self.page.eval_on_selector(
                ".fltr_relead_hover.cu-trans",
                "el => el.style.display='block'"
            )
            self.page.eval_on_selector(
                ".fltr_relead_hover.cu-trans > .fltr_relead_hover",
                "el => el.style.display='block'"
            )
            el = self.page.wait_for_selector('li[title="Foreign"]', timeout=3000)
            if el:
                class_attr = el.get_attribute("class") or ""
                if "active" not in class_attr:
                    self.page.locator("label:has-text('Foreign')").click()
                    time.sleep(1)
                    self.log("🌍  Foreign filter applied.")
                else:
                    self.log("🌍  Foreign filter already active.")
        except Exception:
            pass

    # ── Main scan loop ─────────────────────────────────────────
    def _watch_and_pick(self, keywords, priority_keywords,
                        countries, require_phone, watch_count):
        try:
            listings, layout = self._get_listings()

            current_count = len(listings)
            if not hasattr(self, '_last_count'):
                self._last_count = -1
            dom_grew = False
            if current_count != self._last_count:
                self.log(f"📊  [{datetime.now().strftime('%H:%M:%S.%f')[:-3]}] DOM changed: {self._last_count} → {current_count} leads")
                if current_count > self._last_count and self._last_count != -1:
                    dom_grew = True
                self._last_count = current_count

            if watch_count % 30 == 0:
                self.log(
                    f"[{datetime.now().strftime('%H:%M:%S')}] "
                    f"👁 Watching {len(listings)} leads..."
                )

            best_lead    = None
            best_score   = -1
            best_listing = None
            best_info    = {}

            verbose = self.settings.get("debug_skips", False) or dom_grew
            if dom_grew:
                self.log(f"🔍  New lead(s) arrived — inspecting all {current_count} cards:")

            countries_lower = [c.strip().lower() for c in countries if c.strip()]
            all_kw = [k.strip() for k in (keywords + priority_keywords) if k.strip()]

            for idx, listing in enumerate(listings):
                try:
                    title, country = self._extract_title_and_country(listing, layout)

                    if not title or not country:
                        if verbose:
                            self.log(f"   ⊘ #{idx}: extract failed (title='{title}' country='{country}')")
                        continue

                    if countries_lower and country.strip().lower() not in countries_lower:
                        if verbose:
                            self.log(f"   ⊘ '{title[:40]}' — country={country} not in target list")
                        continue

                    if all_kw and not any(kw.lower() in title.lower() for kw in all_kw):
                        if verbose:
                            self.log(f"   ⊘ '{title[:40]}' ({country}) — no keyword match")
                        continue

                    html = ""
                    try:
                        html = listing.inner_html()
                    except Exception:
                        pass

                    if require_phone and not self._has_phone(html):
                        if verbose:
                            self.log(f"   ⊘ '{title[:40]}' ({country}) — no phone")
                        continue

                    offer_id = self._get_offer_id(html, title, country, listing)
                    if offer_id and offer_id in self.picked_ids:
                        if verbose:
                            self.log(f"   ⊘ '{title[:40]}' ({country}) — already picked this lead")
                        continue

                    score, matched_kw, is_priority = score_lead(
                        title, country, keywords, priority_keywords, countries
                    )

                    if verbose:
                        self.log(f"   ✓ '{title[:40]}' ({country}) — MATCH, score={score}")

                    if score > best_score:
                        best_score   = score
                        best_lead    = (title, country, offer_id)
                        best_listing = listing
                        best_info    = {
                            "matched": matched_kw,
                            "priority": is_priority,
                            "score": score
                        }

                except Exception:
                    continue

            if best_lead and best_listing:
                title, country, offer_id = best_lead
                score    = best_info["score"]
                matched  = best_info["matched"]
                priority = best_info["priority"]

                bar = "█" * (score // 10) + "░" * (10 - score // 10)
                tag = " ⭐ PRIORITY!" if priority else ""

                self.log(f"\n{'='*50}")
                self.log(f"✅  MATCH!{tag}")
                self.log(f"    Title:    {title}")
                self.log(f"    Country:  {country}")
                self.log(f"    Score:    [{bar}] {score}/100")
                self.log(f"    Keywords: {', '.join(matched)}")
                self.log(f"    Time:     {datetime.now().strftime('%H:%M:%S')}")

                btn = self._get_contact_button(best_listing)
                if btn:
                    try:
                        btn.scroll_into_view_if_needed(timeout=1500)
                    except Exception:
                        pass
                    # Natural human reaction hesitation (150ms - 300ms)
                    time.sleep(random.uniform(0.15, 0.30))
                    # Hover to generate genuine pointer / mouseover telemetry
                    try:
                        btn.hover(timeout=1500)
                    except Exception:
                        pass
                    time.sleep(random.uniform(0.06, 0.15))
                    # Humanized click duration
                    btn.click(delay=random.randint(70, 130))
                    time.sleep(random.uniform(0.8, 1.3))
                    self.log("    🖱️  Clicked 'Contact Buyer Now'!")
                    if offer_id:
                        self.picked_ids.add(offer_id)
                    self.on_lead(title, country, score, priority, matched)
                    self.log(f"{'='*50}\n")
                    return True
                else:
                    self.log(f"    ⏳  Button not ready yet for '{title[:40]}' — will retry next scan")
                    try:
                        for sel in ['.BuyLdC_btn', 'button.BuyLdC_btn', '.btnCBN',
                                    'button[class*="CBN"]', 'button:has-text("Contact Buyer Now")']:
                            cnt = best_listing.locator(sel).count()
                            if cnt > 0:
                                self.log(f"        selector '{sel}' → {cnt} match(es), but not visible")
                    except Exception:
                        pass
                    self.log(f"{'='*50}\n")
                    return False

        except Exception as e:
            if "Target page" not in str(e) and "closed" not in str(e):
                self.log(f"⚠️  Watch error: {e}")
        return False

    def _cleanup(self):
        try:
            if getattr(self, "_reused_browser", False):
                # Shared Chrome (CDP) — close only our tab, never the browser itself.
                if self.page:
                    self.page.close()
            elif self.browser:
                self.browser.close()
            if self.playwright:
                self.playwright.stop()
        except Exception:
            pass
        self.running = False
        self.set_status("stopped", "Stopped")
        self.log("\n🔴  Bot stopped.\n")
