import { useRef, useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'

const UI_COLORS = [
  {
    key: 'bg', label: '背景', description: 'アプリのメイン背景色',
    presets: ['#0A0A0A','#0F0A1E','#0A0800','#020C18','#0F0008','#111827','#1E1B2E','#FFFFFF','#F9FAFB','#F0F9FF','#FFFBF0','#F8F5FF']
  },
  {
    key: 'cardBg', label: 'カード・モーダル', description: 'カードやポップアップの背景',
    presets: ['#1A1A2E','#1A1030','#1A1500','#1C1917','#1E293B','#262626','#3F3F46','#F3F4F6','#FFFFFF','#EDE9FE','#E0F2FE','#FEF9C3']
  },
  {
    key: 'text', label: 'メイン文字', description: '通常テキストの色',
    presets: ['#FFFFFF','#F3F4F6','#E5E7EB','#D1D5DB','#111827','#1F2937','#374151','#0F172A']
  },
  {
    key: 'accent', label: 'ボタン色', description: 'ボタン・選択状態・ハイライト色',
    presets: ['#A855F7','#8B5CF6','#6366F1','#3B82F6','#0EA5E9','#06B6D4','#10B981','#F59E0B','#EF4444','#F43F5E','#EC4899','#D4AF37','#C0C0C0','#E2C97E']
  },
]

const VISIT_COLORS = [
  { key: 'dohan', label: '同伴あり' },
  { key: 'normal', label: '来店のみ' },
  { key: 'birthday', label: '誕生日' },
  { key: 'planned', label: '来客予定' },
]

const VISIT_PRESETS = [
  '#7F77DD','#6366F1','#8B5CF6','#A855F7','#EC4899','#F43F5E',
  '#EF4444','#F97316','#F59E0B','#EAB308','#22C55E','#10B981',
  '#06B6D4','#0EA5E9','#3B82F6','#888780','#71717A','#F0997B',
  '#D4AF37','#C0C0C0'
]

function UiColorRow({ config, value, onChange }) {
  const { theme } = useTheme()
  const inputRef = useRef(null)

  return (
    <div style={{ padding: '14px 0', borderBottom: `1px solid ${theme.border}` }}>
      {/* ラベル行 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            width: 48, height: 48, borderRadius: 12, backgroundColor: value, flexShrink: 0,
            cursor: 'pointer', border: `2px solid ${theme.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)'
          }}
        />
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{config.label}</div>
          <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 1 }}>{config.description}</div>
        </div>
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            fontSize: 11, color: theme.accent, fontFamily: 'monospace', cursor: 'pointer',
            border: `1px solid ${theme.accent}44`, borderRadius: 6, padding: '3px 7px'
          }}
        >{value}</div>
      </div>
      {/* プリセット */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {config.presets.map(p => (
          <div
            key={p}
            onClick={() => onChange(p)}
            style={{
              width: 30, height: 30, borderRadius: 7, backgroundColor: p, cursor: 'pointer',
              border: p.toLowerCase() === value.toLowerCase()
                ? `2.5px solid ${theme.accent}`
                : `2px solid ${theme.border}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {p.toLowerCase() === value.toLowerCase() && (
              <span style={{ fontSize: 12, color: '#fff', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>✓</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function VisitColorRow({ item, value, onChange }) {
  const { theme } = useTheme()
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)

  return (
    <div style={{ padding: '12px 0', borderBottom: `1px solid ${theme.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: open ? 12 : 0 }}>
        <div
          onClick={() => setOpen(o => !o)}
          style={{
            width: 40, height: 40, borderRadius: 10, backgroundColor: value, flexShrink: 0,
            cursor: 'pointer', border: `2px solid ${theme.border}`
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>{item.label}</div>
          <div style={{ fontSize: 11, color: theme.textMuted }}>{value}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => { inputRef.current?.click() }}
            style={{ fontSize: 12, color: theme.textMuted, background: 'none', border: `1px solid ${theme.border}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}
          >カスタム</button>
          <input
            ref={inputRef}
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ position: 'fixed', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
          />
          <button
            onClick={() => setOpen(o => !o)}
            style={{
              fontSize: 12, color: theme.accent, background: `${theme.accent}15`,
              border: `1px solid ${theme.accent}44`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer'
            }}
          >{open ? '閉じる' : 'パレット'}</button>
        </div>
      </div>
      {open && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {VISIT_PRESETS.map(p => (
            <div
              key={p}
              onClick={() => { onChange(p); setOpen(false) }}
              style={{
                width: 32, height: 32, borderRadius: 7, backgroundColor: p, cursor: 'pointer',
                border: p.toLowerCase() === value.toLowerCase() ? `2.5px solid ${theme.accent}` : `2px solid ${theme.border}`,
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {p.toLowerCase() === value.toLowerCase() && (
                <span style={{ fontSize: 11, color: '#fff', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage({ onBack }) {
  const { theme, colors, setUiColor, resetUi, setColor, resetColors } = useTheme()

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100dvh', paddingBottom: 80 }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 16px 12px', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: 24, cursor: 'pointer', padding: 4, lineHeight: 1 }}>‹</button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>設定</h1>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* UIカラー設定 */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>UIカラー</h2>
            <button
              onClick={() => { if (window.confirm('UIカラーをデフォルトに戻しますか？')) resetUi() }}
              style={{ fontSize: 12, color: theme.textMuted, background: 'none', border: `1px solid ${theme.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
            >リセット</button>
          </div>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: theme.textMuted }}>
            スウォッチをタップすると色を自由に選べます。下のプリセットからも選択できます。
          </p>
          {UI_COLORS.map(config => (
            <UiColorRow
              key={config.key}
              config={config}
              value={theme[config.key] || '#000000'}
              onChange={val => setUiColor(config.key, val)}
            />
          ))}
        </div>

        {/* 来店種別カラー */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: 16, padding: 18, border: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>来店種別カラー</h2>
            <button
              onClick={() => { if (window.confirm('種別カラーをデフォルトに戻しますか？')) resetColors() }}
              style={{ fontSize: 12, color: theme.textMuted, background: 'none', border: `1px solid ${theme.border}`, borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}
            >リセット</button>
          </div>
          {VISIT_COLORS.map(item => (
            <VisitColorRow
              key={item.key}
              item={item}
              value={colors[item.key]}
              onChange={val => setColor(item.key, val)}
            />
          ))}
        </div>

        <div style={{ textAlign: 'center', color: theme.textMuted, fontSize: 12, padding: '8px 0 24px' }}>
          ナイトCRM v1.0.0
        </div>
      </div>
    </div>
  )
}
