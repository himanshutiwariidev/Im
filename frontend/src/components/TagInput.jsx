import { useState } from 'react'

export default function TagInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState('')

  function commit(raw) {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
    if (parts.length === 0) return
    const next = [...values]
    for (const part of parts) {
      if (!next.some((v) => v.toLowerCase() === part.toLowerCase())) next.push(part)
    }
    onChange(next)
    setDraft('')
  }

  function remove(val) {
    onChange(values.filter((v) => v !== val))
  }

  return (
    <div className="tag-input-v2">
      {values.length > 0 && (
        <div className="tag-input-v2__chips">
          {values.map((v) => (
            <span key={v} className="tag-pill">
              {v}
              <button type="button" onClick={() => remove(v)}>×</button>
            </span>
          ))}
        </div>
      )}
      <input
        className="tag-input-v2__add"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commit(draft)
          } else if (e.key === 'Backspace' && !draft && values.length > 0) {
            onChange(values.slice(0, -1))
          }
        }}
        placeholder={placeholder}
      />
    </div>
  )
}
