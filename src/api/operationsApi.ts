// ── src/api/operationsApi.ts ──────────────────────────────────────────────
// Centralized API client for the WariAI Express backend.
// All fetch() calls go through here — no raw fetch in components or hooks.
//
// Base URL: http://localhost:5000/api
// Non-OK responses throw an Error with the server's error message.

import type { Incident, IncidentStatus } from '../types/operations'
import type { OperationalResource } from '../data/mockResources'

const BASE = '/api'

// ── Generic fetch wrapper ─────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    let message = `API error ${res.status}`
    try {
      const body = await res.json() as { error?: string }
      if (body.error) message = body.error
    } catch { /* ignore parse failure */ }
    throw new Error(message)
  }
  return res.json() as Promise<T>
}

// ── Health ────────────────────────────────────────────────────────────────

export function checkHealth(): Promise<{ status: string }> {
  return apiFetch('/health')
}

// ── Incidents ─────────────────────────────────────────────────────────────

export function getIncidents(filters?: {
  mukamId?: string
  status?: IncidentStatus
}): Promise<Incident[]> {
  const params = new URLSearchParams()
  if (filters?.mukamId) params.set('mukamId', filters.mukamId)
  if (filters?.status)  params.set('status',  filters.status)
  const qs = params.toString()
  return apiFetch<Incident[]>(`/incidents${qs ? `?${qs}` : ''}`)
}

export function createIncident(incident: Omit<Incident, 'status' | 'assignedResourceIds'>): Promise<Incident> {
  return apiFetch<Incident>('/incidents', {
    method: 'POST',
    body:   JSON.stringify(incident),
  })
}

export function updateIncident(id: string, patch: Partial<Incident>): Promise<Incident> {
  return apiFetch<Incident>(`/incidents/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(patch),
  })
}

export function resolveIncident(id: string): Promise<Incident> {
  return apiFetch<Incident>(`/incidents/${id}/resolve`, { method: 'POST' })
}

// ── Resources ─────────────────────────────────────────────────────────────

export function getResources(filters?: {
  mukamId?: string
  status?: string
}): Promise<OperationalResource[]> {
  const params = new URLSearchParams()
  if (filters?.mukamId) params.set('mukamId', filters.mukamId)
  if (filters?.status)  params.set('status',  filters.status)
  const qs = params.toString()
  return apiFetch<OperationalResource[]>(`/resources${qs ? `?${qs}` : ''}`)
}

export function getResource(id: string): Promise<OperationalResource> {
  return apiFetch<OperationalResource>(`/resources/${id}`)
}

// ── Deployments ───────────────────────────────────────────────────────────

export interface DeployResult {
  deployment: { id: string; incidentId: string; resourceIds: string[]; createdAt: number }
  incident:   Incident
  resources:  OperationalResource[]
}

export function deployResources(incidentId: string, resourceIds: string[]): Promise<DeployResult> {
  return apiFetch<DeployResult>('/deployments', {
    method: 'POST',
    body:   JSON.stringify({ incidentId, resourceIds }),
  })
}

export interface ResolveResult {
  incident:       Incident
  freedResources: OperationalResource[]
}

export function resolveDeployment(incidentId: string): Promise<ResolveResult> {
  return apiFetch<ResolveResult>(`/deployments/${incidentId}/resolve`, { method: 'POST' })
}

// ── Chat ───────────────────────────────────────────────────────────────────

export interface ChatResponse {
  answer: string
}

export function sendChatMessage(message: string): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

// ── Toilet Alerts ───────────────────────────────────────────────────────────

export interface ToiletConfigResponse {
  success: boolean
  configs: Array<{
    id: string
    name: string
    mukamId?: string
    sanitationPointId?: string
    team: Array<{ name: string; phone: string }>
  }>
}

export interface ToiletTeamResponse {
  success: boolean
  toilet_id: string
  toilet_name: string
  team: Array<{ name: string; phone: string }>
}

export interface ToiletCriticalResponse {
  success: boolean
  skipped: boolean
  error?: string
  toilet_id: string
  payload: {
    event: string
    critical: boolean
    toilet_id: string
    toilet_name: string
    critical_type: string
    severity: string
    message: string
    triggered_at: string
  }
}

export function getToiletConfigs(): Promise<ToiletConfigResponse> {
  return apiFetch<ToiletConfigResponse>('/toilets/all-configs')
}

export function getToiletTeam(toiletId: string): Promise<ToiletTeamResponse> {
  return apiFetch<ToiletTeamResponse>(`/toilets/${encodeURIComponent(toiletId)}/team`)
}

export function triggerToiletCritical(
  toiletId: string,
  criticalType = 'Sanitation Overflow',
  severity = 'CRITICAL',
): Promise<ToiletCriticalResponse> {
  return apiFetch<ToiletCriticalResponse>('/toilets/toilet-critical', {
    method: 'POST',
    body: JSON.stringify({ toilet_id: toiletId, critical_type: criticalType, severity }),
  })
}

export interface ToiletAlertRequest {
  toilet_id?: string
  mukam_id?: string
  zone_id?: string
  critical_type?: string
  severity?: string
}

export interface ToiletAlertResponse {
  success: boolean
  skipped: boolean
  error?: string
  results?: Array<{
    toilet_id: string
    success: boolean
    skipped: boolean
    error?: string
  }>
}

export function triggerToiletCriticalAlert(req: ToiletAlertRequest): Promise<ToiletAlertResponse> {
  return apiFetch<ToiletAlertResponse>('/alerts/toilet-critical', {
    method: 'POST',
    body: JSON.stringify(req),
  })
}
