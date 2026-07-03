import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useFetch, api } from '../hooks/useApi'
import Modal from '../components/Modal'
import CustomerForm from './CustomerForm'

function getNowTime() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(Math.floor(now.getMinutes() / 5) * 5).padStart(2, '0')
  return `${h}:${m}`
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55']

const KINDS = [
  { value: 'normal',  label: '来店のみ' },
  { value: 'dohan',   label: '同伴あり' },
  { value: 'birthday',label: '誕生日'   },
  { value: 'planned', label: '来客予定' },
]

export default function VisitForm({ initialDate, onClose, onSave, visit }) {
  const isEdit = !!visit
  const { theme } = useTheme()
  const { data: customers, refetch: refetchCustomers } = useFetch('/api/customers')
  const [showNewCustomer, setShowNewCustomer] = useState(false)

  const [kind, setKind] = useState(() => {
    if (visit) return visit.is_planned === 1 ? 'planned' : (visit.type || 'normal')
    return 'normal'
  })
  const [selectedIds, setSelectedIds] = useState(visit ? [visit.customer_id] : [])
  const [form, setForm] = useState({
    visit_date: visit ? visit.visit_date : (initialDate || new Date().toISOString().slice(0, 10)),
    visit_time: visit ? (visit.visit_time || getNowTime()) : getNowTime(),
    sets: visit ? (visit.sets || '') : '',
    amount: visit ? (visit.amount || '') : '',
    memo: visit ? (visit.memo || '') : '',
  })
  const [useTime, setUseTime] = useState(visit ? !!visit.visit_time : true)
  const [bottles, setBottles] = useState(visit?.bottles || [])
  const [bottleName, setBottleName] = useState('')
  const [bottleCount, setBottleCount] = useState('1')
  const [saving, setSaving] = useState(false)

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const addCustomer = (id) => {
    const numId = parseInt(id)
    if (!numId || selectedIds.includes(numId)) return
    setSelectedIds(prev => [...prev, numId])
  }
  const removeCustomer = (id) => setSelectedIds(prev => prev.filter(x => x !== id))

  const addBottle = () => {
    if (!bottleName.trim()) return
    setBottles(prev => [...prev, { name: bottleName.trim(), count: parseInt(bottleCount) || 1 }])
    setBottleName('')
    setBottleCount('1')
  }
  const removeBottle = (i) => setBottles(prev => prev.filter((_, idx) => idx !== i))

  const isPlanned = kind === 'planned'

  const handleSave = async () => {
    if (selectedIds.length === 0) return alert('顧客を選択してください')
    if (!form.visit_date) return alert('日付を入力してください')
    setSaving(true)
    try {
      const finalBottles = [...bottles]
      if (!isPlanned && bottleName.trim()) {
        finalBottles.push({ name: bottleName.trim(), count: parseInt(bottleCount) || 1 })
      }
      const base = {
        ...form,
        visit_time: useTime ? form.visit_time : null,
        type: isPlanned ? 'normal' : kind,
        sets: form.sets ? parseInt(form.sets) : null,
        amount: form.amount ? parseInt(String(form.amount).replace(/,/g, '')) : null,
        is_planned: isPlanned ? 1 : 0,
        bottles: isPlanned ? [] : finalBottles,
      }
      if (isEdit) {
        await api.put(`/api/visits/${visit.id}`, { ...base, customer_id: selectedIds[0] })
      } else {
        const session_id = selectedIds.length > 1 ? `s_${Date.now()}` : null
        await Promise.all(selectedIds.map(id => api.post('/api/visits', { ...base, customer_id: id, session_id })))
      }
      onSave()
      onClose()
    } catch (e) {
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: `1px solid ${theme.textMuted}66`,
    backgroundColor: theme.bg, color: theme.text, fontSize: 15, boxSizing: 'border-box', outline: 'none',
    colorScheme: theme.dark ? 'dark' : 'light'
  }
  const labelStyle = { fontSize: 12, color: theme.textMuted, marginBottom: 6, display: 'block' }

  const unselectedCustomers = (customers || []).filter(c => !selectedIds.includes(c.id))

  return (
    <>
    <Modal title={isEdit ? '来店を編集' : '来店を追加'} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 顧客選択 */}
        <div>
          <label style={labelStyle}>顧客 {!isEdit && '*'}</label>
          {isEdit ? (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: theme.bg, border: `1px solid ${theme.textMuted}66`, fontSize: 15, color: theme.text }}>
              {customers?.find(c => c.id === selectedIds[0])?.name || ''}
            </div>
          ) : (
            <div style={{ border: `1px solid ${theme.textMuted}66`, borderRadius: 10, padding: '10px 12px', backgroundColor: theme.bg }}>
              {selectedIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {selectedIds.map(id => {
                    const c = (customers || []).find(x => x.id === id)
                    return c ? (
                      <span key={id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                        borderRadius: 20, background: theme.accent + '22', color: theme.accent,
                        fontSize: 13, border: `1px solid ${theme.accent}`
                      }}>
                        {c.name}
                        <button onClick={() => removeCustomer(id)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>
                      </span>
                    ) : null
                  })}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <select
                  style={{ flex: 1, border: 'none', outline: 'none', backgroundColor: theme.bg, color: theme.text, fontSize: 14, colorScheme: theme.dark ? 'dark' : 'light' }}
                  value=""
                  onChange={e => { addCustomer(e.target.value); e.target.value = '' }}
                >
                  <option value="" style={{ backgroundColor: theme.bg, color: theme.text }}>
                    {unselectedCustomers.length === 0 ? '全員選択済み' : '顧客を追加...'}
                  </option>
                  {unselectedCustomers.map(c => (
                    <option key={c.id} value={c.id} style={{ backgroundColor: theme.bg, color: theme.text }}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  style={{
                    flexShrink: 0, padding: '6px 12px', borderRadius: 8,
                    border: `1px dashed ${theme.accent}`, backgroundColor: theme.accent + '15',
                    color: theme.accent, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >＋ 新規</button>
              </div>
            </div>
          )}
        </div>

        {/* 種別 */}
        <div>
          <label style={labelStyle}>種別</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {KINDS.map(({ value, label }) => (
              <button key={value} onClick={() => setKind(value)} style={{
                padding: '10px 0', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 12,
                border: `1px solid ${kind === value ? theme.accent : theme.border}`,
                backgroundColor: kind === value ? theme.accent + '22' : 'transparent',
                color: kind === value ? theme.accent : theme.textMuted
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* 日付 */}
        <div>
          <label style={labelStyle}>日付 *</label>
          <input type="date" style={inputStyle} value={form.visit_date} onChange={e => set('visit_date', e.target.value)} />
        </div>

        {/* 時刻 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>{isPlanned ? '予定時刻' : '来客時間'}</label>
            <button
              type="button"
              onClick={() => setUseTime(v => !v)}
              style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', fontWeight: 600,
                border: `1px solid ${useTime ? theme.accent : theme.border}`,
                backgroundColor: useTime ? theme.accent + '22' : 'transparent',
                color: useTime ? theme.accent : theme.textMuted
              }}
            >{useTime ? '時間あり' : '時間なし'}</button>
          </div>
          {useTime && <div style={{ display: 'flex', gap: 8 }}>
            <select
              style={{ ...inputStyle, flex: 1, appearance: 'none', textAlign: 'center' }}
              value={form.visit_time.split(':')[0] || '00'}
              onChange={e => set('visit_time', `${e.target.value}:${form.visit_time.split(':')[1] || '00'}`)}
            >
              {HOURS.map(h => <option key={h} value={h} style={{ backgroundColor: theme.bg, color: theme.text }}>{h}時</option>)}
            </select>
            <select
              style={{ ...inputStyle, flex: 1, appearance: 'none', textAlign: 'center' }}
              value={form.visit_time.split(':')[1] || '00'}
              onChange={e => set('visit_time', `${form.visit_time.split(':')[0] || '00'}:${e.target.value}`)}
            >
              {MINUTES.map(m => <option key={m} value={m} style={{ backgroundColor: theme.bg, color: theme.text }}>{m}分</option>)}
            </select>
          </div>}
        </div>

        {/* 来店記録のみ表示 */}
        {!isPlanned && (
          <>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>セット数</label>
                <input type="number" min="0" style={inputStyle} value={form.sets} onChange={e => set('sets', e.target.value)} placeholder="0" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>売上金額</label>
                <input
                  type="text"
                  inputMode="numeric"
                  style={inputStyle}
                  value={form.amount ? Number(form.amount).toLocaleString() : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/,/g, '')
                    if (raw === '' || /^\d+$/.test(raw)) set('amount', raw)
                  }}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>ボトル</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input style={{ ...inputStyle, flex: 2 }} value={bottleName} onChange={e => setBottleName(e.target.value)} placeholder="銘柄名" onKeyDown={e => e.key === 'Enter' && addBottle()} />
                <input type="number" min="1" style={{ ...inputStyle, flex: 1 }} value={bottleCount} onChange={e => setBottleCount(e.target.value)} />
                <button onClick={addBottle} style={{ padding: '12px 14px', borderRadius: 10, background: theme.accent, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>+</button>
              </div>
              {bottles.map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 8, background: theme.cardBg, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{b.name} × {b.count}本</span>
                  <button onClick={() => removeBottle(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18 }}>×</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* メモ */}
        <div>
          <label style={labelStyle}>メモ</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.memo} onChange={e => set('memo', e.target.value)} />
        </div>

        {selectedIds.length > 1 && (
          <div style={{ fontSize: 12, color: theme.textMuted, textAlign: 'center' }}>
            {selectedIds.length}人分の記録を同時に保存します
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '16px', borderRadius: 12, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent}BB)`,
            color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1
          }}
        >{saving ? '保存中...' : isEdit ? '更新する' : '保存する'}</button>
      </div>
    </Modal>
    {showNewCustomer && (
      <CustomerForm
        onClose={() => setShowNewCustomer(false)}
        onSave={(id) => {
          setSelectedIds(prev => [...prev, id])
          refetchCustomers()
        }}
      />
    )}
    </>
  )
}
