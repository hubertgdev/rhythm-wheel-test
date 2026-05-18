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

export type Dot = {
  id: string
  position: number
  velocity: number
}

export type SampleType = 'kick'

export type Sample = {
  id: string
  name: string
  type: SampleType
  params: KickParams
  repetitions: number
  dots: Dot[]
  snap: boolean
}

export type SequenceState = {
  bpm: number
  beats: number
  samples: Sample[]
  isPlaying: boolean
}
