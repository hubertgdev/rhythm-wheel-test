import type { HatParams } from './types'

const RATIOS = [1, 1.342, 1.683, 1.967, 2.443, 2.957]

function noiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const len = Math.max(64, Math.floor(ctx.sampleRate * durationSec))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

export class HatSynth {
  private ctx: AudioContext
  output: GainNode
  params: HatParams

  constructor(ctx: AudioContext, params: HatParams) {
    this.ctx = ctx
    this.params = params
    this.output = ctx.createGain()
    this.output.gain.value = 0.55
  }

  connect(node: AudioNode) {
    this.output.connect(node)
  }

  setParams(params: HatParams) {
    this.params = params
  }

  trigger(time: number, velocity: number) {
    const ctx = this.ctx
    const p = this.params
    const v = Math.max(0.05, Math.min(1, velocity))
    const decay = Math.max(0.015, p.decay)
    const attackT = 0.0008 + (1 - p.attack) * 0.006

    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = p.color
    hp.Q.value = p.body

    const oscBus = ctx.createGain()
    oscBus.gain.value = (1 - p.metal) / RATIOS.length
    const oscs: OscillatorNode[] = []
    for (const r of RATIOS) {
      const osc = ctx.createOscillator()
      osc.type = 'square'
      osc.frequency.value = p.tone * r
      osc.connect(oscBus)
      oscs.push(osc)
    }
    oscBus.connect(hp)

    const noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = noiseBuffer(ctx, decay + 0.05)
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = p.metal * 0.8
    noiseSrc.connect(noiseGain).connect(hp)

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, time)
    env.gain.linearRampToValueAtTime(v, time + attackT)
    env.gain.exponentialRampToValueAtTime(0.0001, time + decay)
    hp.connect(env).connect(this.output)

    const stopAt = time + decay + 0.05
    for (const osc of oscs) {
      osc.start(time)
      osc.stop(stopAt)
    }
    noiseSrc.start(time)
    noiseSrc.stop(stopAt)
  }

  dispose() {
    try {
      this.output.disconnect()
    } catch {
      // ignore
    }
  }
}
