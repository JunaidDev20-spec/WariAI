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
import { sendDeploymentWhatsApp } from '../services/whatsappService.js'

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

  // Fire-and-forget WhatsApp notification (non-blocking)
  const deployedResources = resourceIds.map(id => findResource(id)).filter((r): r is NonNullable<typeof r> => r !== undefined)
  sendDeploymentWhatsApp(
    incident.mukamId,
    incident.zoneLabel,
    deployedResources.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      status: r.status,
      baseLocation: r.baseLocation,
    })),
  ).catch(() => {})
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

// POST /api/deployments/alert — trigger WhatsApp clipboard alert for critical deployments
router.post('/alert', async (req: Request, res: Response) => {
  const { mukamId, zoneLabel, resources } = req.body as {
    mukamId?: string
    zoneLabel?: string
    resources?: Array<{ id: string; name: string; type: string; status: string; baseLocation: string }>
  }

  if (!mukamId || !zoneLabel || !Array.isArray(resources)) {
    res.status(400).json({ error: 'mukamId, zoneLabel, and resources array are required' })
    return
  }

  try {
    await sendDeploymentWhatsApp(mukamId, zoneLabel, resources)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to send alert' })
  }
})
