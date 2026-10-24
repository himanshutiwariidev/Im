export default function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="knob" />
    </button>
  )
}
