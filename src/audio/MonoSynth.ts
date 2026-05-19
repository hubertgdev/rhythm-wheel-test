import type { SynthParams } from './types'

export class MonoSynth {
  private ctx: AudioContext
  output: GainNode
  params: SynthParams

  constructor(ctx: AudioContext, params: SynthParams) {
    this.ctx = ctx
    this.params = params
    this.output = ctx.createGain()
    this.output.gain.value = 0.55
  }

  connect(node: AudioNode) {
    this.output.connect(node)
  }

  setParams(params: SynthParams) {
    this.params = params
  }

  trigger(time: number, velocity: number) {
    const ctx = this.ctx
    const p = this.params
    const v = Math.max(0.05, Math.min(1, velocity))

    const attack = Math.max(0.001, p.attack)
    const release = Math.max(0.02, p.release)

    const osc = ctx.createOscillator()
    osc.type = p.wave
    osc.frequency.value = Math.max(20, p.pitch)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = Math.max(20, p.cutoff)
    filter.Q.value = p.resonance

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(v, time + attack)
    env.gain.exponentialRampToValueAtTime(0.0001, time + attack + release)

    osc.connect(filter).connect(env).connect(this.output)

    osc.start(time)
    osc.stop(time + attack + release + 0.05)
  }

  dispose() {
    try {
      this.output.disconnect()
    } catch {
      // ignore
    }
  }
}
