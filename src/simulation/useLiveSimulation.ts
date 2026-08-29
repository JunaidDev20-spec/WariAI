// ── useLiveSimulation.ts ──────────────────────────────────────────────────
// React hook that owns a single setInterval and manages per-Mukam live state.
//
// Rules:
//   • ONE interval at all times — created once, never recreated.
//   • Each Mukam's state is independent and persists across navigation.
//   • The map is NEVER reset on Mukam switch (no layout impact).
//   • Cleanup is strict — interval cleared on unmount.
//   • No state update on unmounted component.
// ─────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect, useCallback } from 'react'
import { MUKAMS } from '../data/mockCommandData'
import {
  tickMukam,
  buildAllInitialStates,
  type MukamLiveState,
} from './simulationEngine'
import { submitCrowdData, getCleanlinessStatus } from '../api/operationsApi'
import type { CleanlinessDemand } from '../api/operationsApi'

// Tick interval in milliseconds — 7s is demo-friendly and readable
const TICK_INTERVAL_MS = 7000

export interface LiveSimulationResult {
  liveState: MukamLiveState
  switchMukam: (id: string) => void
  cleanlinessDemand: CleanlinessDemand | null
  deploymentAvailable: boolean
}

export function useLiveSimulation(): LiveSimulationResult {
  // All Mukam states in one Map — keyed by mukamId
  // Using useRef for the actual store to avoid triggering re-renders from
  // the interval itself; we push selected-Mukam state into useState separately.
  const stateMapRef = useRef<Map<string, MukamLiveState>>(buildAllInitialStates())

  // Current mukam index, mirrored here so the interval can tick the right one
  const currentMukamIdRef = useRef<string>(MUKAMS[0].id)

  // Exposed React state — ONLY the currently selected Mukam's live data
  const [liveState, setLiveState] = useState<MukamLiveState>(
    () => stateMapRef.current.get(MUKAMS[0].id)!
  )

  // Track mount status to avoid setState after unmount
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // Cleanliness demand from backend (derived from M1 crowd data)
  const [cleanlinessDemand, setCleanlinessDemand] = useState<CleanlinessDemand | null>(null)
  const [deploymentAvailable, setDeploymentAvailable] = useState(false)

  // ── Single interval — created once ───────────────────────────────────
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!mountedRef.current) return

      const currentId  = currentMukamIdRef.current
      const mukamStatic = MUKAMS.find(m => m.id === currentId)
      if (!mukamStatic) return

      const prev    = stateMapRef.current.get(currentId)!
      const updated = tickMukam(prev, mukamStatic)

      stateMapRef.current.set(currentId, updated)

      // Only push to React state if this is still the displayed Mukam
      if (mountedRef.current) {
        setLiveState(updated)

        // POST crowd data to backend for cleanliness calculation
        const totalCrowd = updated.zones.reduce((sum, z) => sum + z.crowd, 0)
        submitCrowdData(currentId, totalCrowd)
          .then(result => {
            if (mountedRef.current) {
              setCleanlinessDemand(result.cleanliness)
              setDeploymentAvailable(result.deploymentAvailable)
            }
          })
          .catch(() => {
            // Backend unavailable — fetch status instead
            getCleanlinessStatus()
              .then(status => {
                if (mountedRef.current) {
                  setCleanlinessDemand(status.cleanliness)
                  setDeploymentAvailable(status.deploymentAvailable)
                }
              })
              .catch(() => { /* non-fatal */ })
          })
      }
    }, TICK_INTERVAL_MS)

    return () => clearInterval(intervalId)
  }, []) // ← empty deps: created once, never recreated

  // ── Called when user navigates to a different Mukam ───────────────────
  // Returns the current persisted state for that Mukam immediately
  const switchMukam = useCallback((mukamId: string) => {
    currentMukamIdRef.current = mukamId
    const existing = stateMapRef.current.get(mukamId)
    if (existing && mountedRef.current) {
      setLiveState(existing)
    }
  }, [])

  return { liveState, switchMukam, cleanlinessDemand, deploymentAvailable }
}
