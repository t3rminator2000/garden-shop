// Набор SVG-иконок одного стиля (контур 1.6 px). Эмодзи в интерфейсе не используются.
const PATHS = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></>),
  heart: <path d="M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z" />,
  user: (<><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20c0-3.9 3.4-6 7.5-6s7.5 2.1 7.5 6" /></>),
  cart: (<><path d="M3 4h2.2l2.1 10.5h10.4L20 7.5H6.1" /><circle cx="9.5" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></>),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  'chevron-up': <path d="m6 15 6-6 6 6" />,
  'chevron-left': <path d="m15 6-6 6 6 6" />,
  'chevron-right': <path d="m9 6 6 6-6 6" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  star: <path d="m12 3.6 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.9l6-.8z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  truck: (<><path d="M3 6.5h11v9.5H3zM14 10h4.2l2.8 3v3h-7" /><circle cx="7.5" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></>),
  card: (<><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="M3 10h18M7 15h3" /></>),
  store: <path d="m4 9 1.6-5h12.8L20 9M4 9h16M4 9v10.5h16V9M9.5 19.5v-5h5v5" />,
  eye: (<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></>),
  alert: (<><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></>),
  filter: <path d="M4 6.5h16M7 12h10M10 17.5h4" />,
  zoom: (<><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M11 8.2v5.6M8.2 11h5.6" /></>),
  sprout: (<><path d="M12 21v-9" /><path d="M12 13c0-3.9 2.9-6 7-6 0 3.9-2.9 6-7 6z" /><path d="M12 16c0-3-2.3-5-6-5 0 3 2.3 5 6 5z" /></>),
  leaf: (<><path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14z" /><path d="M5 19 13 11" /></>),
  logout: <path d="M10 5H5.5v14H10M14 8l4 4-4 4M18 12H9" />,
  box: <path d="m12 3 8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10" />,
  refresh: <path d="M20 6v5h-5M4 18v-5h5M18.2 10A7 7 0 0 0 6 7.5M5.8 14A7 7 0 0 0 18 16.5" />,
  compare: <path d="M6 20V10M12 20V4M18 20v-7M3 20h18" />,
  print: (<><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="7" rx="2" /><path d="M7 14h10v6H7z" /></>),
  upload: <path d="M12 16V4M8 8l4-4 4 4M5 15v4h14v-4" />,
  download: <path d="M12 4v12M8 12l4 4 4-4M5 15v4h14v-4" />,
  tag: (<><path d="M4 11.5V4h7.5L20 12.5 12.5 20z" /><circle cx="8.2" cy="7.8" r="1.3" /></>),
}

export default function Icon({ name, size = 20, className = '', strokeWidth = 1.6, filled = false }) {
  const content = PATHS[name]
  if (!content) return null
  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {content}
    </svg>
  )
}
