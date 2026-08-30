// ── useMapInteraction ─────────────────────────────────────────────────────
// Correct implementation using native DOM listeners only.
// React synthetic events are NOT used for drag/wheel — they cause stale
// closure issues and cannot prevent default on passive listeners.
//
// Contract:
//   • Mouse only moves the map when the LEFT button is held down (dragging).
//   • Moving the mouse WITHOUT pressing a button NEVER moves the map.
//   • Wheel zooms only while pointer is over the container.
//   • Page scroll is prevented while wheeling over the map.
//   • animateTo() drives smooth Mukam transitions via rAF.
// ─────────────────────────────────────────────────────────────────────────

import { useRef, useState, useCallback, useEffect } from 'react'

// ── Public types ──────────────────────────────────────────────────────────

export interface MapTransform {
  scale: number
  tx: number
  ty: number
}

export interface UseMapInteractionOptions {
  minScale?: number   // default 0.65
  maxScale?: number   // default 2.8
  zoomStep?: number   // button step, default 0.25
  viewW?: number      // SVG viewBox width,  default 800
  viewH?: number      // SVG viewBox height, default 420
}

// ── Internal helpers ──────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function clampTx(tx: number, ty: number, scale: number, vw: number, vh: number) {
  // Keep at least 30% of the canvas visible when panned
  const margin = 0.30
  const extraW = Math.max(0, (scale - 1) * vw)
  const extraH = Math.max(0, (scale - 1) * vh)
  return {
    tx: clamp(tx, -extraW * (1 - margin), extraW * (1 - margin)),
    ty: clamp(ty, -extraH * (1 - margin), extraH * (1 - margin)),
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────

export function useMapInteraction({
  minScale = 0.65,
  maxScale = 2.8,
  zoomStep = 0.25,
  viewW    = 800,
  viewH    = 420,
}: UseMapInteractionOptions = {}) {

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef       = useRef<SVGSVGElement>(null)

  // All transform state lives in a ref for zero-lag reads inside listeners.
  // We shadow it with React state so components re-render when it changes.
  const xfRef = useRef<MapTransform>({ scale: 1, tx: 0, ty: 0 })
  const [transform, setTransformState] = useState<MapTransform>({ scale: 1, tx: 0, ty: 0 })

  // Drag bookkeeping — pure refs, no state needed
  const dragRef = useRef<{
    active: boolean
    startMx: number; startMy: number
    startTx: number; startTy: number
    moved: boolean      // true once pointer moved >4px — separates drag from click
  }>({ active: false, startMx: 0, startMy: 0, startTx: 0, startTy: 0, moved: false })

  // isDragging state — used only for cursor styling
  const [isDragging, setIsDragging] = useState(false)

  // Animation
  const rafRef = useRef<number | null>(null)

  // ── Commit a new transform (updates ref + React state) ─────────────────
  const commit = useCallback((next: MapTransform) => {
    const scale = clamp(next.scale, minScale, maxScale)
    const { tx, ty } = clampTx(next.tx, next.ty, scale, viewW, viewH)
    xfRef.current = { scale, tx, ty }
    setTransformState({ scale, tx, ty })
  }, [minScale, maxScale, viewW, viewH])

  // ── Wire up all native DOM listeners ──────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // ── Pointer down ─────────────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return        // only left button
      e.preventDefault()
      el.setPointerCapture(e.pointerId) // keep receiving events even outside

      dragRef.current = {
        active: true,
        startMx: e.clientX, startMy: e.clientY,
        startTx: xfRef.current.tx, startTy: xfRef.current.ty,
        moved: false,
      }
      // Don't call setIsDragging here — wait until actual movement to avoid
      // a flicker on simple clicks
    }

    // ── Pointer move ─────────────────────────────────────────────────
    const onPointerMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return   // ← CRITICAL: no drag = no movement

      const dx = e.clientX - dragRef.current.startMx
      const dy = e.clientY - dragRef.current.startMy

      // Start dragging only after 4px threshold
      if (!dragRef.current.moved) {
        if (Math.hypot(dx, dy) < 4) return
        dragRef.current.moved = true
        setIsDragging(true)
      }

      // Convert pixel delta → SVG user-unit delta (account for element size vs viewBox)
      const rect   = el.getBoundingClientRect()
      const pixelToSvgX = viewW / rect.width
      const pixelToSvgY = viewH / rect.height

      // Divide by current scale so dragging feels 1:1 regardless of zoom
      const rawTx = dragRef.current.startTx + dx * pixelToSvgX / xfRef.current.scale
      const rawTy = dragRef.current.startTy + dy * pixelToSvgY / xfRef.current.scale

      commit({ ...xfRef.current, tx: rawTx, ty: rawTy })
    }

    // ── Pointer up / cancel ───────────────────────────────────────────
    const onPointerUp = () => {
      // Keep .moved true until after any click event fires so zone handlers
      // can check didDragRef.current to suppress selection.
      const wasMoved = dragRef.current.moved
      dragRef.current.active = false
      setIsDragging(false)
      if (wasMoved) {
        setTimeout(() => { dragRef.current.moved = false }, 0)
      } else {
        dragRef.current.moved = false
      }
    }

    // ── Wheel zoom ────────────────────────────────────────────────────
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()   // prevent page scroll while over map
      e.stopPropagation()

      const rect  = el.getBoundingClientRect()
      // Cursor position in SVG user-units
      const cursorSvgX = ((e.clientX - rect.left) / rect.width)  * viewW
      const cursorSvgY = ((e.clientY - rect.top)  / rect.height) * viewH

      const { scale: curScale, tx: curTx, ty: curTy } = xfRef.current

      // Sensitivity tuned so one notch ≈ 10% zoom
      const delta     = -e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.001)
      const newScale  = clamp(curScale * (1 + delta), minScale, maxScale)
      const ratio     = newScale / curScale

      // Zoom toward cursor: keep the SVG point under the cursor fixed
      // P_svg = (cursorSvgX - curTx) / curScale  (world space)
      // After zoom: cursorSvgX = newTx + worldX * newScale
      //   → newTx = cursorSvgX - worldX * newScale
      //           = cursorSvgX - (cursorSvgX - curTx) * ratio
      const newTx = cursorSvgX - (cursorSvgX - curTx) * ratio
      const newTy = cursorSvgY - (cursorSvgY - curTy) * ratio

      commit({ scale: newScale, tx: newTx, ty: newTy })
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup',   onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup',   onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [commit, viewW, viewH, minScale, maxScale])

  // ── animateTo ─────────────────────────────────────────────────────────
  // Uses xfRef for the start value — avoids stale closure issues.
  const animateTo = useCallback((target: Partial<MapTransform>, durationMs = 420) => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    const from  = { ...xfRef.current }
    const to: MapTransform = {
      scale: target.scale ?? from.scale,
      tx:    target.tx    ?? from.tx,
      ty:    target.ty    ?? from.ty,
    }
    const startTime = performance.now()

    const tick = (now: number) => {
      const raw = Math.min((now - startTime) / durationMs, 1)
      // cubic ease-out
      const t = 1 - Math.pow(1 - raw, 3)

      commit({
        scale: from.scale + (to.scale - from.scale) * t,
        tx:    from.tx    + (to.tx    - from.tx)    * t,
        ty:    from.ty    + (to.ty    - from.ty)    * t,
      })

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [commit])

  // ── Button controls ───────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    const { scale, tx, ty } = xfRef.current
    const newScale = clamp(scale + zoomStep, minScale, maxScale)
    commit({ scale: newScale, tx, ty })
  }, [commit, zoomStep, minScale, maxScale])

  const zoomOut = useCallback(() => {
    const { scale, tx, ty } = xfRef.current
    const newScale = clamp(scale - zoomStep, minScale, maxScale)
    commit({ scale: newScale, tx, ty })
  }, [commit, zoomStep, minScale, maxScale])

  const resetTransform = useCallback(() => {
    animateTo({ scale: 1, tx: 0, ty: 0 }, 400)
  }, [animateTo])

  // Cleanup animation on unmount
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  return {
    transform,
    isDragging,
    svgRef,
    containerRef,
    zoomIn,
    zoomOut,
    resetTransform,
    animateTo,
    cursor: isDragging ? 'grabbing' : 'grab',
    // Expose drag ref so CommandMap can suppress zone click after a drag
    didDragRef: dragRef,
  }
}
