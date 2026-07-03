import { useState, useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useFetch, api } from '../hooks/useApi'
import { VisitTypeBadge } from '../components/Badge'
import Avatar from '../components/Avatar'
import VisitForm from './VisitForm'

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']
const FILTER_TABS = ['すべて', '同伴済', '来店済', '来客予定', '誕生日']
const FILTER_MAP = { '同伴済': 'dohan', '来店済': 'normal', '来客予定': 'planned', '誕生日': 'birthday' }

function formatAmount(n) {
  return n ? `¥${Number(n).toLocaleString()}` : ''
}

export default function HomePage({ onNavigateSettings }) {
  const { theme, colors } = useTheme()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [filterTab, setFilterTab] = useState('すべて')
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [editingVisit, setEditingVisit] = useState(null)

  const { data: visits, refetch } = useFetch(`/api/visits?year=${year}&month=${month}`, [year, month])

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // カレンダーグリッド生成
  const calDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1)
    const lastDate = new Date(year, month, 0).getDate()
    const startDow = firstDay.getDay()
    const days = []
    for (let i = 0; i < startDow; i++) days.push(null)
    for (let d = 1; d <= lastDate; d++) days.push(d)
    return days
  }, [year, month])

  // 日ごとの来店データ（session_idでグループ化して1件扱い）
  const visitsByDate = useMemo(() => {
    if (!visits) return {}
    const seenSessions = {}
    const processed = []
    visits.forEach(v => {
      if (v.session_id) {
        if (seenSessions[v.session_id]) {
          seenSessions[v.session_id].customer_name += '・' + v.customer_name
        } else {
          const entry = { ...v }
          seenSessions[v.session_id] = entry
          processed.push(entry)
        }
      } else {
        processed.push({ ...v })
      }
    })
    const map = {}
    processed.forEach(v => {
      if (!map[v.visit_date]) map[v.visit_date] = []
      map[v.visit_date].push(v)
    })
    return map
  }, [visits])

  // 誕生日チェック
  const { data: customers } = useFetch('/api/customers')
  const birthdayDates = useMemo(() => {
    if (!customers) return {}
    const map = {}
    customers.forEach(c => {
      if (c.birthday) {
        // birthday は YYYY-MM-DD または MM-DD 形式で保存される。末尾5文字(MM-DD)を取得
        const mmdd = c.birthday.slice(-5)
        const key = `${year}-${mmdd}`
        if (!map[key]) map[key] = []
        map[key].push(c)
      }
    })
    return map
  }, [customers, year, month])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const getChipsForDate = (dateStr) => {
    const dayVisits = visitsByDate[dateStr] || []
    const bdCustomers = (birthdayDates[dateStr] || []).map(c => ({ id: `bd-${c.id}`, customer_name: c.name, type: 'birthday', is_planned: 0, _isBd: true }))

    let filteredVisits
    if (filterTab === 'すべて') filteredVisits = [...dayVisits, ...bdCustomers]
    else if (filterTab === '来客予定') filteredVisits = dayVisits.filter(v => v.is_planned === 1)
    else if (filterTab === '誕生日') filteredVisits = bdCustomers
    else filteredVisits = dayVisits.filter(v => v.is_planned === 0 && v.type === FILTER_MAP[filterTab])

    const ordered = [
      ...filteredVisits.filter(v => !v._isBd && v.is_planned === 0 && v.type === 'dohan'),
      ...filteredVisits.filter(v => !v._isBd && v.is_planned === 0 && v.type === 'normal'),
      ...filteredVisits.filter(v => v.is_planned === 1),
      ...filteredVisits.filter(v => v._isBd),
    ]

    return ordered.slice(0, 2)
  }

  const getChipColor = (v) => {
    if (v._isBd) return colors.birthday
    if (v.is_planned === 1) return colors.planned
    if (v.type === 'dohan') return colors.dohan
    if (v.type === 'birthday') return colors.birthday
    return colors.normal
  }

  // 日付パネルのデータ
  const selectedVisits = useMemo(() => {
    if (!selectedDate) return []
    const dayVisits = visitsByDate[selectedDate] || []
    return [...dayVisits.filter(v => v.is_planned === 0), ...dayVisits.filter(v => v.is_planned === 1)]
  }, [selectedDate, visitsByDate])

  const deleteVisit = async (v) => {
    if (!window.confirm('この記録を削除しますか？')) return
    if (v.session_id) {
      await api.delete(`/api/visits/session/${v.session_id}`)
    } else {
      await api.delete(`/api/visits/${v.id}`)
    }
    refetch()
  }

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100dvh', paddingBottom: 80 }}>
      {/* ヘッダー */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>ホーム</h1>
        <button onClick={onNavigateSettings} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: 22, cursor: 'pointer', padding: 4 }}>⚙️</button>
      </div>

      {/* 月ナビ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '0 16px 12px' }}>
        <button onClick={prevMonth} style={{ background: 'none', border: 'none', color: theme.text, fontSize: 22, cursor: 'pointer', padding: 8 }}>‹</button>
        <span style={{ fontSize: 18, fontWeight: 700, minWidth: 120, textAlign: 'center' }}>{year}年{month}月</span>
        <button onClick={nextMonth} style={{ background: 'none', border: 'none', color: theme.text, fontSize: 22, cursor: 'pointer', padding: 8 }}>›</button>
      </div>

      {/* カレンダー */}
      <div style={{ padding: '0 8px' }}>
        {/* 曜日ヘッダー */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          borderTop: `1px solid ${theme.border}`, borderLeft: `1px solid ${theme.border}`
        }}>
          {WEEKDAYS.map((d, i) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 12, fontWeight: 700, padding: '6px 0',
              borderRight: `1px solid ${theme.border}`, borderBottom: `1px solid ${theme.border}`,
              color: i === 0 ? '#f87171' : i === 6 ? '#60a5fa' : theme.textMuted
            }}>
              {d}
            </div>
          ))}
        </div>
        {/* 日グリッド */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderLeft: `1px solid ${theme.border}` }}>
          {calDays.map((day, idx) => {
            const cellBorder = {
              borderRight: `1px solid ${theme.border}`,
              borderBottom: `1px solid ${theme.border}`
            }
            if (!day) return <div key={`empty-${idx}`} style={{ height: 72, ...cellBorder }} />
            const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const isToday = dateStr === todayStr
            const isSelected = dateStr === selectedDate
            const dow = (new Date(year, month - 1, day).getDay())
            const chips = getChipsForDate(dateStr)
            const hasMore = (visitsByDate[dateStr]?.length || 0) > 2

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                style={{
                  height: 72, padding: '4px 3px', cursor: 'pointer',
                  overflow: 'hidden',
                  ...cellBorder,
                  backgroundColor: isSelected ? theme.accent + '22' : 'transparent',
                  boxShadow: isSelected ? `inset 0 0 0 2px ${theme.accent}` : 'none',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: 2 }}>
                  {isToday
                    ? <span style={{ display: 'inline-block', width: 22, height: 22, lineHeight: '22px', borderRadius: '50%', fontSize: 12, fontWeight: 700, backgroundColor: theme.todayBg, color: '#fff' }}>{day}</span>
                    : <span style={{ fontSize: 12, fontWeight: 600, color: dow === 0 ? '#f87171' : dow === 6 ? '#60a5fa' : theme.text }}>{day}</span>
                  }
                </div>
                {chips.map((v, ci) => (
                  <div key={v.id || ci} style={{
                    fontSize: 9, padding: '2px 3px', borderRadius: 3, marginBottom: 2,
                    backgroundColor: v.is_planned === 1 ? 'transparent' : getChipColor(v) + 'CC',
                    border: v.is_planned === 1 ? `1px solid ${getChipColor(v)}` : 'none',
                    color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {v.is_planned === 1 ? `予 ${v.customer_name}` : v.customer_name}
                  </div>
                ))}
                {hasMore && <div style={{ fontSize: 9, color: theme.textMuted, textAlign: 'center' }}>+</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* フィルタータブ */}
      <div style={{ display: 'flex', overflowX: 'auto', padding: '12px 8px 0', gap: 6, scrollbarWidth: 'none' }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: `1px solid ${filterTab === tab ? theme.accent : theme.border}`,
              backgroundColor: filterTab === tab ? theme.accent : 'transparent',
              color: filterTab === tab ? '#fff' : theme.textMuted,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >{tab}</button>
        ))}
      </div>

      {/* 日付パネル */}
      {selectedDate && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              {selectedDate.replace(/-/g, '/')}
            </h3>
            <button
              onClick={() => setShowVisitForm(true)}
              style={{
                padding: '8px 16px', borderRadius: 8, background: `linear-gradient(135deg, ${theme.accent}, var(--sub))`,
                color: '#fff', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer'
              }}
            >+ 追加</button>
          </div>

          {selectedVisits.length === 0
            ? <div style={{ textAlign: 'center', color: theme.textMuted, padding: '20px 0' }}>記録がありません</div>
            : selectedVisits.map(v => (
              <div key={v.id} style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={v.customer_name} photoUrl={null} size={36} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{v.customer_name}</div>
                      {v.visit_time && <div style={{ fontSize: 12, color: theme.textMuted }}>{v.visit_time}</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {v.is_planned === 1
                      ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, border: `1px solid ${colors.planned}`, color: colors.planned }}>予定</span>
                      : <VisitTypeBadge type={v.type} />
                    }
                    <button onClick={() => setEditingVisit(v)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: 15, padding: 4 }}>✏️</button>
                    <button onClick={() => deleteVisit(v)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: 4 }}>🗑</button>
                  </div>
                </div>
                {v.is_planned === 0 && (
                  <div style={{ marginTop: 10, display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap' }}>
                    {v.amount > 0 && <span>売上: <strong>{formatAmount(v.amount)}</strong></span>}
                    {v.sets && <span>セット: <strong>{v.sets}</strong></span>}
                    {v.bottles?.length > 0 && <span>ボトル: {v.bottles.map(b => `${b.name}×${b.count}`).join('、')}</span>}
                  </div>
                )}
                {v.memo && <div style={{ marginTop: 8, fontSize: 13, color: theme.textMuted }}>{v.memo}</div>}
              </div>
            ))
          }
        </div>
      )}

      {/* 追加ボタン（日付未選択時） */}
      {!selectedDate && (
        <div style={{ padding: '16px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setShowVisitForm(true)}
            style={{
              padding: '12px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${theme.accent}, var(--sub))`,
              color: '#fff', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer'
            }}
          >+ 来店を追加</button>
        </div>
      )}

      {showVisitForm && (
        <VisitForm
          initialDate={selectedDate || todayStr}
          onClose={() => setShowVisitForm(false)}
          onSave={() => { refetch(); setShowVisitForm(false) }}
        />
      )}
      {editingVisit && (
        <VisitForm
          visit={editingVisit}
          onClose={() => setEditingVisit(null)}
          onSave={() => { refetch(); setEditingVisit(null) }}
        />
      )}
    </div>
  )
}
