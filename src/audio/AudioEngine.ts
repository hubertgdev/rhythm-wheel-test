import { ClapSynth } from './ClapSynth'
import { HatSynth } from './HatSynth'
import { KickSynth } from './KickSynth'
import { MonoSynth } from './MonoSynth'
import { SnareSynth } from './SnareSynth'
import type { Sample, SequenceState } from './types'

type Synth = KickSynth | ClapSynth | SnareSynth | HatSynth | MonoSynth
type GetState = () => SequenceState

type SynthEntry = {
  synth: Synth
  volume: GainNode
  duck: GainNode
}

const SIDECHAIN_ATTACK = 0.005
const SIDECHAIN_RELEASE = 0.18

const createSynthFor = (ctx: AudioContext, sample: Sample): Synth => {
  switch (sample.type) {
    case 'kick':
      return new KickSynth(ctx, sample.params)
    case 'clap':
      return new ClapSynth(ctx, sample.params)
    case 'snare':
      return new SnareSynth(ctx, sample.params)
    case 'hat-closed':
    case 'hat-open':
      return new HatSynth(ctx, sample.params)
    case 'synth-a':
    case 'synth-b':
    case 'synth-c':
    case 'synth-d':
      return new MonoSynth(ctx, sample.params)
  }
}

const applyParams = (synth: Synth, sample: Sample) => {
  if (sample.type === 'kick' && synth instanceof KickSynth) {
    synth.setParams(sample.params)
  } else if (sample.type === 'clap' && synth instanceof ClapSynth) {
    synth.setParams(sample.params)
  } else if (sample.type === 'snare' && synth instanceof SnareSynth) {
    synth.setParams(sample.params)
  } else if ((sample.type === 'hat-closed' || sample.type === 'hat-open') && synth instanceof HatSynth) {
    synth.setParams(sample.params)
  } else if (
    (sample.type === 'synth-a' ||
      sample.type === 'synth-b' ||
      sample.type === 'synth-c' ||
      sample.type === 'synth-d') &&
    synth instanceof MonoSynth
  ) {
    synth.setParams(sample.params)
  }
}

const VOLUME_SMOOTHING_TAU = 0.02

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private entries: Map<string, SynthEntry> = new Map()
  private synthTypes: Map<string, Sample['type']> = new Map()
  private timer: number | null = null
  private getState: GetState

  isPlaying = false
  startTime = 0
  private scheduledUpTo = 0

  constructor(getState: GetState) {
    this.getState = getState
  }

  private ensureContext() {
    if (!this.ctx) {
      const Ctx =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.8
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
  }

  private disposeEntry(entry: SynthEntry) {
    entry.synth.dispose()
    try {
      entry.volume.disconnect()
    } catch {
      // ignore
    }
    try {
      entry.duck.disconnect()
    } catch {
      // ignore
    }
  }

  private effectiveVolume(sample: Sample, anySolo: boolean): number {
    if (sample.muted) return 0
    if (anySolo && !sample.soloed) return 0
    return sample.volume
  }

  private syncSynths() {
    if (!this.ctx || !this.master) return
    const state = this.getState()
    const now = this.ctx.currentTime
    const anySolo = state.samples.some((s) => s.soloed)
    const seen = new Set<string>()
    for (const sample of state.samples) {
      seen.add(sample.id)
      let entry = this.entries.get(sample.id)
      const currentType = this.synthTypes.get(sample.id)
      if (entry && currentType !== sample.type) {
        this.disposeEntry(entry)
        entry = undefined
        this.entries.delete(sample.id)
        this.synthTypes.delete(sample.id)
      }
      const target = this.effectiveVolume(sample, anySolo)
      if (!entry) {
        const synth = createSynthFor(this.ctx, sample)
        const volume = this.ctx.createGain()
        volume.gain.value = target
        const duck = this.ctx.createGain()
        duck.gain.value = 1
        synth.connect(volume)
        volume.connect(duck)
        duck.connect(this.master)
        entry = { synth, volume, duck }
        this.entries.set(sample.id, entry)
        this.synthTypes.set(sample.id, sample.type)
      } else {
        applyParams(entry.synth, sample)
        entry.volume.gain.setTargetAtTime(target, now, VOLUME_SMOOTHING_TAU)
      }
    }
    for (const [id, entry] of this.entries) {
      if (!seen.has(id)) {
        this.disposeEntry(entry)
        this.entries.delete(id)
        this.synthTypes.delete(id)
      }
    }
  }

  getContextTime(): number {
    return this.ctx?.currentTime ?? 0
  }

  play() {
    this.ensureContext()
    if (!this.ctx) return
    this.syncSynths()
    if (this.isPlaying) return
    this.isPlaying = true
    this.startTime = this.ctx.currentTime + 0.05
    this.scheduledUpTo = this.startTime
    this.timer = window.setInterval(() => this.tick(), 25)
  }

  pause() {
    if (!this.isPlaying) return
    this.isPlaying = false
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  stop() {
    this.pause()
    this.startTime = 0
    this.scheduledUpTo = 0
  }

  triggerPreview(sampleId: string, velocity = 0.9) {
    this.ensureContext()
    this.syncSynths()
    if (!this.ctx) return
    const state = this.getState()
    const sample = state.samples.find((s) => s.id === sampleId)
    if (!sample) return
    const anySolo = state.samples.some((s) => s.soloed)
    if (this.effectiveVolume(sample, anySolo) === 0) return
    const entry = this.entries.get(sampleId)
    if (entry) entry.synth.trigger(this.ctx.currentTime + 0.01, velocity)
  }

  private scheduleDuck(time: number) {
    const state = this.getState()
    for (const sample of state.samples) {
      if (sample.type === 'kick') continue
      if (sample.sidechain <= 0) continue
      const entry = this.entries.get(sample.id)
      if (!entry) continue
      const depth = Math.max(0.0001, 1 - sample.sidechain)
      const gain = entry.duck.gain
      gain.cancelScheduledValues(time)
      gain.setValueAtTime(1, time)
      gain.linearRampToValueAtTime(depth, time + SIDECHAIN_ATTACK)
      gain.exponentialRampToValueAtTime(1, time + SIDECHAIN_ATTACK + SIDECHAIN_RELEASE)
    }
  }

  private tick() {
    if (!this.ctx || !this.isPlaying) return
    this.syncSynths()
    const state = this.getState()
    const horizon = this.ctx.currentTime + 0.1
    const loopDuration = (60 / state.bpm) * state.beats
    if (loopDuration <= 0) return

    for (const sample of state.samples) {
      const entry = this.entries.get(sample.id)
      if (!entry) continue
      const isKick = sample.type === 'kick'
      for (const dot of sample.dots) {
        let t = this.startTime + dot.position * loopDuration
        if (t < this.scheduledUpTo) {
          const k = Math.ceil((this.scheduledUpTo - t) / loopDuration)
          t += k * loopDuration
        }
        while (t <= horizon) {
          entry.synth.trigger(t, 1)
          if (isKick) this.scheduleDuck(t)
          t += loopDuration
        }
      }
    }
    this.scheduledUpTo = horizon
  }

  dispose() {
    this.stop()
    for (const entry of this.entries.values()) this.disposeEntry(entry)
    this.entries.clear()
    if (this.master) {
      try {
        this.master.disconnect()
      } catch {
        // ignore
      }
    }
    if (this.ctx) {
      void this.ctx.close()
    }
    this.ctx = null
    this.master = null
  }
}
