// ── useToiletAlertTrigger.ts ────────────────────────────────────────────────
// React hook that watches the live simulation state and triggers backend
// critical-alert webhooks when zones transition to CRITICAL.
//
// For each critical zone, maps to the assigned toilet(s) and fires
// a single webhook per toilet (duplicate-alert protection is enforced
// server-side in the toiletAlertService).

import { useEffect, useRef, useCallback } from 'react'
import type { MukamLiveState } from '../simulation/simulationEngine'
import type { ZoneStatus } from '../data/mockCommandData'
import {
  triggerToiletCritical,
  getToiletConfigs,
} from '../api/operationsApi'
import {
  getToiletIdsForZone,
  getAllToiletIdsForMukam,
  type ToiletConfigSummary,
} from '../data/toiletZoneMap'

interface UseToiletAlertTriggerProps {
  liveState: MukamLiveState
  enabled?: boolean
}

export function useToiletAlertTrigger({ liveState, enabled = true }: UseToiletAlertTriggerProps) {
  const prevStatusRef   = useRef<Record<string, ZoneStatus>>({})
  const toiletCooldown  = useRef<Set<string>>(new Set())
  const configsLoadedRef = useRef(false)
  const configCacheRef  = useRef<Record<string, ToiletConfigSummary>>({})

  const trigger = useCallback(async (toiletId: string, criticalType: string) => {
    if (toiletCooldown.current.has(toiletId)) return

    try {
      await triggerToiletCritical(toiletId, criticalType)
      toiletCooldown.current.add(toiletId)
      setTimeout(() => {
        toiletCooldown.current.delete(toiletId)
      }, 5 * 60 * 1000)
    } catch {
      // Silently ignore alert failures — don't crash the UI
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    getToiletConfigs().then(data => {
      if (cancelled) return
      if (data.success && data.configs) {
        const cache: Record<string, ToiletConfigSummary> = {}
        for (const c of data.configs) {
          cache[c.id] = c
        }
        configCacheRef.current = cache
        configsLoadedRef.current = true
      }
    }).catch(() => {
      // If config fetch fails, continue without per-toilet mapping
    })

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!enabled) return

    const currentStatuses: Record<string, ZoneStatus> = {}
    const mukamId = liveState.mukamId

    for (const zone of liveState.zones) {
      currentStatuses[zone.id] = zone.status

      const prev = prevStatusRef.current[zone.id]

      if (zone.status === 'critical' && prev !== 'critical') {
        if (configsLoadedRef.current) {
          const toiletIds = getToiletIdsForZone(mukamId, zone.id)
          const criticalType = zone.currentLoad >= 95 ? 'Overflow' : 'Hygiene'
          for (const tid of toiletIds) {
            trigger(tid, criticalType)
          }
        } else {
          const allToiletIds = getAllToiletIdsForMukam(mukamId)
          const criticalType = zone.currentLoad >= 95 ? 'Overflow' : 'Hygiene'
          for (const tid of allToiletIds) {
            trigger(tid, criticalType)
          }
        }
      }
    }

    prevStatusRef.current = currentStatuses
  }, [liveState, enabled, trigger])
}
