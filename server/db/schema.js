const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const DB_PATH = path.join(__dirname, 'night-crm.db')
const db = new DatabaseSync(DB_PATH)

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS name_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    tag TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    visit_date TEXT NOT NULL,
    visit_time TEXT,
    type TEXT NOT NULL CHECK(type IN ('dohan', 'normal', 'birthday')),
    is_planned INTEGER DEFAULT 0,
    sets INTEGER,
    amount INTEGER,
    memo TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bottles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visit_id INTEGER REFERENCES visits(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    count INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

try { db.exec('ALTER TABLE customers ADD COLUMN bottle_keep TEXT') } catch (e) {}
try { db.exec('ALTER TABLE visits ADD COLUMN session_id TEXT') } catch (e) {}
try { db.exec('ALTER TABLE customers ADD COLUMN area TEXT') } catch (e) {}
try { db.exec('ALTER TABLE customers ADD COLUMN receipt_name TEXT') } catch (e) {}

const initSettings = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
initSettings.run('color_dohan', '#7F77DD')
initSettings.run('color_normal', '#888780')
initSettings.run('color_birthday', '#F0997B')
initSettings.run('color_planned', '#7F77DD')
initSettings.run('ui_bg', '#0F0A1E')
initSettings.run('ui_card_bg', '#1A1030')
initSettings.run('ui_text', '#F3F4F6')
initSettings.run('ui_text_muted', '#9CA3AF')
initSettings.run('ui_accent', '#A855F7')
initSettings.run('ui_border', '#2D1F4A')
initSettings.run('ui_sub', '#EC4899')

module.exports = db
