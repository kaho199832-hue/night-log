const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { pool } = require('../db')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

function getSupabase() {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

// 顧客一覧（累計売上順）
router.get('/', async (req, res) => {
  try {
    const { rows: customers } = await pool.query(`
      SELECT
        c.*,
        COUNT(DISTINCT CASE WHEN v.is_planned = 0 THEN v.id END) AS visit_count,
        COALESCE(SUM(CASE WHEN v.is_planned = 0 THEN v.amount ELSE 0 END), 0) AS total_amount,
        MAX(CASE WHEN v.is_planned = 0 THEN v.visit_date END) AS last_visit_date
      FROM customers c
      LEFT JOIN visits v ON v.customer_id = c.id
      GROUP BY c.id
      ORDER BY total_amount DESC
    `)
    const { rows: tags } = await pool.query('SELECT * FROM name_tags')
    const tagMap = {}
    tags.forEach(t => {
      if (!tagMap[t.customer_id]) tagMap[t.customer_id] = []
      tagMap[t.customer_id].push(t.tag)
    })
    res.json(customers.map(c => ({ ...c, bottle_keep: c.bottle_keep || [], tags: tagMap[c.id] || [] })))
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

// 顧客詳細
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id])
    const customer = rows[0]
    if (!customer) return res.status(404).json({ error: 'Not found' })

    const { rows: tags } = await pool.query('SELECT tag FROM name_tags WHERE customer_id = $1', [req.params.id])
    const { rows: visits } = await pool.query(`
      SELECT v.*, STRING_AGG(b.name || ':' || b.count::text, ',') AS bottles_raw
      FROM visits v
      LEFT JOIN bottles b ON b.visit_id = v.id
      WHERE v.customer_id = $1
      GROUP BY v.id
      ORDER BY v.visit_date DESC, v.created_at DESC
    `, [req.params.id])

    const actual = visits.filter(v => v.is_planned === 0)
    const visitCount = actual.length
    const totalAmount = actual.reduce((s, v) => s + (parseInt(v.amount) || 0), 0)
    const lastVisit = actual[0]?.visit_date || null

    const bottleMap = {}
    actual.filter(v => v.bottles_raw).forEach(v => {
      v.bottles_raw.split(',').forEach(b => {
        const [name, count] = b.split(':')
        if (!bottleMap[name]) bottleMap[name] = { name, total: 0, last_date: null }
        bottleMap[name].total += parseInt(count) || 0
        if (!bottleMap[name].last_date || v.visit_date > bottleMap[name].last_date)
          bottleMap[name].last_date = v.visit_date
      })
    })

    res.json({
      ...customer,
      bottle_keep: customer.bottle_keep || [],
      tags: tags.map(t => t.tag),
      visits: visits.map(v => ({
        ...v,
        bottles: v.bottles_raw
          ? v.bottles_raw.split(',').map(b => { const [name, count] = b.split(':'); return { name, count: parseInt(count) || 1 } })
          : []
      })),
      visit_count: visitCount,
      total_amount: totalAmount,
      last_visit_date: lastVisit,
      bottles_summary: Object.values(bottleMap)
    })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

// 顧客追加
router.post('/', async (req, res) => {
  try {
    const { name, name_kana, birthday, occupation, line_url, favorite_drinks, disliked, color, memo, tags, bottle_keep, area, receipt_name } = req.body
    const { rows } = await pool.query(`
      INSERT INTO customers (name, name_kana, birthday, occupation, line_url, favorite_drinks, disliked, color, memo, bottle_keep, area, receipt_name)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id
    `, [name, name_kana, birthday, occupation, line_url, favorite_drinks, disliked, color || '#7F77DD', memo, bottle_keep || [], area, receipt_name])

    const customerId = rows[0].id
    if (tags?.length > 0) {
      for (const tag of tags)
        await pool.query('INSERT INTO name_tags (customer_id, tag) VALUES ($1, $2)', [customerId, tag])
    }
    res.json({ id: customerId })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

// 顧客更新
router.put('/:id', async (req, res) => {
  try {
    const { name, name_kana, birthday, occupation, line_url, favorite_drinks, disliked, color, memo, tags, bottle_keep, area, receipt_name } = req.body
    await pool.query(`
      UPDATE customers SET name=$1, name_kana=$2, birthday=$3, occupation=$4, line_url=$5,
      favorite_drinks=$6, disliked=$7, color=$8, memo=$9, bottle_keep=$10, area=$11, receipt_name=$12 WHERE id=$13
    `, [name, name_kana, birthday, occupation, line_url, favorite_drinks, disliked, color || '#7F77DD', memo, bottle_keep || [], area, receipt_name, req.params.id])

    if (tags !== undefined) {
      await pool.query('DELETE FROM name_tags WHERE customer_id = $1', [req.params.id])
      for (const tag of tags)
        await pool.query('INSERT INTO name_tags (customer_id, tag) VALUES ($1, $2)', [req.params.id, tag])
    }
    res.json({ ok: true })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

// 顧客削除
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT photo_url FROM customers WHERE id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })

    const photoUrl = rows[0].photo_url
    if (photoUrl && process.env.SUPABASE_URL) {
      const fileName = photoUrl.split('/').pop()
      await getSupabase().storage.from('customer-photos').remove([fileName])
    }

    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

// 写真アップロード
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' })

    let photoUrl

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      // Supabase Storage（本番）
      const supabase = getSupabase()
      const ext = path.extname(req.file.originalname)
      const fileName = `${Date.now()}${ext}`
      const { error } = await supabase.storage
        .from('customer-photos')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype })
      if (error) throw error
      photoUrl = supabase.storage.from('customer-photos').getPublicUrl(fileName).data.publicUrl

      // 古い写真削除
      const { rows } = await pool.query('SELECT photo_url FROM customers WHERE id = $1', [req.params.id])
      const old = rows[0]?.photo_url
      if (old && old.includes('supabase')) {
        await supabase.storage.from('customer-photos').remove([old.split('/').pop()])
      }
    } else {
      // ローカル保存（開発用）
      const uploadsDir = path.join(__dirname, '../uploads/customers')
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
      const ext = path.extname(req.file.originalname)
      const fileName = `${Date.now()}${ext}`
      fs.writeFileSync(path.join(uploadsDir, fileName), req.file.buffer)
      photoUrl = `/uploads/customers/${fileName}`
    }

    await pool.query('UPDATE customers SET photo_url = $1 WHERE id = $2', [photoUrl, req.params.id])
    res.json({ photo_url: photoUrl })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

module.exports = router
