const API_BASE = '/api'

async function j(res) {
  if (!res.ok) {
    let detail = `Request failed: ${res.status}`
    try {
      const body = await res.json()
      if (body?.detail) detail = body.detail
    } catch { /* ignore */ }
    const err = new Error(detail)
    err.status = res.status
    throw err
  }
  return res.json()
}

const withCreds = (opts = {}) => ({ ...opts, credentials: 'same-origin' })

export const getAuthStatus = () => fetch(`${API_BASE}/auth/status`, withCreds()).then(j)
export const login = (username, password) =>
  fetch(`${API_BASE}/auth/login`, withCreds({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })).then(j)
export const logout = () => fetch(`${API_BASE}/auth/logout`, withCreds({ method: 'POST' })).then(j)

export const getSettings   = () => fetch(`${API_BASE}/settings`).then(j)
export const saveSettings  = (data) =>
  fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(j)

export const getLeads = (limit = 300) => fetch(`${API_BASE}/leads?limit=${limit}`).then(j)
export const getStats = () => fetch(`${API_BASE}/leads/stats`).then(j)

export const getBotStatus = () => fetch(`${API_BASE}/bot/status`).then(j)
export const startBot     = () => fetch(`${API_BASE}/bot/start`, { method: 'POST' }).then(j)
export const stopBot      = () => fetch(`${API_BASE}/bot/stop`, { method: 'POST' }).then(j)
export const confirmLogin = () => fetch(`${API_BASE}/bot/login-done`, { method: 'POST' }).then(j)
