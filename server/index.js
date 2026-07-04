const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { initDb } = require('./db')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body ? JSON.stringify(req.body).slice(0, 200) : '')
  next()
})

// ローカル開発時のみ uploads を静的配信
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
}

app.use('/api/customers', require('./routes/customers'))
app.use('/api/visits', require('./routes/visits'))
app.use('/api/reports', require('./routes/reports'))
app.use('/api/settings', require('./routes/settings'))

// ビルド済みフロントエンドを配信
const distPath = path.join(__dirname, '../client/dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')))
}

initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Night CRM running on port ${PORT}`)
    })
  })
  .catch(err => {
    console.error('DB init failed:', err)
    process.exit(1)
  })
