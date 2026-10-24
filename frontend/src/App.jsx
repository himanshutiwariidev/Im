import { useCallback, useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Overview from './pages/Overview'
import Leads from './pages/Leads'
import BotControl from './pages/BotControl'
import Login from './pages/Login'
import {
  getSettings, getLeads, getStats, getBotStatus, getAuthStatus, logout,
  startBot, stopBot,
} from './api'
import { useBotSocket } from './useBotSocket'

let logId = 0

export default function App() {
  const [authLoading, setAuthLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  const [settings, setSettings] = useState(null)
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({ total: 0, priority_count: 0, avg_score: 0 })
  const [status, setStatus] = useState({ state: 'stopped', text: 'Stopped' })
  const [logs, setLogs] = useState([])
  const [quickBusy, setQuickBusy] = useState(false)

  useEffect(() => {
    getAuthStatus()
      .then((s) => setAuthenticated(s.authenticated))
      .finally(() => setAuthLoading(false))
  }, [])

  const appendLog = useCallback((msg) => {
    setLogs((prev) => {
      const next = [...prev, { id: logId++, text: msg }]
      return next.length > 500 ? next.slice(next.length - 500) : next
    })
  }, [])

  const { connected } = useBotSocket({
    enabled: authenticated,
    onLog: appendLog,
    onLogHistory: (messages) => setLogs(messages.map((text) => ({ id: logId++, text }))),
    onStatus: (state, text) => setStatus({ state, text }),
    onLead: (lead) => setLeads((prev) => [lead, ...prev]),
    onStats: (s) => setStats(s),
  })

  useEffect(() => {
    if (!authenticated) return
    getSettings().then(setSettings).catch(() => {})
    getLeads().then(setLeads).catch(() => {})
    getStats().then(setStats).catch(() => {})
    getBotStatus().then((s) => setStatus({ state: s.state, text: s.text })).catch(() => {})
  }, [authenticated])

  const canQuickStart = !status.state || status.state === 'stopped' || status.state === 'error'
  const canQuickStop = ['running', 'waiting', 'starting', 'stopping'].includes(status.state)

  async function handleQuickAction() {
    setQuickBusy(true)
    try {
      if (canQuickStop) await stopBot()
      else await startBot()
    } finally {
      setQuickBusy(false)
    }
  }

  async function handleLogout() {
    try { await logout() } catch { /* ignore */ }
    setAuthenticated(false)
    setSettings(null)
    setLeads([])
    setStats({ total: 0, priority_count: 0, avg_score: 0 })
    setStatus({ state: 'stopped', text: 'Stopped' })
    setLogs([])
  }

  if (authLoading) return null

  if (!authenticated) {
    return <Login onAuthenticated={() => setAuthenticated(true)} />
  }

  return (
    <div className="app-shell">
      <Sidebar onLogout={handleLogout} />
      <div className="app-main">
        <TopBar
          connected={connected}
          canQuickStop={canQuickStop}
          canQuickStart={canQuickStart}
          quickBusy={quickBusy}
          onQuickAction={handleQuickAction}
        />
        <div className="app-content">
          <div className="dash-overview">
            <Overview stats={stats} status={status} />
          </div>

          <div className="dash-leads">
            <Leads leads={leads} />
          </div>

          <div className="dash-bot">
            <BotControl
              settings={settings}
              setSettings={setSettings}
              status={status}
              logs={logs}
              clearLogs={() => setLogs([])}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
