import { useEffect, useRef, useState } from 'react'
import Switch from '../components/Switch'
import TagInput from '../components/TagInput'
import {
  IconPlay, IconStop, IconLogin, IconTrash, IconBot,
  IconChevronDown, IconWarningTriangle, IconGear, IconClock,
  IconActivity, IconClipboard, IconSave, IconStar, IconSearch,
  IconGlobe, IconPhone,
} from '../icons'
import { saveSettings, startBot, stopBot, confirmLogin } from '../api'

const SPEED_OPTIONS = [0.3, 0.5, 1, 2, 3, 5]

// noVNC view of the server's Chrome, proxied by nginx at /vnc/ (CRM login required).
const LIVE_BROWSER_URL = '/vnc/vnc.html?autoconnect=1&reconnect=1&resize=scale&path=vnc/websockify'

const STATUS_COLORS = {
  running: { bg: 'var(--success-bg)', color: 'var(--success)' },
  stopped: { bg: '#f0f0f4', color: 'var(--text-muted)' },
  waiting: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  starting: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  stopping: { bg: 'var(--warning-bg)', color: 'var(--warning)' },
  error: { bg: 'var(--danger-bg)', color: 'var(--danger)' },
}

function ActionCard({ tone, icon: Icon, title, subtitle, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`action-card action-card--${tone}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="action-card__icon"><Icon width={17} height={17} /></span>
      <span className="action-card__title">{title}</span>
      <span className="action-card__subtitle">{subtitle}</span>
    </button>
  )
}

function SwitchCard({ tone, icon: Icon, title, subtitle, checked, onChange }) {
  return (
    <div className={`switch-card switch-card--${tone}`}>
      <span className="switch-card__icon"><Icon width={15} height={15} /></span>
      <div className="switch-card__text">
        <div className="switch-card__title">{title}</div>
        <div className="switch-card__subtitle">{subtitle}</div>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  )
}

export default function BotControl({ settings, setSettings, status, logs, clearLogs }) {
  const [priorityKw, setPriorityKw] = useState([])
  const [keywords, setKeywords] = useState([])
  const [countries, setCountries] = useState([])
  const [scanSpeed, setScanSpeed] = useState('0.5')
  const [requirePhone, setRequirePhone] = useState(true)
  const [debugSkips, setDebugSkips] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showBrowser, setShowBrowser] = useState(false)
  const seeded = useRef(false)
  const logRef = useRef(null)

  useEffect(() => {
    if (settings && !seeded.current) {
      seeded.current = true
      setPriorityKw(settings.priority_keywords || [])
      setKeywords(settings.keywords || [])
      setCountries(settings.countries || [])
      setScanSpeed(String(settings.scan_speed ?? 0.5))
      setRequirePhone(settings.require_phone ?? true)
      setDebugSkips(settings.debug_skips ?? false)
    }
  }, [settings])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const state = status?.state
  const canStart = !state || state === 'stopped' || state === 'error'
  const canStop = ['running', 'waiting', 'starting', 'stopping'].includes(state)
  const canLogin = state === 'waiting'
  const browserOpen = canLogin || (showBrowser && canStop)

  function buildPayload() {
    return {
      priority_keywords: priorityKw,
      keywords,
      countries,
      scan_speed: parseFloat(scanSpeed) || 0.5,
      require_phone: requirePhone,
      debug_skips: debugSkips,
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const data = await saveSettings(buildPayload())
      setSettings(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    } finally {
      setSaving(false)
    }
  }

  async function handleStart() {
    setBusy(true)
    try {
      await saveSettings(buildPayload())
      await startBot()
    } finally {
      setBusy(false)
    }
  }

  async function handleStop() {
    setBusy(true)
    try {
      await stopBot()
    } finally {
      setBusy(false)
    }
  }

  async function handleLoginDone() {
    setBusy(true)
    try {
      await confirmLogin()
    } finally {
      setBusy(false)
    }
  }

  const sc = STATUS_COLORS[state] || STATUS_COLORS.stopped

  return (
    <>
      <div className="bot-header">
        <div className="bot-header__icon"><IconBot width={22} height={22} /></div>
        <div className="bot-header__text">
          <h2>Bot Control</h2>
          <p>Manage and monitor your automation bot in real-time</p>
        </div>
        <div className="bot-header__status" style={{ background: sc.bg, color: sc.color }}>
          <span className="dot" />
          Bot Status: {status?.text || 'Idle'}
        </div>
      </div>

      <div className="bot-grid">
        <div className="bot-left-col">
          {state === 'waiting' && (
            <div className="login-banner">
              <IconBot />
              <div>
                Log into your IndiaMart seller account in the <strong>Live Browser</strong> below,
                then click <strong>Login Done</strong> to start watching leads. You only need to do this once.
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-header-block">
              <h3>Control Your Bot</h3>
              <p>Start, stop or complete actions for your bot.</p>
            </div>
            <div className="card-body action-row">
              <div className="action-cards">
                <ActionCard
                  tone="success" icon={IconPlay} title="Start Bot" subtitle="Begin execution"
                  onClick={handleStart} disabled={!canStart || busy}
                />
                <ActionCard
                  tone="danger" icon={IconStop} title="Stop Bot" subtitle="Halt execution"
                  onClick={handleStop} disabled={!canStop || busy}
                />
                <ActionCard
                  tone="warning" icon={IconLogin} title="Login Done" subtitle="Mark login complete"
                  onClick={handleLoginDone} disabled={!canLogin || busy}
                />
              </div>
              <img src="/botimage.webp" alt="" className="bot-illustration" />
            </div>
          </div>

          {canStop && (
            <div className="card">
              <div className="card-header-block card-header-block--action">
                <div className="card-header-block__left">
                  <div className="icon-badge"><IconGlobe width={17} height={17} /></div>
                  <div>
                    <h3>Live Browser</h3>
                    <p>The bot's Chrome running on the server.</p>
                  </div>
                </div>
                {!canLogin && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowBrowser((v) => !v)}>
                    {showBrowser ? 'Hide' : 'Show'}
                  </button>
                )}
              </div>
              {browserOpen && (
                <div className="card-body">
                  <iframe className="live-browser" src={LIVE_BROWSER_URL} title="Live Browser" />
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="card-header-block card-header-block--action">
              <div className="card-header-block__left">
                <div className="icon-badge"><IconGear width={17} height={17} /></div>
                <div>
                  <h3>Bot Settings</h3>
                  <p>Configure how your bot behaves and performs.</p>
                </div>
              </div>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
                <IconSave width={13} height={13} />
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Settings'}
              </button>
            </div>
            <div className="card-body">
              <div className="settings-grid">
                <div className="field">
                  <label><IconStar width={13} height={13} style={{ color: '#eab308' }} /> Priority Keywords</label>
                  <TagInput values={priorityKw} onChange={setPriorityKw} placeholder="Add priority keyword…" />
                  <div className="hint">These keywords will be matched first.</div>
                </div>
                <div className="field">
                  <label><IconSearch width={13} height={13} /> Keywords</label>
                  <TagInput values={keywords} onChange={setKeywords} placeholder="Add keywords to monitor and track…" />
                  <div className="hint">Add keywords to monitor and track.</div>
                </div>
                <div className="field">
                  <label><IconGlobe width={13} height={13} /> Countries</label>
                  <TagInput values={countries} onChange={setCountries} placeholder="Add country and press enter…" />
                  <div className="hint">Select countries to monitor.</div>
                </div>
              </div>

              <div className="speed-row">
                <div className="speed-row__left">
                  <span className="icon-badge icon-badge--sm"><IconClock width={15} height={15} /></span>
                  <div>
                    <div className="speed-row__title">Watch Speed (seconds)</div>
                    <div className="speed-row__subtitle">Set how often the bot checks for updates | 0.5-5 recommended.</div>
                  </div>
                </div>
                <div className="speed-row__right">
                  <div className="select-wrap">
                    <select value={scanSpeed} onChange={(e) => setScanSpeed(e.target.value)}>
                      {SPEED_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s} seconds</option>
                      ))}
                    </select>
                    <IconChevronDown width={14} height={14} className="select-wrap__chevron" />
                  </div>
               </div>
              </div>

              <div className="switches-row-cards">
                <SwitchCard
                  tone="purple" icon={IconPhone} title="Phone number required"
                  subtitle="Require phone number for actions"
                  checked={requirePhone} onChange={setRequirePhone}
                />
                <SwitchCard
                  tone="orange" icon={IconWarningTriangle} title="Debug skip logging"
                  subtitle="Skip activity logs for debugging"
                  checked={debugSkips} onChange={setDebugSkips}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card log-card">
          <div className="card-header-block card-header-block--action">
            <div className="card-header-block__left">
              <IconActivity width={17} height={17} style={{ color: 'var(--primary)' }} />
              <div>
                <h3>Activity Log</h3>
                <p>Real-time bot activity and logs.</p>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={clearLogs}>
              <IconTrash width={13} height={13} /> Clear Log
            </button>
          </div>
          <div className="card-body log-body">
            {logs.length === 0 ? (
              <div className="log-empty">
                <div className="log-empty__badge">
                  <IconClipboard width={26} height={26} />
                </div>
                <h4>No activity yet</h4>
                <p>Bot activity and logs will appear here once execution starts.</p>
              </div>
            ) : (
              <div className="log-panel log-panel--light" ref={logRef}>
                {logs.map((l) => <div key={l.id}>{l.text}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
