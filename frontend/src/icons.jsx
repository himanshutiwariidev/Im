const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const IconGrid = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
)

export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="8.5" cy="8" r="3.2" />
    <path d="M2.5 20c0-3.4 2.7-6 6-6s6 2.6 6 6" />
    <path d="M15.5 6a3 3 0 0 1 0 5.8" />
    <path d="M17 14.3c2.3.5 4 2.5 4 5.7" />
  </svg>
)

export const IconBot = (p) => (
  <svg {...base} {...p}>
    <rect x="4" y="8" width="16" height="11" rx="2.5" />
    <path d="M12 8V4" />
    <circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="9" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="13.5" r="1.3" fill="currentColor" stroke="none" />
    <path d="M2.5 12v3M21.5 12v3" />
  </svg>
)

export const IconPlay = (p) => (
  <svg {...base} {...p}>
    <path d="M6.5 4.5v15l13-7.5-13-7.5Z" strokeLinejoin="round" fill="currentColor" stroke="none" />
  </svg>
)

export const IconStop = (p) => (
  <svg {...base} {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
  </svg>
)

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12.5 9.5 18 20 6" />
  </svg>
)

export const IconStar = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8L12 3.5Z" strokeLinejoin="round" />
  </svg>
)

export const IconPhone = (p) => (
  <svg {...base} {...p}>
    <path d="M4.5 4h4l1.5 4.5-2.3 1.6a13 13 0 0 0 6.2 6.2l1.6-2.3L20 15.5v4a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3 5.6 1.5 1.5 0 0 1 4.5 4Z" />
  </svg>
)

export const IconSearch = (p) => (
  <svg {...base} {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.3-4.3" />
  </svg>
)

export const IconRefresh = (p) => (
  <svg {...base} {...p}>
    <path d="M3.5 12a8.5 8.5 0 0 1 14.6-6M20.5 12a8.5 8.5 0 0 1-14.6 6" />
    <path d="M18 3v4h-4M6 21v-4h4" />
  </svg>
)

export const IconTrash = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M6 7l1 13.5A1.5 1.5 0 0 0 8.5 22h7a1.5 1.5 0 0 0 1.5-1.5L18 7" />
  </svg>
)

export const IconGlobe = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>
)

export const IconBell = (p) => (
  <svg {...base} {...p}>
    <path d="M18 16v-5a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 16Z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
  </svg>
)

export const IconUser = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c0-3.6 3.4-6.2 7.5-6.2s7.5 2.6 7.5 6.2" />
  </svg>
)

export const IconLock = (p) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="14" height="9.5" rx="2" />
    <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
  </svg>
)

export const IconEye = (p) => (
  <svg {...base} {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
)

export const IconEyeOff = (p) => (
  <svg {...base} {...p}>
    <path d="M3.5 3.5l17 17" />
    <path d="M10.6 5.7A10.9 10.9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.6 15.6 0 0 1-3.4 4.2M7.4 7.3C4.7 8.9 2.5 12 2.5 12s3.5 6.5 9.5 6.5a10 10 0 0 0 3.2-.55" />
    <path d="M9.9 10a2.8 2.8 0 0 0 4 4" />
  </svg>
)

export const IconArrowRight = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12h16" />
    <path d="M13.5 5.5 20 12l-6.5 6.5" />
  </svg>
)

export const IconShield = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 19 6.5v5.5c0 5-3 7.8-7 8.5-4-.7-7-3.5-7-8.5V6.5L12 3.5Z" />
    <path d="M9 12l2 2 4-4.2" />
  </svg>
)

export const IconMail = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
    <path d="M4 7l8 6 8-6" />
  </svg>
)

export const IconChevronDown = (p) => (
  <svg {...base} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IconPower = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5v7" />
    <path d="M7 6.2a7 7 0 1 0 10 0" />
  </svg>
)

export const IconLogin = (p) => (
  <svg {...base} {...p}>
    <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
    <path d="M15 8l4 4-4 4" />
    <path d="M9 12h10" />
  </svg>
)

export const IconWarningTriangle = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4 21.5 20h-19L12 4Z" />
    <path d="M12 10.5v4" />
    <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)

export const IconLogout = (p) => (
  <svg {...base} {...p}>
    <path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
    <path d="M16 16l4-4-4-4" />
    <path d="M20 12H9" />
  </svg>
)

export const IconGear = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.5v2.2M12 18.3v2.2M20.5 12h-2.2M5.7 12H3.5M17.7 6.3l-1.55 1.55M7.85 16.15L6.3 17.7M17.7 17.7l-1.55-1.55M7.85 7.85L6.3 6.3" />
  </svg>
)

export const IconClock = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </svg>
)

export const IconActivity = (p) => (
  <svg {...base} {...p}>
    <path d="M2.5 12h4l2-6 4 12 2-8 1.5 2h5.5" />
  </svg>
)

export const IconClipboard = (p) => (
  <svg {...base} {...p}>
    <rect x="6" y="4.5" width="12" height="16" rx="2" />
    <rect x="9" y="3" width="6" height="3" rx="1" />
    <path d="M9 11h6M9 15h6" />
  </svg>
)

export const IconSave = (p) => (
  <svg {...base} {...p}>
    <path d="M5 4.5h11L20 8.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" />
    <path d="M8 4.5V9h7V4.5" />
    <path d="M8 14h8v6H8v-6Z" />
  </svg>
)
