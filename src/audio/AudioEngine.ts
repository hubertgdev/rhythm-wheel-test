import { KickSynth } from './KickSynth'
import type { SequenceState } from './types'

type GetState = () => SequenceState

export class AudioEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private synths: Map<string, KickSynth> = new Map()
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

  private syncSynths() {
    if (!this.ctx || !this.master) return
    const state = this.getState()
    const seen = new Set<string>()
    for (const sample of state.samples) {
      seen.add(sample.id)
      let synth = this.synths.get(sample.id)
      if (!synth) {
        synth = new KickSynth(this.ctx, sample.params)
        synth.connect(this.master)
        this.synths.set(sample.id, synth)
      } else {
        synth.setParams(sample.params)
      }
    }
    for (const [id, synth] of this.synths) {
      if (!seen.has(id)) {
        synth.dispose()
        this.synths.delete(id)
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
    const synth = this.synths.get(sampleId)
    if (synth) synth.trigger(this.ctx.currentTime + 0.01, velocity)
  }

  private tick() {
    if (!this.ctx || !this.isPlaying) return
    this.syncSynths()
    const state = this.getState()
    const horizon = this.ctx.currentTime + 0.1
    const loopDuration = (60 / state.bpm) * state.beats
    if (loopDuration <= 0) return

    for (const sample of state.samples) {
      const synth = this.synths.get(sample.id)
      if (!synth) continue
      for (const dot of sample.dots) {
        let t = this.startTime + dot.position * loopDuration
        if (t < this.scheduledUpTo) {
          const k = Math.ceil((this.scheduledUpTo - t) / loopDuration)
          t += k * loopDuration
        }
        while (t <= horizon) {
          synth.trigger(t, dot.velocity)
          t += loopDuration
        }
      }
    }
    this.scheduledUpTo = horizon
  }

  dispose() {
    this.stop()
    for (const synth of this.synths.values()) synth.dispose()
    this.synths.clear()
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
