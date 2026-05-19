export type KickParams = {
  pitch: number
  pitchEnv: number
  pitchDecay: number
  ampDecay: number
  click: number
  drive: number
}

export const DEFAULT_KICK_PARAMS: KickParams = {
  pitch: 55,
  pitchEnv: 0.45,
  pitchDecay: 0.06,
  ampDecay: 0.45,
  click: 0.25,
  drive: 0.15,
}

export type ClapParams = {
  tone: number
  body: number
  spread: number
  attack: number
  tail: number
  mix: number
}

export const DEFAULT_CLAP_PARAMS: ClapParams = {
  tone: 1200,
  body: 1.4,
  spread: 0.012,
  attack: 0.6,
  tail: 0.18,
  mix: 0.4,
}

export type SnareParams = {
  tone: number
  pitchEnv: number
  body: number
  noise: number
  tail: number
  color: number
}

export const DEFAULT_SNARE_PARAMS: SnareParams = {
  tone: 200,
  pitchEnv: 0.3,
  body: 0.12,
  noise: 0.65,
  tail: 0.18,
  color: 1500,
}

export type HatParams = {
  tone: number
  color: number
  body: number
  metal: number
  attack: number
  decay: number
}

export const DEFAULT_CLOSED_HAT_PARAMS: HatParams = {
  tone: 380,
  color: 7500,
  body: 1.1,
  metal: 0.3,
  attack: 0.8,
  decay: 0.06,
}

export const DEFAULT_OPEN_HAT_PARAMS: HatParams = {
  tone: 360,
  color: 6500,
  body: 1.0,
  metal: 0.4,
  attack: 0.7,
  decay: 0.42,
}

export type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle'

export type SynthParams = {
  wave: WaveType
  note: number
  octave: number
  attack: number
  release: number
  cutoff: number
  resonance: number
}

export const DEFAULT_SYNTH_A_PARAMS: SynthParams = {
  wave: 'square',
  note: 0,
  octave: 3,
  attack: 0.005,
  release: 0.35,
  cutoff: 1800,
  resonance: 1.2,
}

export const DEFAULT_SYNTH_B_PARAMS: SynthParams = {
  wave: 'sawtooth',
  note: 0,
  octave: 3,
  attack: 0.05,
  release: 0.9,
  cutoff: 2600,
  resonance: 1.6,
}

export type Dot = {
  id: string
  position: number
}

export type SampleType = 'kick' | 'clap' | 'snare' | 'hat-closed' | 'hat-open' | 'synth-a' | 'synth-b'

type SampleBase = {
  id: string
  name: string
  repetitions: number
  dots: Dot[]
  snap: boolean
  even: boolean
  swing: number
  volume: number
  sidechain: number
  collapsed: boolean
}

export type KickSample = SampleBase & { type: 'kick'; params: KickParams }
export type ClapSample = SampleBase & { type: 'clap'; params: ClapParams }
export type SnareSample = SampleBase & { type: 'snare'; params: SnareParams }
export type HatSample = SampleBase & { type: 'hat-closed' | 'hat-open'; params: HatParams }
export type SynthSample = SampleBase & { type: 'synth-a' | 'synth-b'; params: SynthParams }
export type Sample = KickSample | ClapSample | SnareSample | HatSample | SynthSample

export type SequenceState = {
  bpm: number
  beats: number
  samples: Sample[]
  isPlaying: boolean
}
