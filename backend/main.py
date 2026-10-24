import asyncio
from collections import deque
from pathlib import Path
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

try:
    import auth
    import leads_db
    from bot_core import IndiaMartBot, load_settings, save_settings
except ModuleNotFoundError:
    from backend import auth, leads_db
    from backend.bot_core import IndiaMartBot, load_settings, save_settings

app = FastAPI(title="IndiaMart Lead Bot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

leads_db.init_db()

SESSION_COOKIE = "crm_session"


def require_auth(request: Request):
    token = request.cookies.get(SESSION_COOKIE)
    if not auth.validate_session(token):
        raise HTTPException(status_code=401, detail="Not authenticated")


class ConnectionManager:
    def __init__(self):
        self.connections: List[WebSocket] = []
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop):
        self.loop = loop

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.connections.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.connections:
            self.connections.remove(ws)

    async def _broadcast(self, message: dict):
        dead = []
        for ws in self.connections:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    def broadcast(self, message: dict):
        """Thread-safe: called from the bot's background thread."""
        if self.loop is None:
            return
        asyncio.run_coroutine_threadsafe(self._broadcast(message), self.loop)


manager = ConnectionManager()


class BotManager:
    def __init__(self):
        self.bot = None
        self.state = "stopped"
        self.status_text = "Stopped"
        self.log_history = deque(maxlen=300)

    def _log(self, msg):
        self.log_history.append(msg)
        manager.broadcast({"type": "log", "message": msg})

    def _status(self, state, text):
        self.state = state
        self.status_text = text
        manager.broadcast({"type": "status", "state": state, "text": text})

    def _lead(self, title, country, score, is_priority, matched=None):
        lead = leads_db.add_lead(title, country, score, is_priority, matched)
        manager.broadcast({"type": "lead", "lead": lead})
        manager.broadcast({"type": "stats", "stats": leads_db.get_stats()})

    def start(self, settings: dict):
        if self.bot and self.bot.running:
            return False
        save_settings(settings)
        self.bot = IndiaMartBot(
            log_fn=self._log,
            status_fn=self._status,
            lead_fn=self._lead,
            settings=settings,
        )
        self.bot.start()
        return True

    def stop(self):
        if self.bot:
            self.bot.stop()
            return True
        return False

    def confirm_login(self):
        if self.bot:
            self.bot.confirm_login()
            return True
        return False

    def update_live_settings(self, data: dict):
        if self.bot and self.bot.running:
            self.bot.settings.update(data)

    def status(self):
        return {
            "state": self.state,
            "text": self.status_text,
            "running": bool(self.bot and self.bot.running),
        }


bot_manager = BotManager()


@app.on_event("startup")
async def on_startup():
    manager.set_loop(asyncio.get_event_loop())


# ── Auth ──────────────────────────────────────────
class Credentials(BaseModel):
    username: str
    password: str


@app.get("/api/auth/status")
def auth_status(request: Request):
    token = request.cookies.get(SESSION_COOKIE)
    return {"authenticated": auth.validate_session(token)}


@app.post("/api/auth/login")
def auth_login(creds: Credentials, response: Response):
    if not auth.verify_login(creds.username.strip(), creds.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = auth.create_session()
    response.set_cookie(SESSION_COOKIE, token, httponly=True, samesite="lax",
                         max_age=auth.SESSION_TTL, path="/")
    return {"ok": True}


@app.post("/api/auth/logout")
def auth_logout(request: Request, response: Response):
    auth.destroy_session(request.cookies.get(SESSION_COOKIE))
    response.delete_cookie(SESSION_COOKIE, path="/")
    return {"ok": True}


# ── Settings ──────────────────────────────────────
class Settings(BaseModel):
    keywords: List[str] = []
    priority_keywords: List[str] = []
    countries: List[str] = []
    scan_speed: float = 0.5
    require_phone: bool = True
    debug_skips: bool = False


@app.get("/api/settings", dependencies=[Depends(require_auth)])
def get_settings():
    return load_settings()


@app.post("/api/settings", dependencies=[Depends(require_auth)])
def update_settings(settings: Settings):
    data = settings.dict()
    save_settings(data)
    bot_manager.update_live_settings(data)
    return data


# ── Leads ─────────────────────────────────────────
@app.get("/api/leads", dependencies=[Depends(require_auth)])
def list_leads(limit: int = 200, offset: int = 0):
    return leads_db.get_leads(limit=limit, offset=offset)


@app.get("/api/leads/stats", dependencies=[Depends(require_auth)])
def leads_stats():
    return leads_db.get_stats()


# ── Bot control ───────────────────────────────────
@app.post("/api/bot/start", dependencies=[Depends(require_auth)])
def start_bot():
    settings = load_settings()
    ok = bot_manager.start(settings)
    return {"started": ok, "status": bot_manager.status()}


@app.post("/api/bot/stop", dependencies=[Depends(require_auth)])
def stop_bot():
    ok = bot_manager.stop()
    return {"stopped": ok, "status": bot_manager.status()}


@app.post("/api/bot/login-done", dependencies=[Depends(require_auth)])
def login_done():
    ok = bot_manager.confirm_login()
    return {"confirmed": ok}


@app.get("/api/bot/status", dependencies=[Depends(require_auth)])
def bot_status():
    return bot_manager.status()


# ── WebSocket ─────────────────────────────────────
@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    token = websocket.cookies.get(SESSION_COOKIE)
    if not auth.validate_session(token):
        await websocket.close(code=4401)
        return
    await manager.connect(websocket)
    try:
        await websocket.send_json({
            "type": "status", "state": bot_manager.state, "text": bot_manager.status_text
        })
        await websocket.send_json({"type": "stats", "stats": leads_db.get_stats()})
        await websocket.send_json({
            "type": "log_history", "messages": list(bot_manager.log_history)
        })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── Serve the built React dashboard (production) ──
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="dashboard")
