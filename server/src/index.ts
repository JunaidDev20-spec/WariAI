// ── server/src/index.ts ───────────────────────────────────────────────────
// WariAI Express backend — in-memory operational state server.
// Port: 5000   Frontend (Vite dev): http://localhost:5173

import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors    from 'cors'
import incidentRoutes  from './routes/incidents.js'
import resourceRoutes  from './routes/resources.js'
import operationRoutes from './routes/operations.js'
import chatRoutes     from './routes/chat.js'
import toiletRoutes   from './routes/toilets.js'

const app  = express()
const PORT = 5000

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
}))
app.use(express.json())

// ── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/incidents',   incidentRoutes)
app.use('/api/resources',   resourceRoutes)
app.use('/api/deployments', operationRoutes)
app.use('/api/chat',        chatRoutes)
app.use('/api/toilets',     toiletRoutes)

// ── 404 fallback ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  WariAI API  →  http://localhost:${PORT}/api/health\n`)
})

export default app
