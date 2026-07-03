import { useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'

export default function Modal({ title, onClose, children, fullScreen = false }) {
  const { theme } = useTheme()

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 100, display: 'flex', alignItems: fullScreen ? 'stretch' : 'flex-end'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: theme.cardBg, borderRadius: fullScreen ? 0 : '20px 20px 0 0',
          width: '100%', maxHeight: fullScreen ? '100dvh' : '90dvh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 12px', borderBottom: `1px solid ${theme.border}` }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: 24, cursor: 'pointer', marginRight: 12, lineHeight: 1, padding: 4 }}
          >×</button>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: theme.text }}>{title}</h2>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
