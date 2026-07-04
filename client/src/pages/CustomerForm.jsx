import { useState, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { api } from '../hooks/useApi'
import Modal from '../components/Modal'

const FIELD = (label, key, type = 'text', placeholder = '') => ({ label, key, type, placeholder })

export default function CustomerForm({ customer, onClose, onSave }) {
  const { theme } = useTheme()
  const [form, setForm] = useState({
    name: customer?.name || '',
    name_kana: customer?.name_kana || '',
    birthday: customer?.birthday || '',
    occupation: customer?.occupation || '',
    line_url: customer?.line_url || '',
    favorite_drinks: customer?.favorite_drinks || '',
    disliked: customer?.disliked || '',
    area: customer?.area || '',
    receipt_name: customer?.receipt_name || '',
    color: customer?.color || '#7F77DD',
    memo: customer?.memo || '',
  })
  const [tags, setTags] = useState(customer?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [bottleKeep, setBottleKeep] = useState(customer?.bottle_keep || [])
  const [bottleInput, setBottleInput] = useState('')
  const [photoPreview, setPhotoPreview] = useState(customer?.photo_url ? customer.photo_url : null)
  const [photoFile, setPhotoFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t))

  const handleSave = async () => {
    if (!form.name.trim()) return alert('名前を入力してください')
    setSaving(true)
    try {
      const finalTags = [...tags]
      if (tagInput.trim() && !finalTags.includes(tagInput.trim())) finalTags.push(tagInput.trim())
      const finalBottleKeep = [...bottleKeep]
      if (bottleInput.trim() && !finalBottleKeep.includes(bottleInput.trim())) finalBottleKeep.push(bottleInput.trim())
      const body = { ...form, tags: finalTags, bottle_keep: finalBottleKeep }
      let id = customer?.id
      if (id) {
        await api.put(`/api/customers/${id}`, body)
      } else {
        const res = await api.post('/api/customers', body)
        id = res.id
      }
      if (photoFile) {
        const fd = new FormData()
        fd.append('photo', photoFile)
        await fetch(`/api/customers/${id}/photo`, { method: 'POST', body: fd })
      }
      onSave(id)
      onClose()
    } catch (e) {
      alert('保存に失敗しました: ' + (e?.message || String(e)))
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px solid ${theme.border}`,
    backgroundColor: theme.bg, color: theme.text, fontSize: 15, boxSizing: 'border-box',
    outline: 'none'
  }
  const labelStyle = { fontSize: 12, color: theme.textMuted, marginBottom: 4, display: 'block' }

  return (
    <Modal title={customer ? '顧客を編集' : '顧客を追加'} onClose={onClose} fullScreen>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 写真 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 100, height: 100, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer',
              background: photoPreview ? 'transparent' : `linear-gradient(135deg, ${theme.accent}, var(--sub))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px dashed ${theme.border}`, position: 'relative'
            }}
          >
            {photoPreview
              ? <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 32, color: '#fff' }}>+</span>
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            style={{ background: 'none', border: 'none', color: theme.accent, fontSize: 13, cursor: 'pointer' }}
          >写真を選択 / カメラで撮影</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
        </div>

        {/* 基本情報 */}
        {[
          { label: '名前 *', key: 'name' },
          { label: 'よみがな', key: 'name_kana' },
          { label: '職業', key: 'occupation' },
          { label: '地域', key: 'area', placeholder: '例: 大阪、東京' },
          { label: '領収書の宛名', key: 'receipt_name', placeholder: '例: 株式会社〇〇' },
        ].map(({ label, key, placeholder }) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input
              style={inputStyle}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              placeholder={placeholder || ''}
            />
          </div>
        ))}

        {/* 誕生日（月・日セレクト） */}
        <div>
          <label style={labelStyle}>誕生日</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: '月', values: Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')), part: 0 },
              { label: '日', values: Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')), part: 1 },
            ].map(({ label, values, part }) => {
              const parts = (form.birthday || '').match(/^(\d{2})-(\d{2})$/)
              const current = parts ? parts[part + 1] : ''
              return (
                <select
                  key={label}
                  value={current}
                  onChange={e => {
                    const p = (form.birthday || '').match(/^(\d{2})-(\d{2})$/)
                    const m = part === 0 ? e.target.value : (p ? p[1] : '01')
                    const d = part === 1 ? e.target.value : (p ? p[2] : '01')
                    set('birthday', e.target.value === '' ? '' : `${m}-${d}`)
                  }}
                  style={{ ...inputStyle, flex: 1, colorScheme: theme.dark ? 'dark' : 'light' }}
                >
                  <option value="">-- {label}</option>
                  {values.map(v => (
                    <option key={v} value={v}>{parseInt(v)}{label}</option>
                  ))}
                </select>
              )
            })}
          </div>
        </div>

        {/* キープボトル */}
        <div>
          <label style={labelStyle}>キープボトル</label>
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: '10px 12px', backgroundColor: theme.bg }}>
            {bottleKeep.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {bottleKeep.map(b => (
                  <span key={b} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                    borderRadius: 20, background: theme.accent + '22', color: theme.accent, fontSize: 13, border: `1px solid ${theme.accent}`
                  }}>
                    🍾 {b}
                    <button onClick={() => setBottleKeep(prev => prev.filter(x => x !== b))} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: theme.text, fontSize: 14 }}
                value={bottleInput}
                onChange={e => setBottleInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const b = bottleInput.trim()
                    if (b && !bottleKeep.includes(b)) setBottleKeep(prev => [...prev, b])
                    setBottleInput('')
                  }
                }}
                placeholder="銘柄名を入力..."
              />
              <button
                onClick={() => {
                  const b = bottleInput.trim()
                  if (b && !bottleKeep.includes(b)) setBottleKeep(prev => [...prev, b])
                  setBottleInput('')
                }}
                style={{ width: 34, height: 34, borderRadius: '50%', background: theme.accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >＋</button>
            </div>
          </div>
        </div>

        {/* ネームタグ */}
        <div>
          <label style={labelStyle}>ネームタグ</label>
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: '10px 12px', backgroundColor: theme.bg }}>
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {tags.map(t => (
                  <span key={t} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                    borderRadius: 20, background: theme.accent + '22', color: theme.accent, fontSize: 13, border: `1px solid ${theme.accent}`
                  }}>
                    {t}
                    <button onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', color: theme.textMuted, cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1 }}>×</button>
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: theme.text, fontSize: 14 }}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTag()}
                placeholder="タグを入力..."
              />
              <button
                onClick={addTag}
                style={{ width: 34, height: 34, borderRadius: '50%', background: theme.accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >＋</button>
            </div>
          </div>
        </div>

        {/* メモ */}
        <div>
          <label style={labelStyle}>メモ</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={form.memo}
            onChange={e => set('memo', e.target.value)}
            placeholder="自由メモ"
          />
        </div>

        {/* 保存ボタン */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '16px', borderRadius: 12, background: `linear-gradient(135deg, ${theme.accent}, var(--sub))`,
            color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer',
            opacity: saving ? 0.7 : 1
          }}
        >{saving ? '保存中...' : '保存する'}</button>
      </div>
    </Modal>
  )
}
