import { createContext, useContext } from 'react'
import {
  type ClapParams,
  DEFAULT_CLAP_PARAMS,
  DEFAULT_KICK_PARAMS,
  type KickParams,
  type Sample,
  type SequenceState,
} from '@/audio/types'

let dotCounter = 0
const newDotId = () => `dot-${++dotCounter}-${Date.now().toString(36)}`

const evenDots = (count: number, prev: Sample['dots'] = []): Sample['dots'] => {
  const out: Sample['dots'] = []
  for (let i = 0; i < count; i++) {
    out.push({
      id: prev[i]?.id ?? newDotId(),
      position: i / Math.max(1, count),
      velocity: prev[i]?.velocity ?? 0.8,
    })
  }
  return out
}

const dotsAt = (positions: number[]): Sample['dots'] =>
  positions.map((position) => ({ id: newDotId(), position, velocity: 0.85 }))

export const initialState: SequenceState = {
  bpm: 110,
  beats: 16,
  isPlaying: false,
  samples: [
    {
      id: 'kick',
      name: 'Kick',
      type: 'kick',
      params: { ...DEFAULT_KICK_PARAMS },
      repetitions: 4,
      dots: evenDots(4),
      snap: true,
      even: true,
    },
    {
      id: 'clap',
      name: 'Clap',
      type: 'clap',
      params: { ...DEFAULT_CLAP_PARAMS },
      repetitions: 2,
      dots: dotsAt([0.25, 0.75]),
      snap: true,
      even: false,
    },
  ],
}

export type Action =
  | { type: 'set-bpm'; value: number }
  | { type: 'set-beats'; value: number }
  | { type: 'set-playing'; value: boolean }
  | { type: 'set-sample-params'; sampleId: string; params: Partial<KickParams> | Partial<ClapParams> }
  | { type: 'set-repetitions'; sampleId: string; value: number }
  | { type: 'set-snap'; sampleId: string; value: boolean }
  | { type: 'set-even'; sampleId: string; value: boolean }
  | { type: 'update-dot'; sampleId: string; dotId: string; position?: number; velocity?: number }

const updateSample = (state: SequenceState, sampleId: string, fn: (s: Sample) => Sample): SequenceState => ({
  ...state,
  samples: state.samples.map((s) => (s.id === sampleId ? fn(s) : s)),
})

export function reducer(state: SequenceState, action: Action): SequenceState {
  switch (action.type) {
    case 'set-bpm':
      return { ...state, bpm: clamp(action.value, 20, 300) }
    case 'set-beats':
      return { ...state, beats: clamp(Math.round(action.value), 1, 64) }
    case 'set-playing':
      return { ...state, isPlaying: action.value }
    case 'set-sample-params':
      return updateSample(
        state,
        action.sampleId,
        (s) => ({ ...s, params: { ...s.params, ...action.params } }) as Sample,
      )
    case 'set-repetitions': {
      const value = clamp(Math.round(action.value), 0, 32)
      return updateSample(state, action.sampleId, (s) => {
        if (s.even) {
          return { ...s, repetitions: value, dots: evenDots(value, s.dots) }
        }
        const dots = [...s.dots]
        if (value > dots.length) {
          for (let i = dots.length; i < value; i++) {
            dots.push({ id: newDotId(), position: i / value, velocity: 0.8 })
          }
        } else if (value < dots.length) {
          dots.length = value
        }
        return { ...s, repetitions: value, dots }
      })
    }
    case 'set-snap':
      return updateSample(state, action.sampleId, (s) => ({ ...s, snap: action.value }))
    case 'set-even':
      return updateSample(state, action.sampleId, (s) =>
        action.value ? { ...s, even: true, dots: evenDots(s.repetitions, s.dots) } : { ...s, even: false },
      )
    case 'update-dot':
      return updateSample(state, action.sampleId, (s) => {
        if (s.even && action.position !== undefined) {
          const dragged = s.dots.find((d) => d.id === action.dotId)
          if (!dragged) return s
          const newPos = wrap01(action.position)
          let delta = newPos - dragged.position
          if (delta > 0.5) delta -= 1
          if (delta < -0.5) delta += 1
          return {
            ...s,
            dots: s.dots.map((d) => ({
              ...d,
              position: wrap01(d.position + delta),
              velocity:
                d.id === action.dotId && action.velocity !== undefined ? clamp(action.velocity, 0.05, 1) : d.velocity,
            })),
          }
        }
        return {
          ...s,
          dots: s.dots.map((d) =>
            d.id === action.dotId
              ? {
                  ...d,
                  position: action.position !== undefined ? wrap01(action.position) : d.position,
                  velocity: action.velocity !== undefined ? clamp(action.velocity, 0.05, 1) : d.velocity,
                }
              : d,
          ),
        }
      })
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const wrap01 = (v: number) => {
  const m = v % 1
  return m < 0 ? m + 1 : m
}

export type StoreContextValue = {
  state: SequenceState
  dispatch: React.Dispatch<Action>
}

export const StoreContext = createContext<StoreContextValue | null>(null)

export function useStore(): StoreContextValue {
  const v = useContext(StoreContext)
  if (!v) throw new Error('useStore must be used inside StoreContext.Provider')
  return v
}
