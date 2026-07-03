import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useFetch } from '../hooks/useApi'
import Avatar from '../components/Avatar'
import { RankBadge } from '../components/Badge'

function formatAmount(n) {
  return n ? `¥${Number(n).toLocaleString()}` : '¥0'
}

export default function ReportPage() {
  const { theme } = useTheme()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const { data: summary } = useFetch(`/api/reports/summary?year=${year}&month=${month}`, [year, month])
  const { data: monthly } = useFetch('/api/reports/monthly')
  const { data: ranking } = useFetch(`/api/reports/ranking?year=${year}&month=${month}`, [year, month])
  const { data: bottles } = useFetch(`/api/reports/bottles?year=${year}&month=${month}`, [year, month])

  const currentMonthStr = `${year}-${String(month).padStart(2, '0')}`

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  // 常に6ヶ月分を生成してAPIデータをマージ
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(year, month - 1 - (5 - i))
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const monthlyData = last6Months.map(m => {
    const found = (monthly || []).find(x => x.month === m)
    return found || { month: m, total: 0, visit_count: 0, dohan_count: 0 }
  })

  const maxAmount = Math.max(...monthlyData.map(m => m.total), 1)

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100dvh', paddingBottom: 80 }}>
      {/* ヘッダー */}
      <div style={{ padding: '20px 16px 12px' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>売上レポート</h1>
      </div>

      {/* 月ナビ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 16px 16px' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: theme.text, fontSize: 22, cursor: 'pointer', padding: 8 }}>‹</button>
        <span style={{ fontSize: 18, fontWeight: 700, minWidth: 120, textAlign: 'center' }}>{year}年{month}月</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: theme.text, fontSize: 22, cursor: 'pointer', padding: 8 }}>›</button>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* サマリー */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: '今月売上', value: formatAmount(summary?.total_amount) },
            { label: '指名数', value: `${summary?.visit_count || 0}回` },
            { label: '同伴数', value: `${summary?.dohan_count || 0}回` },
          ].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, backgroundColor: theme.cardBg, borderRadius: 12, padding: '14px 10px', textAlign: 'center', border: `1px solid ${theme.border}` }}>
              <div style={{ fontSize: label === '今月売上' ? 16 : 20, fontWeight: 700, color: theme.accent }}>{value}</div>
              <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 月別棒グラフ */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${theme.border}` }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: theme.textMuted }}>過去6ヶ月の売上</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {monthlyData.map(m => {
              const isCurrent = m.month === currentMonthStr
              const ratio = maxAmount > 0 ? m.total / maxAmount : 0
              const barH = m.total > 0 ? Math.max(ratio * 90, 6) : 3
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 9, color: isCurrent ? theme.accent : theme.textMuted, fontWeight: isCurrent ? 700 : 400, minHeight: 14, textAlign: 'center' }}>
                    {m.total > 0 ? `¥${Math.round(m.total / 10000)}万` : ''}
                  </div>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0', transition: 'height 0.4s',
                    height: `${barH}px`,
                    backgroundColor: isCurrent ? theme.accent : (m.total > 0 ? theme.accent + '88' : theme.border)
                  }} />
                  <div style={{ fontSize: 10, color: isCurrent ? theme.accent : theme.textMuted, fontWeight: isCurrent ? 700 : 400 }}>
                    {m.month?.slice(5)}月
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 顧客ランキング */}
        <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${theme.border}` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: theme.textMuted }}>顧客ランキング（今月）</h3>
          {(!ranking || ranking.length === 0)
            ? <div style={{ textAlign: 'center', color: theme.textMuted, padding: 20 }}>データなし</div>
            : ranking.map((r, i) => {
              const maxR = ranking[0]?.total_amount || 1
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: `1px solid ${theme.border}` }}>
                  <RankBadge rank={i + 1} />
                  <Avatar name={r.name} photoUrl={r.photo_url} size={36} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{r.name}</div>
                    <div style={{ height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', backgroundColor: theme.accent, width: `${(r.total_amount / maxR) * 100}%`, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, color: theme.accent, fontSize: 13 }}>{formatAmount(r.total_amount)}</div>
                    <div style={{ fontSize: 11, color: theme.textMuted }}>{r.visit_count}回</div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* ボトル集計 */}
        {bottles?.length > 0 && (
          <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: theme.textMuted }}>ボトル集計（今月）</h3>
            {bottles.map(b => (
              <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: 14 }}>{b.name}</span>
                <span style={{ fontWeight: 700, color: theme.accent }}>{b.total}本</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
