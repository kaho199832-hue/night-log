import { useTheme } from '../contexts/ThemeContext'

const tabs = [
  { id: 'home', label: 'ホーム', icon: CalIcon },
  { id: 'customers', label: '顧客', icon: PersonIcon },
  { id: 'report', label: 'レポート', icon: ChartIcon },
]

function CalIcon({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill={active ? color : 'currentColor'}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke={active ? color : 'currentColor'} strokeWidth="2"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke={active ? color : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke={active ? color : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke={active ? color : 'currentColor'} strokeWidth="2"/>
    </svg>
  )
}

function PersonIcon({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={active ? color : 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

function ChartIcon({ active, color }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke={active ? color : 'currentColor'} strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

export default function BottomNav({ active, onNavigate }) {
  const { theme } = useTheme()
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      backgroundColor: theme.cardBg,
      borderTop: `1px solid ${theme.border}`,
      display: 'flex', zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {tabs.map(tab => {
        const isActive = active === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            style={{
              flex: 1, padding: '10px 0 8px', border: 'none', background: 'none',
              cursor: 'pointer', display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, minHeight: 56,
              color: isActive ? theme.tabActive : theme.textMuted,
              transition: 'color 0.2s'
            }}
          >
            <Icon active={isActive} color={theme.tabActive} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400 }}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
