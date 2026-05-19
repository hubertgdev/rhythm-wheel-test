import type { ClapParams } from './types'

const BURST_COUNT = 3

function noiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const len = Math.max(32, Math.floor(ctx.sampleRate * durationSec))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

export class ClapSynth {
  private ctx: AudioContext
  output: GainNode
  params: ClapParams

  constructor(ctx: AudioContext, params: ClapParams) {
    this.ctx = ctx
    this.params = params
    this.output = ctx.createGain()
    this.output.gain.value = 1
  }

  connect(node: AudioNode) {
    this.output.connect(node)
  }

  setParams(params: ClapParams) {
    this.params = params
  }

  trigger(time: number, velocity: number) {
    const ctx = this.ctx
    const p = this.params
    const v = Math.max(0.05, Math.min(1, velocity))

    const burstDur = 0.008 + (1 - p.attack) * 0.025
    const tailDur = Math.max(0.03, p.tail)
    const spread = Math.max(0.001, p.spread)

    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = p.tone
    filter.Q.value = p.body
    filter.connect(this.output)

    const burstBus = ctx.createGain()
    burstBus.gain.value = v * (1.6 - p.mix * 0.9)
    burstBus.connect(filter)

    for (let i = 0; i < BURST_COUNT; i++) {
      const src = ctx.createBufferSource()
      src.buffer = noiseBuffer(ctx, burstDur + 0.005)
      const env = ctx.createGain()
      const t0 = time + i * spread
      env.gain.setValueAtTime(0, t0)
      env.gain.linearRampToValueAtTime(1, t0 + 0.0008)
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + burstDur)
      src.connect(env).connect(burstBus)
      src.start(t0)
      src.stop(t0 + burstDur + 0.01)
    }

    const tailStart = time + (BURST_COUNT - 1) * spread + 0.002
    const tailSrc = ctx.createBufferSource()
    tailSrc.buffer = noiseBuffer(ctx, tailDur + 0.02)
    const tailEnv = ctx.createGain()
    tailEnv.gain.setValueAtTime(0, tailStart)
    tailEnv.gain.linearRampToValueAtTime(v * p.mix * 1.1, tailStart + 0.004)
    tailEnv.gain.exponentialRampToValueAtTime(0.0001, tailStart + tailDur)
    tailSrc.connect(tailEnv).connect(filter)
    tailSrc.start(tailStart)
    tailSrc.stop(tailStart + tailDur + 0.02)
  }

  dispose() {
    try {
      this.output.disconnect()
    } catch {
      // ignore
    }
  }
}
