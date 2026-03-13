import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import cors from 'cors'
import pg from 'pg'

const { Pool } = pg

// Load .env from the project root (one level up from /server)
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001
const API_KEY = process.env.ZEFAME_API_KEY
const ZEFAME_API = 'https://zefame.com/api/v2'

const connectionString = process.env.DB_URL || process.env.DATABASE_URL || 'postgresql://vboost:vboost_pass@localhost:5433/vboost'
const isProduction = !!(process.env.DB_URL || process.env.DATABASE_URL)

console.log('Connecting to DB (production:', isProduction, ')')

const db = new Pool({
  connectionString,
  ssl: false,
})

async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id        SERIAL PRIMARY KEY,
      time      TIMESTAMPTZ DEFAULT NOW(),
      url       TEXT NOT NULL,
      service   TEXT,
      quantity  INTEGER,
      status    TEXT,
      order_id  TEXT,
      error     TEXT
    )
  `)
}

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
}))
  app.use(express.json())

// Validate API key is present at startup
if (!API_KEY) {
  console.error('ERROR: ZEFAME_API_KEY is not set in .env')
  process.exit(1)
}

// GET /api/services – fetch available boosting services
// Query params:
//   ?filter=tiktok  – only TikTok services (default)
//   ?filter=free    – only services with rate = 0
//   ?filter=all     – all services unfiltered
app.get('/api/services', async (req, res) => {
  const filter = (req.query.filter ?? 'tiktok').toLowerCase()
  const allowed = ['tiktok', 'free', 'all']
  if (!allowed.includes(filter)) {
    return res.status(400).json({ error: `Invalid filter. Use one of: ${allowed.join(', ')}` })
  }

  try {
    const response = await fetch(`${ZEFAME_API}?key=${API_KEY}&action=services`)
    if (!response.ok) {
      return res.status(502).json({ error: 'Upstream API error', status: response.status })
    }
    let data = await response.json()

    if (filter === 'tiktok') {
      data = data.filter(s =>
        /tiktok/i.test(s.name) || /tiktok/i.test(s.category ?? '')
      )
    } else if (filter === 'free') {
      data = data.filter(s => parseFloat(s.rate) === 0)
    }

    res.json(data)
  } catch (err) {
    console.error('Services fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch services' })
  }
})

// POST /api/boost – submit a new boost order
// Body: { url: string, service: number|string, quantity: number }
app.post('/api/boost', async (req, res) => {
  const { url, service, quantity } = req.body

  if (!url || !service || !quantity) {
    return res.status(400).json({ error: 'Missing required fields: url, service, quantity' })
  }

  const qty = parseInt(quantity, 10)
  if (!Number.isInteger(qty) || qty < 1 || qty > 100000) {
    return res.status(400).json({ error: 'Quantity must be an integer between 1 and 100000' })
  }

  if (!/^\d+$/.test(String(service))) {
    return res.status(400).json({ error: 'Invalid service ID' })
  }

  // Basic TikTok URL validation
  const tiktokPattern = /^https?:\/\/(www\.)?tiktok\.com\/.+/i
  if (!tiktokPattern.test(url)) {
    return res.status(400).json({ error: 'Invalid TikTok URL' })
  }

  try {
    const body = new URLSearchParams({
      key: API_KEY,
      action: 'add',
      service: String(service),
      link: url,
      quantity: String(qty),
    })

    const response = await fetch(ZEFAME_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    if (!response.ok) {
      return res.status(502).json({ error: 'Upstream API error', status: response.status })
    }

    const data = await response.json()

    const isSuccess = !data.error
    await db.query(
      `INSERT INTO audit_logs (url, service, quantity, status, order_id, error)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [url, String(service), qty, isSuccess ? 'success' : 'error', isSuccess ? (data.order != null ? String(data.order) : null) : null, isSuccess ? null : (data.error ?? null)]
    )

    res.json(data)
  } catch (err) {
    await db.query(
      `INSERT INTO audit_logs (url, service, quantity, status, error)
       VALUES ($1, $2, $3, 'error', $4)`,
      [url, String(service), qty, err.message]
    ).catch(() => {})
    console.error('Boost order error:', err.message)
    res.status(500).json({ error: 'Failed to submit order' })
  }
})

// GET /api/order/:id – check order status
app.get('/api/order/:id', async (req, res) => {
  const { id } = req.params
  if (!/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'Invalid order ID' })
  }

  try {
    const response = await fetch(
      `${ZEFAME_API}?key=${API_KEY}&action=status&order=${id}`
    )

    if (!response.ok) {
      return res.status(502).json({ error: 'Upstream API error', status: response.status })
    }

    const data = await response.json()
    res.json(data)
  } catch (err) {
    console.error('Order status error:', err.message)
    res.status(500).json({ error: 'Failed to check order status' })
  }
})

// GET /api/audit-logs – return all persisted audit log entries
app.get('/api/audit-logs', async (_req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, time, url, service, quantity, status, order_id AS "orderId", error FROM audit_logs ORDER BY time DESC LIMIT 200'
    )
    res.json(rows)
  } catch (err) {
    console.error('Audit log fetch error:', err.message)
    res.status(500).json({ error: 'Failed to fetch audit logs' })
  }
})

// Serve Vue frontend static build
app.use(express.static(join(__dirname, '../dist')))
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'))
})

initDb()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`v-boost server running at http://localhost:${PORT}`)
    })
    server.on('error', err => {
      if (err.code === 'EADDRINUSE') {
        console.error(`ERROR: Port ${PORT} is already in use. Stop the other process and restart.`)
      } else {
        console.error('Server error:', err.message)
      }
      process.exit(1)
    })
  })
  .catch(err => {
    console.error('DB init failed:', err.message)
    console.error('DB error code:', err.code)
    console.error('DB error detail:', err.detail)
    console.error('Connection string set:', !!connectionString)
    console.error('DATABASE_URL set:', !!process.env.DATABASE_URL)
    console.error('DB_URL set:', !!process.env.DB_URL)
    process.exit(1)
  })
