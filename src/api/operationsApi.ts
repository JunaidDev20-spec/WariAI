// ── src/api/operationsApi.ts ──────────────────────────────────────────────
// Centralized API client for the WariAI Express backend.
// All fetch() calls go through here — no raw fetch in components or hooks.
//
// Base URL: http://localhost:5000/api
// Non-OK responses throw an Error with the server's error message.

import type { Incident, IncidentStatus } from '../types/operations'
import type { OperationalResource } from '../data/mockResources'

const BASE = 'http://localhost:5000/api'

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
