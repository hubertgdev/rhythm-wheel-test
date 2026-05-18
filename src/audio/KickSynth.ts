import type { KickParams } from './types'

export class KickSynth {
  private ctx: AudioContext
  output: GainNode
  params: KickParams

  constructor(ctx: AudioContext, params: KickParams) {
    this.ctx = ctx
    this.params = params
    this.output = ctx.createGain()
    this.output.gain.value = 0.9
  }

  connect(node: AudioNode) {
    this.output.connect(node)
  }

  setParams(params: KickParams) {
    this.params = params
  }

  trigger(time: number, velocity: number) {
    const ctx = this.ctx
    const params = this.params
    const v = Math.max(0.05, Math.min(1, velocity))

    const baseFreq = Math.max(20, params.pitch)
    const peakFreq = baseFreq * (1 + params.pitchEnv * 8)
    const pDecay = Math.max(0.003, params.pitchDecay)
    const aDecay = Math.max(0.02, params.ampDecay)

    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(peakFreq, time)
    osc.frequency.exponentialRampToValueAtTime(baseFreq, time + pDecay)

    const amp = ctx.createGain()
    amp.gain.setValueAtTime(0, time)
    amp.gain.linearRampToValueAtTime(v, time + 0.002)
    amp.gain.exponentialRampToValueAtTime(0.0001, time + aDecay)

    osc.connect(amp)

    let tail: AudioNode = amp
    if (params.drive > 0.001) {
      const shaper = ctx.createWaveShaper()
      const k = params.drive * 50
      const n = 1024
      const curve = new Float32Array(n)
      for (let i = 0; i < n; i++) {
        const x = (i / (n - 1)) * 2 - 1
        curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
      }
      shaper.curve = curve
      shaper.oversample = '4x'
      const post = ctx.createGain()
      post.gain.value = 1 / (1 + params.drive * 1.2)
      amp.connect(shaper).connect(post)
      tail = post
    }

    tail.connect(this.output)
    osc.start(time)
    osc.stop(time + aDecay + 0.05)

    if (params.click > 0.001) {
      const len = Math.max(64, Math.floor(ctx.sampleRate * 0.04))
      const buf = ctx.createBuffer(1, len, ctx.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
      const noise = ctx.createBufferSource()
      noise.buffer = buf
      const hp = ctx.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 1500
      const noiseGain = ctx.createGain()
      noiseGain.gain.setValueAtTime(0, time)
      noiseGain.gain.linearRampToValueAtTime(v * params.click * 0.7, time + 0.001)
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04)
      noise.connect(hp).connect(noiseGain).connect(this.output)
      noise.start(time)
      noise.stop(time + 0.06)
    }
  }

  dispose() {
    try {
      this.output.disconnect()
    } catch {
      // already disconnected
    }
  }
}
