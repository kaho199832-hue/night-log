import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useFetch, api } from '../hooks/useApi'
import Avatar from '../components/Avatar'
import CustomerForm from './CustomerForm'
import CustomerDetail from './CustomerDetail'

function formatAmount(n) {
  if (!n || n === 0) return '—'
  return `¥${Number(n).toLocaleString()}`
}

function formatDate(d) {
  return d ? d.replace(/-/g, '/') : '—'
}

export default function CustomersPage() {
  const { theme } = useTheme()
  const { data: customers, loading, refetch } = useFetch('/api/customers')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState(null)

  if (selectedId) {
    return (
      <CustomerDetail
        customerId={selectedId}
        onBack={() => setSelectedId(null)}
        onUpdate={refetch}
      />
    )
  }

  const filtered = (customers || []).filter(c =>
    c.name.includes(search) || (c.name_kana || '').includes(search)
  )

  const deleteCustomer = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('この顧客を削除しますか？\n関連する来店記録もすべて削除されます。')) return
    await api.delete(`/api/customers/${id}`)
    refetch()
  }

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100dvh', paddingBottom: 80 }}>
      {/* ヘッダー */}
      <div style={{ padding: '20px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>顧客一覧</h1>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: `linear-gradient(135deg, ${theme.accent}, var(--sub))`,
            border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
          }}
        >+</button>
      </div>

      {/* 検索 */}
      <div style={{ padding: '0 16px 12px' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="名前で検索..."
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 12,
            border: `1px solid ${theme.border}`, backgroundColor: theme.cardBg,
            color: theme.text, fontSize: 15, boxSizing: 'border-box', outline: 'none'
          }}
        />
      </div>

      {/* 一覧 */}
      {loading
        ? <div style={{ textAlign: 'center', paddingTop: 60, color: theme.textMuted }}>読み込み中...</div>
        : filtered.length === 0
          ? <div style={{ textAlign: 'center', paddingTop: 60, color: theme.textMuted }}>顧客が見つかりません</div>
          : filtered.map((c, i) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
                borderBottom: `1px solid ${theme.border}`, cursor: 'pointer',
                backgroundColor: theme.bg
              }}
            >
              <div style={{ position: 'relative' }}>
                <Avatar name={c.name} photoUrl={c.photo_url} size={52} />
                {i < 3 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 18, height: 18, borderRadius: '50%', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: ['#D4AF37', '#A8A9AD', '#CD7F32'][i], color: '#000'
                  }}>{i + 1}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: theme.textMuted, display: 'flex', gap: 10 }}>
                  <span>指名 {c.visit_count}回</span>
                  <span>{formatAmount(c.total_amount)}</span>
                  <span>最終 {formatDate(c.last_visit_date)}</span>
                </div>
              </div>
              <button
                onClick={(e) => deleteCustomer(e, c.id)}
                style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 8, fontSize: 18 }}
              >×</button>
            </div>
          ))
      }

      {showAdd && (
        <CustomerForm
          onClose={() => setShowAdd(false)}
          onSave={refetch}
        />
      )}
    </div>
  )
}
