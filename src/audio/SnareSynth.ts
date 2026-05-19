import type { SnareParams } from './types'

function noiseBuffer(ctx: AudioContext, durationSec: number): AudioBuffer {
  const len = Math.max(64, Math.floor(ctx.sampleRate * durationSec))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
  return buf
}

export class SnareSynth {
  private ctx: AudioContext
  output: GainNode
  params: SnareParams

  constructor(ctx: AudioContext, params: SnareParams) {
    this.ctx = ctx
    this.params = params
    this.output = ctx.createGain()
    this.output.gain.value = 0.7
  }

  connect(node: AudioNode) {
    this.output.connect(node)
  }

  setParams(params: SnareParams) {
    this.params = params
  }

  trigger(time: number, velocity: number) {
    const ctx = this.ctx
    const p = this.params
    const v = Math.max(0.05, Math.min(1, velocity))
    const body = Math.max(0.02, p.body)
    const tail = Math.max(0.03, p.tail)
    const baseFreq = Math.max(40, p.tone)
    const peakFreq = baseFreq * (1 + p.pitchEnv * 2)

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(peakFreq, time)
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.025)

    const bodyEnv = ctx.createGain()
    bodyEnv.gain.setValueAtTime(0, time)
    bodyEnv.gain.linearRampToValueAtTime(v * 0.55, time + 0.002)
    bodyEnv.gain.exponentialRampToValueAtTime(0.0001, time + body)
    osc.connect(bodyEnv).connect(this.output)
    osc.start(time)
    osc.stop(time + body + 0.05)

    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer(ctx, tail + 0.05)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = Math.max(100, p.color)
    hp.Q.value = 0.7
    const noiseEnv = ctx.createGain()
    noiseEnv.gain.setValueAtTime(0, time)
    noiseEnv.gain.linearRampToValueAtTime(v * p.noise * 0.9, time + 0.002)
    noiseEnv.gain.exponentialRampToValueAtTime(0.0001, time + tail)
    noise.connect(hp).connect(noiseEnv).connect(this.output)
    noise.start(time)
    noise.stop(time + tail + 0.05)
  }

  dispose() {
    try {
      this.output.disconnect()
    } catch {
      // ignore
    }
  }
}
