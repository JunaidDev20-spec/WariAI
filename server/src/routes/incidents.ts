// ── server/src/routes/incidents.ts ───────────────────────────────────────
// GET  /api/incidents          — list, optional ?mukamId= ?status=
// POST /api/incidents          — create
// PATCH /api/incidents/:id     — update status
// POST /api/incidents/:id/resolve

import { Router } from 'express'
import type { Request, Response } from 'express'
import { incidents, findIncident, patchIncident } from '../data/operationalData.js'
import type { Incident, IncidentStatus } from '../types/operations.js'

const router = Router()

const VALID_STATUSES: IncidentStatus[] = ['new', 'acknowledged', 'deployed', 'active', 'resolved']

// GET /api/incidents
router.get('/', (req: Request, res: Response) => {
  let result = [...incidents]

  const { mukamId, status } = req.query
  if (typeof mukamId === 'string') result = result.filter(i => i.mukamId === mukamId)
  if (typeof status  === 'string') result = result.filter(i => i.status  === status)

  res.json(result)
})

// POST /api/incidents
router.post('/', (req: Request, res: Response) => {
  const body = req.body as Partial<Incident>

  if (!body.zoneId || !body.mukamId || !body.title) {
    res.status(400).json({ error: 'zoneId, mukamId and title are required' })
    return
  }

  const incident: Incident = {
    id:                 body.id ?? `INC_${body.zoneId}_${body.mukamId}_${Date.now()}`,
    zoneId:             body.zoneId,
    zoneLabel:          body.zoneLabel ?? body.zoneId,
    mukamId:            body.mukamId,
    severity:           body.severity ?? 'watch',
    incidentType:       body.incidentType ?? body.title,
    title:              body.title,
    createdAt:          body.createdAt ?? Date.now(),
    status:             'new',
    assignedResourceIds: [],
    recommendedAction:  body.recommendedAction ?? '',
    timeToEvent:        body.timeToEvent,
    currentLoad:        body.currentLoad,
    predictedLoad:      body.predictedLoad,
  }

  // Deduplicate by id
  const exists = incidents.findIndex(i => i.id === incident.id)
  if (exists !== -1) {
    incidents[exists] = incident
  } else {
    incidents.push(incident)
  }

  res.status(201).json(incident)
})

// PATCH /api/incidents/:id
router.patch('/:id', (req: Request, res: Response) => {
  const incident = findIncident(req.params.id)
  if (!incident) {
    res.status(404).json({ error: `Incident ${req.params.id} not found` })
    return
  }

  const { status } = req.body as { status?: IncidentStatus }
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` })
    return
  }

  const updated = patchIncident(req.params.id, req.body as Partial<Incident>)
  res.json(updated)
})

// POST /api/incidents/:id/resolve
router.post('/:id/resolve', (req: Request, res: Response) => {
  const incident = findIncident(req.params.id)
  if (!incident) {
    res.status(404).json({ error: `Incident ${req.params.id} not found` })
    return
  }

  const updated = patchIncident(req.params.id, { status: 'resolved' })
  res.json(updated)
})

export default router
