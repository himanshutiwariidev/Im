import { useState } from 'react'
import { login } from '../api'
import { IconUser, IconLock, IconEye, IconEyeOff, IconArrowRight, IconShield } from '../icons'

export default function Login({ onAuthenticated }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(username.trim(), password)
      onAuthenticated()
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <style>{loginCss}</style>
      <div className="login-page__deco login-page__deco--lines" />
      <div className="login-page__deco login-page__deco--dots" />

      <div className="login-card">
        <div className="login-card__brand">
          <div className="login-card__deco-lines" />
          <div className="login-card__deco-dots" />

          <h1 className="login-card__title">IndiaMart CRM</h1>
          <div className="login-card__tagline">Lead Bot Pro</div>
          <div className="login-card__divider" />
          <p className="login-card__desc">
            Manage leads, automate follow-ups and grow your business with IndiaMart CRM.
          </p>

          <div className="login-card__spacer" />

          <div className="login-illustration">
            <svg viewBox="0 0 220 100" width="100%" height="100">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <rect
                  key={i}
                  x={10 + i * 20}
                  y={70 - [22, 40, 30, 55, 38, 62][i]}
                  width="12"
                  height={[22, 40, 30, 55, 38, 62][i]}
                  rx="2.5"
                  fill="rgba(255,255,255,0.16)"
                />
              ))}
              <polyline
                points="16,55 36,42 56,50 76,25 96,35 116,15 136,30"
                fill="none"
                stroke="#ffc532"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
              <circle cx="76" cy="25" r="3.5" fill="#ffc532" />
              <circle cx="116" cy="15" r="3" fill="#fff" opacity="0.85" />

              <circle cx="168" cy="55" r="18" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
              <circle
                cx="168" cy="55" r="18" fill="none" stroke="#ffc532" strokeWidth="9"
                strokeDasharray="70 113" strokeLinecap="round" opacity="0.9"
                transform="rotate(-90 168 55)"
              />

              <rect x="150" y="82" width="55" height="4" rx="2" fill="rgba(255,255,255,0.16)" />
              <rect x="150" y="90" width="38" height="4" rx="2" fill="rgba(255,255,255,0.1)" />
            </svg>
          </div>
        </div>

        <div className="login-card__form">
          <div className="login-card__badge">
            <IconShield width={14} height={14} />
            Secure Login
          </div>

          <h2 className="login-card__welcome">Welcome back 👋</h2>
          <p className="login-card__sub">Sign in to access your IndiaMart CRM dashboard.</p>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label>Username</label>
              <div className="login-input">
                <IconUser width={16} height={16} className="login-input__icon" />
                <input
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-field">
              <label>Password</label>
              <div className="login-input">
                <IconLock width={16} height={16} className="login-input__icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-input__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <IconEyeOff width={16} height={16} /> : <IconEye width={16} height={16} />}
                </button>
              </div>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="login-submit" disabled={busy} type="submit">
              {busy ? 'Please wait…' : 'Sign In'}
              {!busy && <IconArrowRight width={16} height={16} />}
            </button>
          </form>

          <div className="login-card__trust">
            <IconShield width={13} height={13} />
            Your data is <strong>100% secure</strong> and encrypted
          </div>
        </div>
      </div>
    </div>
  )
}

const loginCss = `
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #f6f6fb 0%, #eeeafd 100%);
  position: relative;
  overflow: hidden;
}
.login-page__deco { position: absolute; pointer-events: none; }
.login-page__deco--lines {
  top: 0; left: 0; width: 340px; height: 340px;
  background: repeating-linear-gradient(45deg, rgba(124,102,222,0.16) 0 2px, transparent 2px 20px);
  -webkit-mask-image: radial-gradient(circle at 0 0, black 0%, transparent 70%);
          mask-image: radial-gradient(circle at 0 0, black 0%, transparent 70%);
}
.login-page__deco--dots {
  bottom: 0; right: 0; width: 380px; height: 380px;
  background-image: radial-gradient(rgba(124,102,222,0.28) 1.4px, transparent 1.6px);
  background-size: 18px 18px;
  -webkit-mask-image: radial-gradient(circle at 100% 100%, black 0%, transparent 70%);
          mask-image: radial-gradient(circle at 100% 100%, black 0%, transparent 70%);
}

.login-card {
  position: relative;
  z-index: 1;
  width: min(900px, 92vw);
  min-height: 560px;
  display: flex;
  background: var(--surface);
  border-radius: 22px;
  box-shadow: 0 30px 70px rgba(40, 20, 90, 0.18);
  overflow: hidden;
}

.login-card__brand {
  flex: 0 0 42%;
  position: relative;
  overflow: hidden;
  padding: 40px 36px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(150deg, #1c1046 0%, #3b1f8f 48%, #6a3fd8 100%);
  color: white;
}
.login-card__deco-lines {
  position: absolute; top: 0; left: 0; width: 180px; height: 180px;
  background: repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 18px);
  -webkit-mask-image: radial-gradient(circle at 0 0, black 0%, transparent 75%);
          mask-image: radial-gradient(circle at 0 0, black 0%, transparent 75%);
}
.login-card__deco-dots {
  position: absolute; bottom: 0; right: 0; width: 200px; height: 200px;
  background-image: radial-gradient(rgba(255,255,255,0.14) 1.4px, transparent 1.6px);
  background-size: 16px 16px;
  -webkit-mask-image: radial-gradient(circle at 100% 100%, black 0%, transparent 75%);
          mask-image: radial-gradient(circle at 100% 100%, black 0%, transparent 75%);
}

.login-card__title {
  position: relative; z-index: 1;
  font-size: 26px; font-weight: 800; margin: 0 0 2px; letter-spacing: -0.3px;
}
.login-card__tagline {
  position: relative; z-index: 1;
  color: #ffc532; font-weight: 700; font-size: 14.5px;
}
.login-card__divider {
  position: relative; z-index: 1;
  width: 44px; height: 3px; border-radius: 3px;
  background: rgba(255,255,255,0.35); margin: 20px 0 16px;
}
.login-card__desc {
  position: relative; z-index: 1;
  font-size: 13.5px; line-height: 1.6; color: rgba(255,255,255,0.75);
  max-width: 240px; margin: 0;
}
.login-card__spacer { flex: 1; }

.login-illustration {
  position: relative; z-index: 1;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 14px;
  padding: 10px 12px 4px;
}

.login-card__form {
  flex: 1;
  padding: 40px 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.login-card__badge {
  align-self: flex-end;
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--text-faint);
  margin-bottom: 18px;
}
.login-card__welcome { font-size: 25px; font-weight: 800; margin: 0 0 6px; color: var(--text); }
.login-card__sub { font-size: 13.5px; color: var(--text-muted); margin: 0 0 26px; }

.login-field { margin-bottom: 18px; }
.login-field label {
  display: block; font-size: 12.5px; font-weight: 700; color: var(--text-muted); margin-bottom: 7px;
}
.login-input {
  display: flex; align-items: center; gap: 10px;
  border: 1.5px solid var(--border-strong);
  background: var(--surface-alt);
  border-radius: 10px;
  padding: 0 14px;
  transition: border-color .12s ease, box-shadow .12s ease, background .12s ease;
}
.login-input:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-bg);
  background: var(--surface);
}
.login-input__icon { color: var(--text-faint); flex-shrink: 0; }
.login-input input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 14px; color: var(--text); padding: 12px 0; font-family: inherit;
}
.login-input__toggle {
  background: none; border: none; padding: 4px; cursor: pointer;
  color: var(--text-faint); display: flex; align-items: center;
}
.login-input__toggle:hover { color: var(--text-muted); }

.login-error {
  background: var(--danger-bg); color: var(--danger); font-size: 12.5px; font-weight: 600;
  border-radius: 8px; padding: 10px 12px; margin-bottom: 16px;
}

.login-submit {
  width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: white; font-weight: 700; font-size: 14.5px;
  border: none; border-radius: 10px; padding: 13px 16px;
  cursor: pointer; margin-top: 6px;
  transition: opacity .12s ease, transform .05s ease;
}
.login-submit:hover:not(:disabled) { opacity: 0.92; }
.login-submit:active:not(:disabled) { transform: translateY(1px); }
.login-submit:disabled { opacity: 0.6; cursor: not-allowed; }

.login-card__trust {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 22px; font-size: 12px; color: var(--text-faint);
}
.login-card__trust strong { color: var(--primary); font-weight: 700; }

@media (max-width: 720px) {
  .login-card { flex-direction: column; min-height: 0; }
  .login-card__brand { flex: none; padding: 28px; }
  .login-card__form { padding: 28px; }
  .login-illustration { display: none; }
}
`
