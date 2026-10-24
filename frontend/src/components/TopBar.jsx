import { IconPower, IconPlay } from '../icons'

export default function TopBar({ connected, canQuickStop, canQuickStart, quickBusy, onQuickAction }) {
  return (
    <header className="topbar">
      <div>
        <h1>Dashboard</h1>
        <div className="topbar-subtitle">Welcome back! Here's what's happening with your bot.</div>
      </div>
      <div className="topbar-right">
        <span className={`live-dot ${connected ? 'on' : ''}`}>
          <span className="dot" />
          {connected ? 'Connected' : 'Connecting…'}
        </span>
        {canQuickStop && (
          <button className="quick-action quick-action--stop" disabled={quickBusy} onClick={onQuickAction}>
            <IconPower width={14} height={14} /> Stop Bot
          </button>
        )}
        {!canQuickStop && canQuickStart && (
          <button className="quick-action quick-action--start" disabled={quickBusy} onClick={onQuickAction}>
            <IconPlay width={13} height={13} /> Start Bot
          </button>
        )}
      </div>
    </header>
  )
}
