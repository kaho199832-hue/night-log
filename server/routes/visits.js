const express = require('express')
const router = express.Router()
const { pool } = require('../db')

router.get('/', async (req, res) => {
  try {
    const { year, month } = req.query
    const base = `
      SELECT v.*, c.name AS customer_name, c.color AS customer_color,
             STRING_AGG(b.name || ':' || b.count::text, ',') AS bottles_raw
      FROM visits v
      JOIN customers c ON c.id = v.customer_id
      LEFT JOIN bottles b ON b.visit_id = v.id
    `
    let rows
    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`
      ;({ rows } = await pool.query(
        base + ' WHERE v.visit_date LIKE $1 GROUP BY v.id, c.name, c.color ORDER BY v.visit_date, v.visit_time',
        [`${prefix}%`]
      ))
    } else {
      ;({ rows } = await pool.query(
        base + ' GROUP BY v.id, c.name, c.color ORDER BY v.visit_date DESC'
      ))
    }

    res.json(rows.map(v => ({
      ...v,
      bottles: v.bottles_raw
        ? v.bottles_raw.split(',').map(b => { const [name, count] = b.split(':'); return { name, count: parseInt(count) || 1 } })
        : []
    })))
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { customer_id, visit_date, visit_time, type, is_planned, sets, amount, memo, bottles, session_id } = req.body
    const visitType = is_planned ? 'normal' : (type || 'normal')
    const { rows } = await pool.query(`
      INSERT INTO visits (customer_id, visit_date, visit_time, type, is_planned, sets, amount, memo, session_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `, [customer_id, visit_date, visit_time || null, visitType,
      is_planned ? 1 : 0, is_planned ? null : (sets || null),
      is_planned ? null : (amount || null), memo || null, session_id || null])

    const visitId = rows[0].id
    if (!is_planned && bottles?.length > 0) {
      for (const b of bottles)
        await pool.query('INSERT INTO bottles (visit_id, name, count) VALUES ($1,$2,$3)', [visitId, b.name, b.count || 1])
    }
    res.json({ id: visitId })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { visit_date, visit_time, type, is_planned, sets, amount, memo, bottles } = req.body
    const visitType = is_planned ? 'normal' : (type || 'normal')
    await pool.query(`
      UPDATE visits SET visit_date=$1, visit_time=$2, type=$3, is_planned=$4, sets=$5, amount=$6, memo=$7 WHERE id=$8
    `, [visit_date, visit_time || null, visitType, is_planned ? 1 : 0,
      is_planned ? null : (sets || null), is_planned ? null : (amount || null), memo || null, req.params.id])

    if (!is_planned && bottles !== undefined) {
      await pool.query('DELETE FROM bottles WHERE visit_id = $1', [req.params.id])
      for (const b of bottles)
        await pool.query('INSERT INTO bottles (visit_id, name, count) VALUES ($1,$2,$3)', [req.params.id, b.name, b.count || 1])
    }
    res.json({ ok: true })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.delete('/session/:sessionId', async (req, res) => {
  try {
    await pool.query('DELETE FROM visits WHERE session_id = $1', [req.params.sessionId])
    res.json({ ok: true })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM visits WHERE id = $1', [req.params.id])
    res.json({ ok: true })
  } catch (e) {
    console.error(e); res.status(500).json({ error: e.message })
  }
})

module.exports = router
