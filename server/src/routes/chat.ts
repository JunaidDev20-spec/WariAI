// ── server/src/routes/chat.ts ─────────────────────────────────────────────
// POST /api/chat — website-grounded AI chatbot

import { Router } from 'express'
import type { Request, Response } from 'express'
import { getChatAnswer } from '../services/chatService.js'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const { message } = req.body as { message?: string }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ error: 'Message is required' })
    return
  }

  try {
    const { answer } = await getChatAnswer(message.trim())
    res.json({ answer })
  } catch {
    res.status(500).json({ error: "Sorry, I'm unable to access the latest website data right now." })
  }
})

export default router
