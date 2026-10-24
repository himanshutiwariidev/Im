const CLASS_BY_STATE = {
  running: 'status-running',
  stopped: 'status-stopped',
  waiting: 'status-waiting',
  starting: 'status-starting',
  stopping: 'status-stopping',
  error: 'status-error',
}

export default function StatusPill({ state, text }) {
  const cls = CLASS_BY_STATE[state] || 'status-stopped'
  return (
    <span className={`status-pill ${cls}`}>
      <span className="dot" />
      {text}
    </span>
  )
}
