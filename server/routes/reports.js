const express = require('express')
const router = express.Router()
const { pool } = require('../db')

router.get('/monthly', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(visit_date::date, 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0) AS total,
        COUNT(*) AS visit_count,
        SUM(CASE WHEN type = 'dohan' THEN 1 ELSE 0 END) AS dohan_count
      FROM visits
      WHERE is_planned = 0
        AND visit_date >= TO_CHAR(DATE_TRUNC('month', NOW() - INTERVAL '5 months'), 'YYYY-MM-DD')
      GROUP BY month
      ORDER BY month
    `)
    res.json(rows)
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.get('/summary', async (req, res) => {
  try {
    const { year, month } = req.query
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const { rows } = await pool.query(`
      SELECT
        COALESCE(SUM(amount), 0) AS total_amount,
        COUNT(*) AS visit_count,
        SUM(CASE WHEN type = 'dohan' THEN 1 ELSE 0 END) AS dohan_count
      FROM visits
      WHERE is_planned = 0 AND visit_date LIKE $1
    `, [`${prefix}%`])
    res.json(rows[0])
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.get('/ranking', async (req, res) => {
  try {
    const { year, month } = req.query
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const { rows } = await pool.query(`
      SELECT c.id, c.name, c.photo_url,
        COALESCE(SUM(v.amount), 0) AS total_amount,
        COUNT(v.id) AS visit_count
      FROM customers c
      JOIN visits v ON v.customer_id = c.id
      WHERE v.is_planned = 0 AND v.visit_date LIKE $1
      GROUP BY c.id, c.name, c.photo_url
      ORDER BY total_amount DESC
      LIMIT 20
    `, [`${prefix}%`])
    res.json(rows)
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.get('/bottles', async (req, res) => {
  try {
    const { year, month } = req.query
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    const { rows } = await pool.query(`
      SELECT b.name, SUM(b.count) AS total
      FROM bottles b
      JOIN visits v ON v.id = b.visit_id
      WHERE v.is_planned = 0 AND v.visit_date LIKE $1
      GROUP BY b.name
      ORDER BY total DESC
    `, [`${prefix}%`])
    res.json(rows)
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

module.exports = router
