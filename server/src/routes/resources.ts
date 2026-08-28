// ── server/src/routes/resources.ts ───────────────────────────────────────
// GET /api/resources          — list, optional ?mukamId= ?status=
// GET /api/resources/:id      — single resource

import { Router } from 'express'
import type { Request, Response } from 'express'
import { resources, findResource } from '../data/operationalData.js'

const router = Router()

// GET /api/resources
router.get('/', (req: Request, res: Response) => {
  let result = [...resources]

  const { mukamId, status } = req.query
  if (typeof mukamId === 'string') result = result.filter(r => r.mukamId === mukamId)
  if (typeof status  === 'string') result = result.filter(r => r.status  === status)

  res.json(result)
})

// GET /api/resources/:id
router.get('/:id', (req: Request, res: Response) => {
  const resource = findResource(req.params.id)
  if (!resource) {
    res.status(404).json({ error: `Resource ${req.params.id} not found` })
    return
  }
  res.json(resource)
})

export default router
