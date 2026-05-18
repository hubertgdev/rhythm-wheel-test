import { useEffect, useRef, useState } from 'react'
import type { AudioEngine } from '@/audio/AudioEngine'

export type ClockSnapshot = {
  isPlaying: boolean
  ctxTime: number
  startTime: number
}

export function useTransportClock(engine: AudioEngine | null, isPlaying: boolean): ClockSnapshot {
  const [snap, setSnap] = useState<ClockSnapshot>({ isPlaying: false, ctxTime: 0, startTime: 0 })
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!engine) return
    if (!isPlaying) {
      setSnap((s) => ({ ...s, isPlaying: false }))
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      return
    }
    const tick = () => {
      setSnap({
        isPlaying: engine.isPlaying,
        ctxTime: engine.getContextTime(),
        startTime: engine.startTime,
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [engine, isPlaying])

  return snap
}
