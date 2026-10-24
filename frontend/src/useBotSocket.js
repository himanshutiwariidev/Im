import { useEffect, useRef, useState } from 'react'

export function useBotSocket({ enabled = true, onLog, onLogHistory, onStatus, onLead, onStats }) {
  const wsRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const handlersRef = useRef({ onLog, onLogHistory, onStatus, onLead, onStats })
  handlersRef.current = { onLog, onLogHistory, onStatus, onLead, onStats }

  useEffect(() => {
    if (!enabled) {
      setConnected(false)
      return
    }
    let cancelled = false
    let socket
    let retryTimer

    function connect() {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      socket = new WebSocket(`${proto}://${window.location.host}/ws`)
      wsRef.current = socket

      socket.onopen = () => { if (!cancelled) setConnected(true) }
      socket.onclose = () => {
        if (cancelled) return
        setConnected(false)
        retryTimer = setTimeout(connect, 1500)
      }
      socket.onerror = () => socket.close()
      socket.onmessage = (evt) => {
        let msg
        try { msg = JSON.parse(evt.data) } catch { return }
        const h = handlersRef.current
        if (msg.type === 'log') h.onLog?.(msg.message)
        else if (msg.type === 'log_history') h.onLogHistory?.(msg.messages)
        else if (msg.type === 'status') h.onStatus?.(msg.state, msg.text)
        else if (msg.type === 'lead') h.onLead?.(msg.lead)
        else if (msg.type === 'stats') h.onStats?.(msg.stats)
      }
    }

    connect()
    return () => {
      cancelled = true
      clearTimeout(retryTimer)
      wsRef.current?.close()
    }
  }, [enabled])

  return { connected }
}
