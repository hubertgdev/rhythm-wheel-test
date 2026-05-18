import { createContext, useContext } from 'react'
import { DEFAULT_KICK_PARAMS, type KickParams, type Sample, type SequenceState } from '@/audio/types'

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
    },
  ],
}

export type Action =
  | { type: 'set-bpm'; value: number }
  | { type: 'set-beats'; value: number }
  | { type: 'set-playing'; value: boolean }
  | { type: 'set-kick-params'; sampleId: string; params: Partial<KickParams> }
  | { type: 'set-repetitions'; sampleId: string; value: number }
  | { type: 'set-snap'; sampleId: string; value: boolean }
  | { type: 'redistribute-dots'; sampleId: string }
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
    case 'set-kick-params':
      return updateSample(state, action.sampleId, (s) => ({
        ...s,
        params: { ...s.params, ...action.params },
      }))
    case 'set-repetitions': {
      const value = clamp(Math.round(action.value), 0, 32)
      return updateSample(state, action.sampleId, (s) => {
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
    case 'redistribute-dots':
      return updateSample(state, action.sampleId, (s) => ({
        ...s,
        dots: evenDots(s.repetitions, s.dots),
      }))
    case 'update-dot':
      return updateSample(state, action.sampleId, (s) => ({
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
      }))
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
