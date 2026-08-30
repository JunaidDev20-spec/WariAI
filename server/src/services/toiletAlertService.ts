// ── server/src/services/toiletAlertService.ts ──────────────────────────────
// Critical toilet alert service.
// Triggers n8n webhook when a toilet reaches CRITICAL condition.
// Includes duplicate-alert protection.

import { findToiletConfig, getToiletName, type ToiletTeamMember } from '../data/toiletConfig.js'

// ── Configuration ──────────────────────────────────────────────────────────

const N8N_WEBHOOK_URL = process.env.N8N_TOILET_CRITICAL_WEBHOOK_URL || ''
const ENABLE_WHATSAPP_ALERTS = (process.env.ENABLE_WHATSAPP_ALERTS || 'false').toLowerCase() === 'true'

// ── Duplicate-alert protection ─────────────────────────────────────────────

interface AlertState {
  toiletId: string
  severity: string
  triggeredAt: number // timestamp
}

const activeAlerts = new Map<string, AlertState>()

function getAlertKey(toiletId: string, severity: string): string {
  return `${toiletId}:${severity}`
}

function isDuplicateAlert(toiletId: string, severity: string): boolean {
  const key = getAlertKey(toiletId, severity)
  const existing = activeAlerts.get(key)
  if (!existing) return false

  const ageMs = Date.now() - existing.triggeredAt
  // Consider an alert stale after 5 minutes — allows re-trigger if condition persists
  if (ageMs > 5 * 60 * 1000) {
    activeAlerts.delete(key)
    return false
  }
  return true
}

function markAlertSent(toiletId: string, severity: string): void {
  const key = getAlertKey(toiletId, severity)
  activeAlerts.set(key, { toiletId, severity, triggeredAt: Date.now() })
}

function clearAlert(toiletId: string, severity: string): void {
  const key = getAlertKey(toiletId, severity)
  activeAlerts.delete(key)
}

// ── Webhook payload builder ─────────────────────────────────────────────────

export interface CriticalToiletAlert {
  event: string
  critical: boolean
  toilet_id: string
  toilet_name: string
  critical_type: string
  severity: string
  message: string
  triggered_at: string
}

export function buildCriticalPayload(
  toiletId: string,
  criticalType: string,
  severity: string,
): CriticalToiletAlert {
  const toiletName = getToiletName(toiletId) || toiletId

  return {
    event: 'toilet_critical',
    critical: true,
    toilet_id: toiletId,
    toilet_name: toiletName,
    critical_type: criticalType,
    severity: severity.toUpperCase(),
    message: `Critical toilet condition detected at ${toiletName}.`,
    triggered_at: new Date().toISOString(),
  }
}

// ── n8n webhook trigger ─────────────────────────────────────────────────────

export async function triggerCriticalAlert(
  toiletId: string,
  criticalType: string,
  severity: string,
): Promise<{ success: boolean; skipped: boolean; error?: string }> {
  // Duplicate-alert protection
  if (isDuplicateAlert(toiletId, severity)) {
    return { success: true, skipped: true }
  }

  // Validate toilet exists in config
  const config = findToiletConfig(toiletId)
  if (!config) {
    return { success: false, skipped: false, error: `Unknown toilet_id: ${toiletId}` }
  }

  const payload = buildCriticalPayload(toiletId, criticalType, severity)

  // If webhook URL is not configured, log and skip
  if (!N8N_WEBHOOK_URL) {
    console.warn(`[toilet-alert] N8N_WEBHOOK_URL not configured. Skipping webhook for ${toiletId}.`)
    console.info(`[toilet-alert] Payload: ${JSON.stringify(payload)}`)
    markAlertSent(toiletId, severity)
    return { success: true, skipped: true }
  }

  try {
    const res = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Webhook responded with ${res.status}: ${text}`)
    }

    markAlertSent(toiletId, severity)
    console.info(`[toilet-alert] Triggered webhook for ${toiletId} (${criticalType})`)
    return { success: true, skipped: false }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[toilet-alert] Failed to trigger webhook for ${toiletId}: ${message}`)
    // Do not mark as sent on failure — allows retry on next cycle
    return { success: false, skipped: false, error: message }
  }
}

// ── WhatsApp bridge trigger (called by n8n or directly) ─────────────────────

export async function sendWhatsAppAlert(
  team: ToiletTeamMember[],
  alertMessage: string,
): Promise<Array<{ name: string; phone: string; success: boolean; error?: string }>> {
  const whatsappBridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:3001'

  const results = []

  for (const member of team) {
    if (!ENABLE_WHATSAPP_ALERTS) {
      console.info(`[whatsapp] Dry-run: would send to ${member.name} (${member.phone})`)
      results.push({ name: member.name, phone: member.phone, success: true })
      continue
    }

    try {
      const res = await fetch(`${whatsappBridgeUrl}/api/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: member.phone,
          message: `Hi ${member.name},\n\n${alertMessage}`,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`WhatsApp bridge responded with ${res.status}: ${text}`)
      }

      const data = await res.json() as { success?: boolean; error?: string }
      if (data.success === false) {
        throw new Error(data.error || 'WhatsApp bridge returned failure')
      }

      results.push({ name: member.name, phone: member.phone, success: true })
      console.info(`[whatsapp] Sent alert to ${member.name} (${member.phone})`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results.push({ name: member.name, phone: member.phone, success: false, error: message })
      console.error(`[whatsapp] Failed to send to ${member.name} (${member.phone}): ${message}`)
    }
  }

  return results
}

// ── Alert state management ──────────────────────────────────────────────────

export function clearAllAlerts(): void {
  activeAlerts.clear()
}

export function getActiveAlerts(): AlertState[] {
  return Array.from(activeAlerts.values())
}

export function clearResolvedAlert(toiletId: string, severity: string): void {
  clearAlert(toiletId, severity)
}
