import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AudioEngine } from '@/audio/AudioEngine'
import type { Dot, Sample } from '@/audio/types'
import { useTransportClock } from '@/hooks/useTransportClock'
import { useStore } from '@/state/store'

const SIZE = 400
const CENTER = SIZE / 2
const R_TICK = 170
const R_MAX = 162
const R_MIN = 22

const positionToAngle = (p: number) => p * Math.PI * 2 - Math.PI / 2
const angleToPosition = (a: number) => {
  let p = (a + Math.PI / 2) / (Math.PI * 2)
  p = p % 1
  return p < 0 ? p + 1 : p
}

const dotXY = (p: number, v: number) => {
  const r = Math.max(R_MIN, v * R_MAX)
  const a = positionToAngle(p)
  return { x: CENTER + r * Math.cos(a), y: CENTER + r * Math.sin(a), r }
}

const tickXY = (i: number, beats: number, inner: number, outer: number) => {
  const a = positionToAngle(i / beats)
  return {
    x1: CENTER + inner * Math.cos(a),
    y1: CENTER + inner * Math.sin(a),
    x2: CENTER + outer * Math.cos(a),
    y2: CENTER + outer * Math.sin(a),
  }
}

type DragState = {
  pointerId: number
  sampleId: string
  dotId: string
  snap: boolean
}

type Props = {
  engine: AudioEngine | null
  isPlaying: boolean
}

export function Wheel({ engine, isPlaying }: Props) {
  const { state, dispatch } = useStore()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const clock = useTransportClock(engine, isPlaying)

  const loopDuration = (60 / state.bpm) * state.beats
  const phase = useMemo(() => {
    if (!clock.isPlaying || loopDuration <= 0) return 0
    const elapsed = clock.ctxTime - clock.startTime
    if (elapsed < 0) return 0
    const f = (elapsed % loopDuration) / loopDuration
    return f < 0 ? f + 1 : f
  }, [clock, loopDuration])

  const currentBeat = clock.isPlaying ? Math.floor(phase * state.beats) % state.beats : -1

  const clientToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const rect = svg.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * SIZE
    const y = ((clientY - rect.top) / rect.height) * SIZE
    return { x, y }
  }, [])

  const onDotPointerDown = (e: React.PointerEvent<SVGElement>, sample: Sample, dot: Dot) => {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as SVGElement).setPointerCapture(e.pointerId)
    setDrag({ pointerId: e.pointerId, sampleId: sample.id, dotId: dot.id, snap: sample.snap })
  }

  const onPointerMove = (e: React.PointerEvent<SVGElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return
    const pt = clientToSvg(e.clientX, e.clientY)
    if (!pt) return
    const dx = pt.x - CENTER
    const dy = pt.y - CENTER
    const dist = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)
    let position = angleToPosition(angle)
    if (drag.snap) {
      const step = 1 / state.beats
      position = Math.round(position / step) * step
      position = position % 1
    }
    const velocity = Math.max(0.05, Math.min(1, dist / R_MAX))
    dispatch({ type: 'update-dot', sampleId: drag.sampleId, dotId: drag.dotId, position, velocity })
  }

  const onPointerUp = (e: React.PointerEvent<SVGElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return
    try {
      ;(e.currentTarget as SVGElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
    setDrag(null)
  }

  useEffect(() => {
    if (!drag) return
    const onUp = () => setDrag(null)
    window.addEventListener('pointercancel', onUp)
    return () => window.removeEventListener('pointercancel', onUp)
  }, [drag])

  const ticks = []
  const beats = state.beats
  for (let i = 0; i < beats; i++) {
    const isQuarter = beats % 4 === 0 && i % 4 === 0
    const outer = R_TICK + (isQuarter ? 10 : 6)
    const inner = R_TICK - (isQuarter ? 4 : 2)
    const { x1, y1, x2, y2 } = tickXY(i, beats, inner, outer)
    const isActive = i === currentBeat
    ticks.push(
      <line
        key={`tick-${i}`}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        className={isActive ? 'rw-tick-active' : isQuarter ? 'rw-tick-strong' : 'rw-tick'}
        strokeLinecap="round"
      />,
    )
  }

  const sweepAngle = positionToAngle(phase)
  const sweepX = CENTER + R_TICK * Math.cos(sweepAngle)
  const sweepY = CENTER + R_TICK * Math.sin(sweepAngle)

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="Rhythm wheel sequencer"
      className="rw-wheel w-full h-auto touch-none select-none"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <title>Rhythm wheel sequencer</title>
      <circle cx={CENTER} cy={CENTER} r={R_TICK} className="rw-rim" />
      {ticks}
      {clock.isPlaying && (
        <line x1={CENTER} y1={CENTER} x2={sweepX} y2={sweepY} className="rw-sweep" strokeLinecap="round" />
      )}
      {state.samples.flatMap((sample) =>
        sample.dots.map((dot) => {
          const { x, y } = dotXY(dot.position, dot.velocity)
          const triggerTime = clock.startTime + dot.position * loopDuration
          let pulse = 0
          if (clock.isPlaying && loopDuration > 0) {
            let delta = clock.ctxTime - triggerTime
            if (delta < 0) {
              const k = Math.ceil(-delta / loopDuration)
              delta += k * loopDuration
            }
            const sinceLast = delta % loopDuration
            if (sinceLast < 0.2) pulse = 1 - sinceLast / 0.2
          }
          const dotRadius = 9 + pulse * 6
          return (
            <g key={dot.id} className={`rw-sample-${sample.type}`}>
              <line x1={CENTER} y1={CENTER} x2={x} y2={y} className="rw-dot-line" strokeLinecap="round" />
              <circle
                cx={x}
                cy={y}
                r={dotRadius + 8}
                className="rw-dot-hit"
                onPointerDown={(e) => onDotPointerDown(e, sample, dot)}
              />
              <circle cx={x} cy={y} r={dotRadius} className="rw-dot" style={{ opacity: 0.7 + pulse * 0.3 }} />
            </g>
          )
        }),
      )}
      <circle cx={CENTER} cy={CENTER} r={3} className="rw-center" />
    </svg>
  )
}
