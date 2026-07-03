import { useTheme } from '../contexts/ThemeContext'

const TYPE_LABEL = { dohan: '同伴', normal: '来店', birthday: '誕生日' }

export function VisitTypeBadge({ type }) {
  const { colors } = useTheme()
  const colorMap = { dohan: colors.dohan, normal: colors.normal, birthday: colors.birthday }
  const color = colorMap[type] || colors.normal
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11,
      fontWeight: 700, backgroundColor: color + '33', color: color, border: `1px solid ${color}`
    }}>
      {TYPE_LABEL[type] || type}
    </span>
  )
}

export function RankBadge({ rank }) {
  const { theme } = useTheme()
  const styles = [
    { bg: '#D4AF37', color: '#000' },
    { bg: '#A8A9AD', color: '#000' },
    { bg: '#CD7F32', color: '#fff' },
  ]
  const s = styles[rank - 1] || { bg: theme.border, color: theme.textMuted }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 24, height: 24, borderRadius: '50%', fontSize: 11, fontWeight: 700,
      backgroundColor: s.bg, color: s.color, flexShrink: 0
    }}>{rank}</span>
  )
}
