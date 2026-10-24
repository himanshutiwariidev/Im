import { IconChevronDown, IconLogout } from '../icons'

export default function Sidebar({ onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="mark">IM</div>
        <div>
          <div className="name">IndiaMart CRM</div>
          <div className="sub">Lead Bot Pro</div>
        </div>
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">
        <div className="profile-card">
          <div className="profile-card__avatar">IM</div>
          <div className="profile-card__info">
            <div className="profile-card__name">admin</div>
            <div className="profile-card__role">Administrator</div>
          </div>
          <IconChevronDown width={14} height={14} className="profile-card__chevron" />
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <IconLogout width={15} height={15} />
          Logout
        </button>
      </div>
    </aside>
  )
}
