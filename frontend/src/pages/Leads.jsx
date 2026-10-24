import { useMemo, useState } from 'react'
import { IconUsers, IconStar, IconGlobe, IconSearch, IconMail, IconChevronDown } from '../icons'
import { formatDateTime, timeAgo } from '../format'

export default function Leads({ leads }) {
  const [query, setQuery] = useState('')
  const [priorityOnly, setPriorityOnly] = useState(false)

  const filtered = useMemo(() => {
    let rows = leads
    if (priorityOnly) rows = rows.filter((l) => l.is_priority)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      rows = rows.filter(
        (l) => l.title.toLowerCase().includes(q) || l.country.toLowerCase().includes(q)
      )
    }
    return rows
  }, [leads, query, priorityOnly])

  return (
    <>
      <div className="section-header">
        <IconUsers width={19} height={19} />
        <h2>Leads</h2>
      </div>

      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h3>All Leads ({filtered.length})</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className={`dropdown-chip ${priorityOnly ? 'active' : ''}`}
              onClick={() => setPriorityOnly((v) => !v)}
            >
              <IconStar width={13} height={13} /> Priority only
              <IconChevronDown width={13} height={13} />
            </button>
            <div className="search-input-wrap">
              <IconSearch width={15} height={15} />
              <input
                className="input"
                placeholder="Search title or country…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <IconMail width={32} height={32} />
            <div className="title">No leads found</div>
            <div className="sub">
              {leads.length === 0 ? 'Start the bot to begin auto-capturing matching leads.' : 'Try a different search or clear the filter.'}
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Country</th>
                  <th>Score</th>
                  <th>Matched Keywords</th>
                  <th>Captured</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="lead-title">{l.title}</div>
                      {!!l.is_priority && (
                        <span className="badge badge-priority">
                          <IconStar width={11} height={11} /> Priority
                        </span>
                      )}
                    </td>
                    <td><span className="badge badge-neutral"><IconGlobe width={11} height={11} /> {l.country}</span></td>
                    <td>
                      <div className="score-wrap">
                        <div className="score-track"><div className="score-fill" style={{ width: `${l.score}%` }} /></div>
                        <span className="score-num">{l.score}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>{l.matched_keywords || '—'}</td>
                    <td className="lead-time" title={formatDateTime(l.captured_at)}>{timeAgo(l.captured_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
