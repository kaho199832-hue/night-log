import { createContext, useContext, useState, useEffect } from 'react'

const DEFAULT_UI = {
  bg: '#0F0A1E',
  cardBg: '#1A1030',
  text: '#F3F4F6',
  accent: '#A855F7',
}

function isDark(hex) {
  if (!hex || hex.length < 7) return true
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b < 128
}

function blend(hex1, hex2, ratio) {
  const parse = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]
  const [r1,g1,b1] = parse(hex1), [r2,g2,b2] = parse(hex2)
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')
  return '#' + c(r1*ratio+r2*(1-ratio)) + c(g1*ratio+g2*(1-ratio)) + c(b1*ratio+b2*(1-ratio))
}

const KEY_MAP = {
  bg: 'ui_bg', cardBg: 'ui_card_bg', text: 'ui_text', accent: 'ui_accent'
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [ui, setUi] = useState(DEFAULT_UI)
  const [colors, setColors] = useState({
    dohan: '#7F77DD', normal: '#888780', birthday: '#F0997B', planned: '#7F77DD'
  })

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(s => {
        setUi({
          bg: s.ui_bg || DEFAULT_UI.bg,
          cardBg: s.ui_card_bg || DEFAULT_UI.cardBg,
          text: s.ui_text || DEFAULT_UI.text,
          accent: s.ui_accent || DEFAULT_UI.accent,
        })
        setColors({
          dohan: s.color_dohan || '#7F77DD',
          normal: s.color_normal || '#888780',
          birthday: s.color_birthday || '#F0997B',
          planned: s.color_planned || '#7F77DD'
        })
      })
      .catch(() => {})
  }, [])

  const dark = isDark(ui.bg)
  const theme = {
    ...ui,
    textMuted: blend(ui.text, ui.bg, 0.5),
    border: blend(ui.text, ui.bg, 0.15),
    sub: ui.accent,
    todayBg: ui.accent,
    tabActive: ui.accent,
    dark,
  }

  const setUiColor = async (key, value) => {
    setUi(prev => ({ ...prev, [key]: value }))
    const settingKey = KEY_MAP[key]
    if (settingKey) {
      await fetch(`/api/settings/${settingKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      })
    }
  }

  const resetUi = async () => {
    setUi({ ...DEFAULT_UI })
    await fetch('/api/settings/reset-ui', { method: 'POST' })
  }

  const setColor = async (key, value) => {
    setColors(prev => ({ ...prev, [key]: value }))
    await fetch(`/api/settings/color_${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
  }

  const resetColors = async () => {
    const defaults = { dohan: '#7F77DD', normal: '#888780', birthday: '#F0997B', planned: '#7F77DD' }
    setColors(defaults)
    await fetch('/api/settings/reset-colors', { method: 'POST' })
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, setUiColor, resetUi, setColor, resetColors }}>
      <div style={{
        '--bg': ui.bg, '--card-bg': ui.cardBg, '--text': ui.text,
        '--text-muted': theme.textMuted, '--border': theme.border,
        '--accent': ui.accent, '--tab-active': ui.accent,
        '--today-bg': ui.accent, '--key': ui.accent, '--sub': ui.accent,
        backgroundColor: ui.bg, color: ui.text, minHeight: '100dvh'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
