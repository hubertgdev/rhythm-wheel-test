import { createContext, useContext } from 'react'
import { freqToNote } from '@/audio/MonoSynth'
import {
  type ClapParams,
  DEFAULT_CLAP_PARAMS,
  DEFAULT_CLOSED_HAT_PARAMS,
  DEFAULT_KICK_PARAMS,
  DEFAULT_OPEN_HAT_PARAMS,
  DEFAULT_SYNTH_A_PARAMS,
  DEFAULT_SYNTH_B_PARAMS,
  type HatParams,
  type KickParams,
  type Sample,
  type SequenceState,
  type SynthParams,
} from '@/audio/types'

let dotCounter = 0
const newDotId = () => `dot-${++dotCounter}-${Date.now().toString(36)}`

const swingFactor = (swing: number) => 0.5 + 0.25 * Math.max(0, Math.min(1, swing))

const evenDots = (count: number, swing: number, prev: Sample['dots'] = []): Sample['dots'] => {
  const out: Sample['dots'] = []
  const n = Math.max(1, count)
  const pair = 2 / n
  const f = swingFactor(swing)
  for (let i = 0; i < count; i++) {
    const base = Math.floor(i / 2) * pair
    const offset = (i % 2) * f * pair
    out.push({
      id: prev[i]?.id ?? newDotId(),
      position: (base + offset) % 1,
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
      dots: evenDots(4, 0),
      snap: true,
      even: true,
      swing: 0,
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
      swing: 0,
    },
    {
      id: 'hat-closed',
      name: 'Hi-hat (closed)',
      type: 'hat-closed',
      params: { ...DEFAULT_CLOSED_HAT_PARAMS },
      repetitions: 8,
      dots: evenDots(8, 0),
      snap: true,
      even: true,
      swing: 0,
    },
    {
      id: 'hat-open',
      name: 'Hi-hat (open)',
      type: 'hat-open',
      params: { ...DEFAULT_OPEN_HAT_PARAMS },
      repetitions: 0,
      dots: [],
      snap: true,
      even: false,
      swing: 0,
    },
    {
      id: 'synth-a',
      name: 'Synth A',
      type: 'synth-a',
      params: { ...DEFAULT_SYNTH_A_PARAMS },
      repetitions: 0,
      dots: [],
      snap: true,
      even: false,
      swing: 0,
    },
    {
      id: 'synth-b',
      name: 'Synth B',
      type: 'synth-b',
      params: { ...DEFAULT_SYNTH_B_PARAMS },
      repetitions: 0,
      dots: [],
      snap: true,
      even: false,
      swing: 0,
    },
  ],
}

const migrateSampleParams = (sample: Sample): Sample => {
  if (sample.type !== 'synth-a' && sample.type !== 'synth-b') return sample
  const p = sample.params as Partial<SynthParams> & { pitch?: number }
  if (typeof p.note === 'number' && typeof p.octave === 'number') return sample
  const { pitch, ...rest } = p
  const fallback = typeof pitch === 'number' ? freqToNote(pitch) : { note: 0, octave: 3 }
  return {
    ...sample,
    params: { ...rest, note: fallback.note, octave: fallback.octave } as SynthParams,
  } as Sample
}

export function mergeWithDefaults(loaded: SequenceState): SequenceState {
  const loadedById = new Map(loaded.samples.map((s) => [s.id, migrateSampleParams(s)]))
  const samples: Sample[] = []
  for (const def of initialState.samples) {
    samples.push(loadedById.get(def.id) ?? def)
  }
  const defaultIds = new Set(initialState.samples.map((s) => s.id))
  for (const s of loaded.samples) {
    if (!defaultIds.has(s.id)) samples.push(migrateSampleParams(s))
  }
  return { ...loaded, samples }
}

export type Action =
  | { type: 'set-bpm'; value: number }
  | { type: 'set-beats'; value: number }
  | { type: 'set-playing'; value: boolean }
  | {
      type: 'set-sample-params'
      sampleId: string
      params: Partial<KickParams> | Partial<ClapParams> | Partial<HatParams> | Partial<SynthParams>
    }
  | { type: 'set-repetitions'; sampleId: string; value: number }
  | { type: 'set-snap'; sampleId: string; value: boolean }
  | { type: 'set-even'; sampleId: string; value: boolean }
  | { type: 'set-swing'; sampleId: string; value: number }
  | { type: 'update-dot'; sampleId: string; dotId: string; position?: number; velocity?: number }
  | { type: 'load-state'; state: SequenceState }

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
          return { ...s, repetitions: value, dots: evenDots(value, s.swing, s.dots) }
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
        action.value ? { ...s, even: true, dots: evenDots(s.repetitions, s.swing, s.dots) } : { ...s, even: false },
      )
    case 'set-swing':
      return updateSample(state, action.sampleId, (s) => {
        const swing = clamp(action.value, 0, 1)
        if (s.even) {
          return { ...s, swing, dots: evenDots(s.repetitions, swing, s.dots) }
        }
        return { ...s, swing }
      })
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
    case 'load-state':
      return action.state
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
