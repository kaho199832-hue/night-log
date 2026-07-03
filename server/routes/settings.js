const express = require('express')
const router = express.Router()
const { pool } = require('../db')

const upsert = (key, value) => pool.query(
  'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
  [key, value]
)

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM settings')
    const result = {}
    rows.forEach(r => { result[r.key] = r.value })
    res.json(result)
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.put('/:key', async (req, res) => {
  try {
    await upsert(req.params.key, req.body.value)
    res.json({ ok: true })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.post('/reset-ui', async (req, res) => {
  try {
    const defaults = [
      ['ui_bg', '#0F0A1E'], ['ui_card_bg', '#1A1030'], ['ui_text', '#F3F4F6'],
      ['ui_text_muted', '#9CA3AF'], ['ui_accent', '#A855F7'], ['ui_border', '#2D1F4A'], ['ui_sub', '#EC4899']
    ]
    for (const [k, v] of defaults) await upsert(k, v)
    res.json({ ok: true })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.post('/reset-colors', async (req, res) => {
  try {
    const defaults = [
      ['color_dohan', '#7F77DD'], ['color_normal', '#888780'],
      ['color_birthday', '#F0997B'], ['color_planned', '#7F77DD']
    ]
    for (const [k, v] of defaults) await upsert(k, v)
    res.json({ ok: true })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

module.exports = router
