// ── server/src/routes/cleanliness.ts ─────────────────────────────────────
// M1 crowd data ingestion + cleanliness demand endpoints.
//
// POST /api/crowd          — receive M1 current_population, returns cleanliness demand
// GET  /api/cleanliness    — get current cleanliness demand + deployment availability

import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  storeCrowdReading,
  storeCleanlinessDemand,
  getLatestDemand,
  calculateCleanlinessDemand,
  isDeploymentAvailable,
  CLEANLINESS_THRESHOLDS,
} from '../data/crowdStore.js'

const router = Router()

// POST /api/crowd — M1 sends current_population
router.post('/crowd', (req: Request, res: Response) => {
  const { mukamId, current_population } = req.body as {
    mukamId?: string
    current_population?: number
  }

  if (!mukamId || typeof current_population !== 'number' || current_population < 0) {
    res.status(400).json({ error: 'mukamId (string) and current_population (non-negative number) are required' })
    return
  }

  // Store the raw M1 reading
  const reading = storeCrowdReading(mukamId, current_population)

  // Calculate cleanliness demand from crowd population
  const demand = calculateCleanlinessDemand(current_population, mukamId)
  storeCleanlinessDemand(demand)

  res.status(201).json({
    reading,
    cleanliness: demand,
    deploymentAvailable: isDeploymentAvailable(),
  })
})

// GET /api/cleanliness — current cleanliness demand status
router.get('/cleanliness', (_req: Request, res: Response) => {
  const demand = getLatestDemand()
  res.json({
    cleanliness: demand,
    deploymentAvailable: isDeploymentAvailable(),
    thresholds: CLEANLINESS_THRESHOLDS,
  })
})

export default router
