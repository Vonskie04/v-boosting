import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import express from 'express'
import cors from 'cors'
import pg from 'pg'
import crypto from 'crypto'

const { Pool } = pg

// Load .env from the project root (one level up from /server)
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3001
const API_KEY = process.env.ZEFAME_API_KEY
const ZEFAME_API = 'https://zefame.com/api/v2'
const APP_PASSWORD = process.env.APP_PASSWORD
let maxDevices = parseInt(process.env.MAX_DEVICES || '10', 10)

const connectionString = process.env.DATABASE_URL
const dbSslEnabled = (process.env.DATABASE_SSL ?? 'true').toLowerCase() === 'true'
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : null

if (!connectionString) {
  console.error('ERROR: DATABASE_URL is not set')
  process.exit(1)
}

console.log('Connecting to DB:', connectionString.replace(/\/\/.*@/, '//<credentials>@'))

const db = new Pool({
  connectionString,
  ssl: dbSslEnabled ? { rejectUnauthorized: false } : false,
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
  await db.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      device_info TEXT,
      ip_address  TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      last_seen   TIMESTAMPTZ DEFAULT NOW(),
      is_active   BOOLEAN DEFAULT TRUE
    )
  `)
}

app.use(cors({
  origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
}))
  app.use(express.json())

// Validate required env vars at startup
if (!API_KEY) {
  console.error('ERROR: ZEFAME_API_KEY is not set in .env')
  process.exit(1)
}
if (!APP_PASSWORD) {
  console.error('ERROR: APP_PASSWORD is not set in .env')
  process.exit(1)
}

// ── Auth routes ─────────────────────────────────────────────────────────────

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: 'Password required' })
  if (password !== APP_PASSWORD) return res.status(401).json({ error: 'Incorrect password' })

  const { rows: active } = await db.query(
    'SELECT COUNT(*) FROM sessions WHERE is_active = TRUE'
  )
  if (parseInt(active[0].count, 10) >= maxDevices) {
    return res.status(403).json({ error: `Device limit reached (${maxDevices} max)` })
  }

  const token = crypto.randomBytes(32).toString('hex')
  const deviceInfo = req.headers['user-agent'] || 'Unknown'
  const ipAddress =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'Unknown'

  await db.query(
    'INSERT INTO sessions (id, device_info, ip_address) VALUES ($1, $2, $3)',
    [token, deviceInfo, ipAddress]
  )
  res.json({ token })
})

// POST /api/auth/logout
app.post('/api/auth/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (token) await db.query('UPDATE sessions SET is_active = FALSE WHERE id = $1', [token])
  res.json({ ok: true })
})

// POST /api/auth/heartbeat
app.post('/api/auth/heartbeat', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'No token' })
  const { rows } = await db.query(
    'UPDATE sessions SET last_seen = NOW() WHERE id = $1 AND is_active = TRUE RETURNING id',
    [token]
  )
  if (rows.length === 0) return res.status(401).json({ error: 'Session expired' })
  res.json({ ok: true })
})

// ── Admin routes ──────────────────────────────────────────────────────────────

async function requireSession(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return null }
  const { rows } = await db.query(
    'SELECT id FROM sessions WHERE id = $1 AND is_active = TRUE',
    [token]
  )
  if (rows.length === 0) { res.status(401).json({ error: 'Unauthorized' }); return null }
  return token
}

// GET /api/admin/sessions
app.get('/api/admin/sessions', async (req, res) => {
  if (!await requireSession(req, res)) return
  const { rows } = await db.query(
    `SELECT id, device_info AS "deviceInfo", ip_address AS "ipAddress",
            created_at AS "createdAt", last_seen AS "lastSeen"
     FROM sessions WHERE is_active = TRUE ORDER BY created_at DESC`
  )
  res.json({ sessions: rows, maxDevices })
})

// DELETE /api/admin/sessions/:id
app.delete('/api/admin/sessions/:id', async (req, res) => {
  if (!await requireSession(req, res)) return
  await db.query('UPDATE sessions SET is_active = FALSE WHERE id = $1', [req.params.id])
  res.json({ ok: true })
})

// POST /api/admin/disconnect-all
app.post('/api/admin/disconnect-all', async (req, res) => {
  const callerToken = await requireSession(req, res)
  if (!callerToken) return
  await db.query('UPDATE sessions SET is_active = FALSE WHERE id != $1', [callerToken])
  res.json({ ok: true })
})

// PUT /api/admin/limit
app.put('/api/admin/limit', async (req, res) => {
  if (!await requireSession(req, res)) return
  const limit = parseInt(req.body.limit, 10)
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return res.status(400).json({ error: 'Limit must be between 1 and 100' })
  }
  maxDevices = limit
  res.json({ maxDevices })
})

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
      console.log(`v-boost server listening on port ${PORT}`)
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
