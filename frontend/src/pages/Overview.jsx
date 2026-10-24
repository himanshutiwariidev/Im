import StatCard from '../components/StatCard'
import { IconUsers, IconUser, IconStar, IconBot } from '../icons'

export default function Overview({ stats, status }) {
  const running = status?.state === 'running'
  return (
    <>
      <div className="stat-grid">
        <StatCard
          icon={IconUsers} iconColor="#4f46e5" iconBg="#eeecfd"
          label="Leads Captured" value={stats.total} caption="Total leads captured"
          decoration="wave" decorationColor="#7c6ef0"
        />
        <StatCard
          icon={IconUser} iconColor="#2563eb" iconBg="#e6f0ff"
          label="Priority Leads" value={stats.priority_count} caption="High priority leads"
          decoration="wave" decorationColor="#4d94ff"
        />
        <StatCard
          icon={IconStar} iconColor="#0d9488" iconBg="#e3faf5"
          label="Avg Match Score" value={stats.avg_score ? stats.avg_score : '—'} caption="Average keyword match"
          decoration="wave" decorationColor="#2fbfa8"
        />
        <StatCard
          icon={IconBot} iconColor="#d97706" iconBg="#fef6e7"
          label="Bot Status" value={status?.text || 'Stopped'}
          caption={running ? 'Bot is watching leads' : 'Bot is not running'}
          decoration="ring" decorationColor="#f0983c" ringValue={running ? 100 : 8}
        />
      </div>

      {status?.state !== 'running' && (
        <div className="login-banner" style={{
          background: status?.state === 'waiting' ? 'var(--warning-bg)' : 'var(--primary-bg)',
          border: `1px solid ${status?.state === 'waiting' ? '#f6d9a8' : '#d9d6fb'}`,
          color: status?.state === 'waiting' ? '#92610a' : 'var(--primary-hover)',
        }}>
          <IconBot />
          <div>
            {status?.state === 'waiting'
              ? 'A browser window is open and waiting for you to log into IndiaMart. Confirm login in Bot Control below.'
              : "The bot isn't running yet. Set your keywords in Bot Control below and start capturing leads."}
          </div>
        </div>
      )}
    </>
  )
}
