function Sparkline({ color }) {
  return (
    <svg width="72" height="34" viewBox="0 0 72 34" fill="none">
      <path
        d="M2 24 L14 16 L26 20 L38 8 L50 14 L62 4 L70 10"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      <path
        d="M2 24 L14 16 L26 20 L38 8 L50 14 L62 4 L70 10 L70 34 L2 34 Z"
        fill={color}
        opacity="0.08"
      />
    </svg>
  )
}

function Ring({ color, value = 0 }) {
  const r = 15
  const c = 2 * Math.PI * r
  const filled = Math.max(0.06, value / 100)
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#f0f0f6" strokeWidth="6" />
      <circle
        cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${c * filled} ${c}`} strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
    </svg>
  )
}

export default function StatCard({ icon: Icon, iconColor, iconBg, label, value, caption, decoration, decorationColor, ringValue }) {
  return (
    <div className="stat-card">
      <div className="stat-card__left">
        <div className="stat-top">
          <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
            <Icon width={16} height={16} />
          </div>
          <div className="stat-label">{label}</div>
        </div>
        <div className="stat-value">{value}</div>
        {caption && <div className="stat-caption">{caption}</div>}
      </div>
      <div className="stat-card__deco">
        {decoration === 'wave' && <Sparkline color={decorationColor} />}
        {decoration === 'ring' && <Ring color={decorationColor} value={ringValue} />}
      </div>
    </div>
  )
}
