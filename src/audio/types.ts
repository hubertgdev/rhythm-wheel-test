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

export type Dot = {
  id: string
  position: number
  velocity: number
}

export type SampleType = 'kick' | 'clap'

type SampleBase = {
  id: string
  name: string
  repetitions: number
  dots: Dot[]
  snap: boolean
  even: boolean
  swing: number
}

export type KickSample = SampleBase & { type: 'kick'; params: KickParams }
export type ClapSample = SampleBase & { type: 'clap'; params: ClapParams }
export type Sample = KickSample | ClapSample

export type SequenceState = {
  bpm: number
  beats: number
  samples: Sample[]
  isPlaying: boolean
}
