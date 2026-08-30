// ── server/src/routes/toilets.ts ───────────────────────────────────────────
// Toilet team and critical alert routes.

import { Router } from 'express'
import type { Request, Response } from 'express'
import {
  findToiletConfig,
  findToiletConfigsByMukamId,
  getToiletTeam,
  getToiletName,
} from '../data/toiletConfig.js'
import {
  triggerCriticalAlert,
  buildCriticalPayload,
  sendWhatsAppAlert,
  clearResolvedAlert,
  type CriticalToiletAlert,
} from '../services/toiletAlertService.js'

const router = Router()

// ── GET /api/toilets/:toiletId/team ─────────────────────────────────────────

router.get('/:toiletId/team', (req: Request, res: Response) => {
  const { toiletId } = req.params
  const config = findToiletConfig(toiletId)

  if (!config) {
    res.status(404).json({
      success: false,
      error: `Toilet not found: ${toiletId}`,
    })
    return
  }

  res.json({
    success: true,
    toilet_id: config.id,
    toilet_name: config.name,
    team: config.team,
  })
})

// ── GET /api/toilets/all-configs ─────────────────────────────────────────────

router.get('/all-configs', (_req: Request, res: Response) => {
  import('../data/toiletConfig.js').then(({ TOILET_CONFIGS }) => {
    res.json({
      success: true,
      configs: TOILET_CONFIGS.map(c => ({
        id: c.id,
        name: c.name,
        mukamId: c.mukamId,
        sanitationPointId: c.sanitationPointId,
        team: c.team,
      })),
    })
  }).catch(() => {
    res.status(500).json({ success: false, error: 'Failed to load toilet configs' })
  })
})

// ── POST /api/toilets/toilet-critical ─────────────────────────────────────────

router.post('/toilet-critical', async (req: Request, res: Response) => {
  const { toilet_id, critical_type, severity } = req.body as {
    toilet_id?: string
    critical_type?: string
    severity?: string
  }

  if (!toilet_id) {
    res.status(400).json({ success: false, error: 'toilet_id is required' })
    return
  }

  const config = findToiletConfig(toilet_id)
  if (!config) {
    res.status(404).json({ success: false, error: `Unknown toilet_id: ${toilet_id}` })
    return
  }

  const alertType = critical_type || 'Sanitation Overflow'
  const alertSeverity = (severity || 'CRITICAL').toUpperCase()

  const result = await triggerCriticalAlert(toilet_id, alertType, alertSeverity)
  const payload = buildCriticalPayload(toilet_id, alertType, alertSeverity)

  res.json({
    success: result.success,
    skipped: result.skipped,
    error: result.error,
    toilet_id,
    payload,
  })
})

// ── POST /api/alerts/toilet-critical ─────────────────────────────────────────

router.post('/alerts/toilet-critical', async (req: Request, res: Response) => {
  const { toilet_id, mukam_id, zone_id, critical_type, severity } = req.body as {
    toilet_id?: string
    mukam_id?: string
    zone_id?: string
    critical_type?: string
    severity?: string
  }

  const alertType = critical_type || 'Sanitation Overflow'
  const alertSeverity = severity || 'CRITICAL'

  // If specific toilet_id provided, alert that toilet only
  if (toilet_id) {
    const config = findToiletConfig(toilet_id)
    if (!config) {
      res.status(404).json({ success: false, error: `Unknown toilet_id: ${toilet_id}` })
      return
    }

    const result = await triggerCriticalAlert(toilet_id, alertType, alertSeverity)
    res.json({
      success: result.success,
      skipped: result.skipped,
      error: result.error,
      toilet_id,
    })
    return
  }

  // If mukam_id provided, alert all toilet_cluster points in that mukam
  if (mukam_id) {
    const toiletConfigs = findToiletConfigsByMukamId(mukam_id)
    const results = []

    for (const config of toiletConfigs) {
      if (!config.sanitationPointId) continue
      const result = await triggerCriticalAlert(config.id, alertType, alertSeverity)
      results.push({
        toilet_id: config.id,
        success: result.success,
        skipped: result.skipped,
        error: result.error,
      })
    }

    res.json({
      success: results.some(r => r.success),
      results,
    })
    return
  }

  res.status(400).json({ success: false, error: 'toilet_id or mukam_id is required' })
})

// ── POST /api/test/toilet-critical ──────────────────────────────────────────

router.post('/test/toilet-critical', async (req: Request, res: Response) => {
  const { toilet_id, critical_type, severity } = req.body as {
    toilet_id?: string
    critical_type?: string
    severity?: string
  }

  if (!toilet_id) {
    res.status(400).json({ success: false, error: 'toilet_id is required' })
    return
  }

  const config = findToiletConfig(toilet_id)
  if (!config) {
    res.status(404).json({ success: false, error: `Unknown toilet_id: ${toilet_id}` })
    return
  }

  const alertType = critical_type || 'Hygiene'
  const alertSeverity = severity || 'CRITICAL'
  const payload = buildCriticalPayload(toilet_id, alertType, alertSeverity)

  // Trigger the n8n webhook
  const webhookResult = await triggerCriticalAlert(toilet_id, alertType, alertSeverity)

  // Optionally send WhatsApp messages (only if explicitly enabled)
  let whatsappResults: Array<{ name: string; phone: string; success: boolean; error?: string }> = []
  if (webhookResult.success && !webhookResult.skipped) {
    whatsappResults = await sendWhatsAppAlert(config.team, formatWhatsAppMessage(payload))
  }

  res.json({
    success: true,
    test: true,
    payload,
    webhook: webhookResult,
    whatsapp: whatsappResults,
  })
})

// ── POST /api/toilets/:toiletId/resolve ─────────────────────────────────────

router.post('/:toiletId/resolve', (req: Request, res: Response) => {
  const { toiletId } = req.params
  const { severity } = req.body as { severity?: string }

  const config = findToiletConfig(toiletId)
  if (!config) {
    res.status(404).json({ success: false, error: `Unknown toilet_id: ${toiletId}` })
    return
  }

  const sev = (severity || 'CRITICAL').toUpperCase()
  clearResolvedAlert(toiletId, sev)

  res.json({
    success: true,
    message: `Alert cleared for ${toiletId} (${sev})`,
  })
})

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatWhatsAppMessage(payload: CriticalToiletAlert): string {
  const date = new Date(payload.triggered_at)
  const timeStr = date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })

  return `🚨 CRITICAL TOILET ALERT

Toilet: ${payload.toilet_name}
Toilet ID: ${payload.toilet_id}
Issue: ${payload.critical_type}
Severity: ${payload.severity}

Immediate attention is required.

Time: ${timeStr}

Please inspect the toilet immediately.`
}

export default router
