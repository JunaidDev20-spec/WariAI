// ── server/src/routes/operations.ts ──────────────────────────────────────
// POST /api/deployments                     — confirm deployment
// POST /api/deployments/:incidentId/resolve — resolve incident + free resources

import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  resources, incidents, deployments,
  findIncident, findResource, patchIncident, patchResource,
} from '../data/operationalData.js'
import type { Deployment } from '../types/operations.js'

const router = Router()

// POST /api/deployments
router.post('/', (req: Request, res: Response) => {
  const { incidentId, resourceIds } = req.body as {
    incidentId?: string
    resourceIds?: string[]
  }

  // Validate presence
  if (!incidentId || !Array.isArray(resourceIds) || resourceIds.length === 0) {
    res.status(400).json({ error: 'incidentId and a non-empty resourceIds array are required' })
    return
  }

  // Validate incident exists
  const incident = findIncident(incidentId)
  if (!incident) {
    res.status(404).json({ error: `Incident ${incidentId} not found` })
    return
  }

  // Validate each resource exists and is available
  const resolvedResources = []
  for (const id of resourceIds) {
    const r = findResource(id)
    if (!r) {
      res.status(404).json({ error: `Resource ${id} not found` })
      return
    }
    if (r.status !== 'available') {
      res.status(400).json({ error: `Resource ${id} is not available (status: ${r.status})` })
      return
    }
    resolvedResources.push(r)
  }

  // Mark resources as assigned
  for (const r of resolvedResources) {
    patchResource(r.id, { status: 'assigned', zoneId: incident.zoneId })
  }

  // Update incident
  patchIncident(incidentId, {
    status: 'deployed',
    assignedResourceIds: resourceIds,
  })

  // Record deployment
  const deployment: Deployment = {
    id:          `DEP_${incidentId}_${Date.now()}`,
    incidentId,
    resourceIds,
    createdAt:   Date.now(),
  }
  deployments.push(deployment)

  res.status(201).json({
    deployment,
    incident: findIncident(incidentId),
    resources: resourceIds.map(id => findResource(id)),
  })
})

// POST /api/deployments/:incidentId/resolve
router.post('/:incidentId/resolve', (req: Request, res: Response) => {
  const { incidentId } = req.params

  const incident = findIncident(incidentId)
  if (!incident) {
    res.status(404).json({ error: `Incident ${incidentId} not found` })
    return
  }

  // Free all assigned resources
  const freed = []
  for (const resourceId of incident.assignedResourceIds) {
    const updated = patchResource(resourceId, { status: 'available', zoneId: null })
    if (updated) freed.push(updated)
  }

  // Resolve incident
  const resolvedIncident = patchIncident(incidentId, { status: 'resolved' })

  res.json({
    incident: resolvedIncident,
    freedResources: freed,
  })
})

export default router
