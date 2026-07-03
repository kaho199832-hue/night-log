import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useFetch, api } from '../hooks/useApi'
import Avatar from '../components/Avatar'
import { VisitTypeBadge } from '../components/Badge'
import CustomerForm from './CustomerForm'
import VisitForm from './VisitForm'

function StatBox({ label, value }) {
  const { theme } = useTheme()
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '12px 8px', backgroundColor: theme.bg, borderRadius: 12 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: theme.text }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function CustomerDetail({ customerId, onBack, onUpdate }) {
  const { theme, colors } = useTheme()
  const { data: customer, loading, refetch } = useFetch(`/api/customers/${customerId}`)
  const [showEdit, setShowEdit] = useState(false)
  const [deletingVisit, setDeletingVisit] = useState(null)
  const [editingVisit, setEditingVisit] = useState(null)

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80, color: theme.textMuted }}>読み込み中...</div>
  )
  if (!customer) return null

  const deleteVisit = async (visitId) => {
    if (!window.confirm('この来店記録を削除しますか？')) return
    await api.delete(`/api/visits/${visitId}`)
    refetch()
    onUpdate?.()
  }

  const formatAmount = (n) => n ? `¥${Number(n).toLocaleString()}` : '—'
  const formatDate = (d) => d ? d.replace(/-/g, '/') : '—'

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100dvh', paddingBottom: 80 }}>
      {/* ヘッダー */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '16px 16px 0', gap: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: theme.textMuted, fontSize: 24, cursor: 'pointer', padding: 4, lineHeight: 1 }}>‹</button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, flex: 1 }}>顧客詳細</h1>
        <button onClick={() => setShowEdit(true)} style={{ background: theme.accent + '22', border: `1px solid ${theme.accent}`, color: theme.accent, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>編集</button>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* プロフィール */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 0 8px' }}>
          <Avatar name={customer.name} photoUrl={customer.photo_url} size={90} />
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{customer.name}</h2>
            {customer.name_kana && <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>{customer.name_kana}</div>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 6, flexWrap: 'wrap' }}>
              {customer.birthday && (() => {
                const m = (customer.birthday || '').match(/^(\d{2})-(\d{2})$/)
                return m ? <span style={{ fontSize: 12, color: theme.textMuted }}>🎂 {parseInt(m[1])}月{parseInt(m[2])}日</span> : null
              })()}
              {customer.occupation && <span style={{ fontSize: 12, color: theme.textMuted }}>💼 {customer.occupation}</span>}
              {customer.area && <span style={{ fontSize: 12, color: theme.textMuted }}>📍 {customer.area}</span>}
              {customer.receipt_name && <span style={{ fontSize: 12, color: theme.textMuted }}>🧾 {customer.receipt_name}</span>}
            </div>
          </div>
        </div>

        {/* LINEボタン */}
        {customer.line_url && (
          <a
            href={customer.line_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '14px', borderRadius: 12, textDecoration: 'none',
              backgroundColor: '#06C755', color: '#fff', fontWeight: 700, fontSize: 15
            }}
          >
            <span style={{ fontSize: 20 }}>💬</span> LINEでトーク
          </a>
        )}

        {/* サマリー */}
        <div style={{ display: 'flex', gap: 8 }}>
          <StatBox label="指名回数" value={`${customer.visit_count}回`} />
          <StatBox label="累計売上" value={formatAmount(customer.total_amount)} />
          <StatBox label="最終来店" value={formatDate(customer.last_visit_date)} />
        </div>

        {/* キープボトル */}
        {customer.bottle_keep?.length > 0 && (
          <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, color: theme.textMuted }}>キープボトル</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {customer.bottle_keep.map(b => (
                <span key={b} style={{ padding: '4px 12px', borderRadius: 20, background: theme.accent + '22', color: theme.accent, fontSize: 13, border: `1px solid ${theme.accent}` }}>
                  🍾 {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ボトル集計 */}
        {customer.bottles_summary?.length > 0 && (
          <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: theme.textMuted }}>卸しているボトル</h3>
            {customer.bottles_summary.map(b => (
              <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ fontSize: 14 }}>{b.name}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: theme.accent }}>{b.total}本</span>
                  <div style={{ fontSize: 11, color: theme.textMuted }}>{formatDate(b.last_date)}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* タグ */}
        {customer.tags?.length > 0 && (
          <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, color: theme.textMuted }}>ネームタグ</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {customer.tags.map(t => (
                <span key={t} style={{ padding: '4px 12px', borderRadius: 20, background: theme.accent + '22', color: theme.accent, fontSize: 13, border: `1px solid ${theme.accent}` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 好み */}
        {(customer.favorite_drinks || customer.disliked) && (
          <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 10px', fontSize: 14, color: theme.textMuted }}>お酒・好み</h3>
            {customer.favorite_drinks && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: theme.textMuted }}>好きなお酒: </span>
                <span style={{ fontSize: 14 }}>{customer.favorite_drinks}</span>
              </div>
            )}
            {customer.disliked && (
              <div>
                <span style={{ fontSize: 12, color: theme.textMuted }}>苦手なもの: </span>
                <span style={{ fontSize: 14 }}>{customer.disliked}</span>
              </div>
            )}
          </div>
        )}

        {/* メモ */}
        {customer.memo && (
          <div style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 16, border: `1px solid ${theme.border}` }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, color: theme.textMuted }}>メモ</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{customer.memo}</p>
          </div>
        )}

        {/* 来店履歴 */}
        <div>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: theme.textMuted }}>来店履歴</h3>
          {customer.visits?.filter(v => v.is_planned === 0).length === 0
            ? <div style={{ textAlign: 'center', color: theme.textMuted, padding: 20 }}>来店履歴がありません</div>
            : customer.visits?.filter(v => v.is_planned === 0).map(v => (
              <div key={v.id} style={{ backgroundColor: theme.cardBg, borderRadius: 12, padding: 14, border: `1px solid ${theme.border}`, marginBottom: 10, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{formatDate(v.visit_date)}</div>
                    {v.visit_time && <div style={{ fontSize: 12, color: theme.textMuted }}>{v.visit_time}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <VisitTypeBadge type={v.type} />
                    <button onClick={() => setEditingVisit(v)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', fontSize: 15, padding: 4 }}>✏️</button>
                    <button onClick={() => deleteVisit(v.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16, padding: 4 }}>🗑</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                  {v.amount > 0 && <span>売上: <strong>{formatAmount(v.amount)}</strong></span>}
                  {v.sets && <span>セット数: <strong>{v.sets}</strong></span>}
                </div>
                {v.bottles?.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 13, color: theme.textMuted }}>
                    ボトル: {v.bottles.map(b => `${b.name}×${b.count}`).join('、')}
                  </div>
                )}
                {v.memo && <div style={{ marginTop: 8, fontSize: 13, color: theme.textMuted }}>{v.memo}</div>}
              </div>
            ))}
        </div>
      </div>

      {showEdit && (
        <CustomerForm
          customer={{ ...customer }}
          onClose={() => setShowEdit(false)}
          onSave={() => { refetch(); onUpdate?.() }}
        />
      )}
      {editingVisit && (
        <VisitForm
          visit={{ ...editingVisit, customer_id: customerId }}
          onClose={() => setEditingVisit(null)}
          onSave={() => { refetch(); onUpdate?.(); setEditingVisit(null) }}
        />
      )}
    </div>
  )
}
