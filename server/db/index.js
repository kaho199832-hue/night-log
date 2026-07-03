const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      name_kana TEXT,
      birthday TEXT,
      occupation TEXT,
      line_url TEXT,
      photo_url TEXT,
      favorite_drinks TEXT,
      disliked TEXT,
      color TEXT DEFAULT '#7F77DD',
      memo TEXT,
      bottle_keep JSONB DEFAULT '[]',
      area TEXT,
      receipt_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS name_tags (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      tag TEXT NOT NULL
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
      visit_date TEXT NOT NULL,
      visit_time TEXT,
      type TEXT NOT NULL CHECK(type IN ('dohan', 'normal', 'birthday')),
      is_planned INTEGER DEFAULT 0,
      sets INTEGER,
      amount INTEGER,
      memo TEXT,
      session_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS bottles (
      id SERIAL PRIMARY KEY,
      visit_id INTEGER REFERENCES visits(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      count INTEGER DEFAULT 1
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `)

  const defaults = [
    ['color_dohan', '#7F77DD'], ['color_normal', '#888780'],
    ['color_birthday', '#F0997B'], ['color_planned', '#7F77DD'],
    ['ui_bg', '#0F0A1E'], ['ui_card_bg', '#1A1030'],
    ['ui_text', '#F3F4F6'], ['ui_text_muted', '#9CA3AF'],
    ['ui_accent', '#A855F7'], ['ui_border', '#2D1F4A'], ['ui_sub', '#EC4899']
  ]
  for (const [key, value] of defaults) {
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, value]
    )
  }

  console.log('DB ready')
}

module.exports = { pool, initDb }
