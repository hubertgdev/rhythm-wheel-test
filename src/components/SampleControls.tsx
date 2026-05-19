import { ChevronDown, ChevronRight, Play } from 'lucide-react'
import type { AudioEngine } from '@/audio/AudioEngine'
import { NOTE_NAMES } from '@/audio/MonoSynth'
import type { ClapSample, HatSample, KickSample, Sample, SnareSample, SynthSample, WaveType } from '@/audio/types'
import { LabeledSelect } from '@/components/LabeledSelect'
import { LabeledSlider } from '@/components/LabeledSlider'
import { Button } from '@/components/ui/button'
import { useStore } from '@/state/store'

const WAVE_OPTIONS: { value: WaveType; label: string }[] = [
  { value: 'sine', label: 'Sine' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'square', label: 'Square' },
  { value: 'sawtooth', label: 'Saw' },
]

type Props = {
  sample: Sample
  engine: AudioEngine | null
}

export function SampleControls({ sample, engine }: Props) {
  const { dispatch } = useStore()
  const collapsed = sample.collapsed
  return (
    <section
      className={`rw-sample rw-sample-${sample.type} flex flex-col gap-3 rounded-xl border border-border bg-card p-3`}
    >
      <header className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-expanded={!collapsed}
          onClick={() => dispatch({ type: 'set-collapsed', sampleId: sample.id, value: !collapsed })}
          className="flex flex-1 items-center gap-2 -m-1 p-1 text-left rounded-md hover:bg-muted/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
          <span className="rw-accent-dot" />
          <h2 className="text-sm font-medium">{sample.name}</h2>
          {collapsed && sample.dots.length > 0 && (
            <span className="ml-1 text-xs text-muted-foreground">· {sample.dots.length}</span>
          )}
        </button>
        <Button variant="outline" size="sm" onClick={() => engine?.triggerPreview(sample.id)}>
          <Play />
          Audition
        </Button>
      </header>

      {collapsed ? null : <SampleBody sample={sample} />}
    </section>
  )
}

function SampleBody({ sample }: { sample: Sample }) {
  const { dispatch } = useStore()
  return (
    <>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <LabeledSlider
          label="Volume"
          value={sample.volume}
          min={0}
          max={1}
          step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => dispatch({ type: 'set-volume', sampleId: sample.id, value: v })}
          className="col-span-2"
        />
        <LabeledSlider
          label="Repetitions"
          value={sample.repetitions}
          min={0}
          max={32}
          onChange={(v) => dispatch({ type: 'set-repetitions', sampleId: sample.id, value: v })}
        />
        <LabeledSlider
          label="Swing"
          value={sample.swing}
          min={0}
          max={1}
          step={0.01}
          disabled={!sample.even}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => dispatch({ type: 'set-swing', sampleId: sample.id, value: v })}
        />
        <div className="col-span-2 flex items-center gap-4">
          <label className="flex h-7 items-center gap-1.5 text-xs select-none">
            <input
              type="checkbox"
              checked={sample.even}
              onChange={(e) => dispatch({ type: 'set-even', sampleId: sample.id, value: e.target.checked })}
            />
            Even
          </label>
          <label className="flex h-7 items-center gap-1.5 text-xs select-none">
            <input
              type="checkbox"
              checked={sample.snap}
              onChange={(e) => dispatch({ type: 'set-snap', sampleId: sample.id, value: e.target.checked })}
            />
            Snap
          </label>
        </div>
      </div>

      <KnobsForSample sample={sample} />
    </>
  )
}

function KnobsForSample({ sample }: { sample: Sample }) {
  switch (sample.type) {
    case 'kick':
      return <KickKnobs sample={sample} />
    case 'clap':
      return <ClapKnobs sample={sample} />
    case 'snare':
      return <SnareKnobs sample={sample} />
    case 'hat-closed':
    case 'hat-open':
      return <HatKnobs sample={sample} />
    case 'synth-a':
    case 'synth-b':
      return <SynthKnobs sample={sample} />
  }
}

function KickKnobs({ sample }: { sample: KickSample }) {
  const { dispatch } = useStore()
  const p = sample.params
  const set = (params: Partial<typeof p>) => dispatch({ type: 'set-sample-params', sampleId: sample.id, params })
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      <LabeledSlider
        label="Pitch"
        value={p.pitch}
        min={30}
        max={300}
        step={1}
        unit=" Hz"
        onChange={(v) => set({ pitch: v })}
      />
      <LabeledSlider
        label="Pitch Env"
        value={p.pitchEnv}
        min={0}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set({ pitchEnv: v })}
      />
      <LabeledSlider
        label="Pitch Decay"
        value={p.pitchDecay}
        min={0.005}
        max={0.3}
        step={0.001}
        format={(v) => `${(v * 1000).toFixed(0)} ms`}
        onChange={(v) => set({ pitchDecay: v })}
      />
      <LabeledSlider
        label="Amp Decay"
        value={p.ampDecay}
        min={0.05}
        max={2}
        step={0.01}
        format={(v) => `${v.toFixed(2)} s`}
        onChange={(v) => set({ ampDecay: v })}
      />
      <LabeledSlider
        label="Click"
        value={p.click}
        min={0}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set({ click: v })}
      />
      <LabeledSlider
        label="Drive"
        value={p.drive}
        min={0}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set({ drive: v })}
      />
    </div>
  )
}

function ClapKnobs({ sample }: { sample: ClapSample }) {
  const { dispatch } = useStore()
  const p = sample.params
  const set = (params: Partial<typeof p>) => dispatch({ type: 'set-sample-params', sampleId: sample.id, params })
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      <LabeledSlider
        label="Tone"
        value={p.tone}
        min={300}
        max={4000}
        step={10}
        format={(v) => `${v.toFixed(0)} Hz`}
        onChange={(v) => set({ tone: v })}
      />
      <LabeledSlider
        label="Body"
        value={p.body}
        min={0.3}
        max={8}
        step={0.05}
        format={(v) => `Q ${v.toFixed(2)}`}
        onChange={(v) => set({ body: v })}
      />
      <LabeledSlider
        label="Spread"
        value={p.spread}
        min={0.002}
        max={0.04}
        step={0.001}
        format={(v) => `${(v * 1000).toFixed(0)} ms`}
        onChange={(v) => set({ spread: v })}
      />
      <LabeledSlider
        label="Attack"
        value={p.attack}
        min={0}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set({ attack: v })}
      />
      <LabeledSlider
        label="Tail"
        value={p.tail}
        min={0.03}
        max={0.6}
        step={0.005}
        format={(v) => `${(v * 1000).toFixed(0)} ms`}
        onChange={(v) => set({ tail: v })}
      />
      <LabeledSlider
        label="Mix"
        value={p.mix}
        min={0}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set({ mix: v })}
      />
    </div>
  )
}

function SnareKnobs({ sample }: { sample: SnareSample }) {
  const { dispatch } = useStore()
  const p = sample.params
  const set = (params: Partial<typeof p>) => dispatch({ type: 'set-sample-params', sampleId: sample.id, params })
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      <LabeledSlider
        label="Tone"
        value={p.tone}
        min={80}
        max={400}
        step={1}
        format={(v) => `${v.toFixed(0)} Hz`}
        onChange={(v) => set({ tone: v })}
      />
      <LabeledSlider
        label="Pitch Env"
        value={p.pitchEnv}
        min={0}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set({ pitchEnv: v })}
      />
      <LabeledSlider
        label="Body"
        value={p.body}
        min={0.02}
        max={0.4}
        step={0.005}
        format={(v) => `${(v * 1000).toFixed(0)} ms`}
        onChange={(v) => set({ body: v })}
      />
      <LabeledSlider
        label="Noise"
        value={p.noise}
        min={0}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set({ noise: v })}
      />
      <LabeledSlider
        label="Tail"
        value={p.tail}
        min={0.03}
        max={0.6}
        step={0.005}
        format={(v) => `${(v * 1000).toFixed(0)} ms`}
        onChange={(v) => set({ tail: v })}
      />
      <LabeledSlider
        label="Color"
        value={p.color}
        min={500}
        max={6000}
        step={20}
        format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v.toFixed(0)} Hz`)}
        onChange={(v) => set({ color: v })}
      />
    </div>
  )
}

function HatKnobs({ sample }: { sample: HatSample }) {
  const { dispatch } = useStore()
  const p = sample.params
  const set = (params: Partial<typeof p>) => dispatch({ type: 'set-sample-params', sampleId: sample.id, params })
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      <LabeledSlider
        label="Tone"
        value={p.tone}
        min={100}
        max={800}
        step={1}
        format={(v) => `${v.toFixed(0)} Hz`}
        onChange={(v) => set({ tone: v })}
      />
      <LabeledSlider
        label="Color"
        value={p.color}
        min={2000}
        max={12000}
        step={50}
        format={(v) => `${(v / 1000).toFixed(1)} kHz`}
        onChange={(v) => set({ color: v })}
      />
      <LabeledSlider
        label="Body"
        value={p.body}
        min={0.3}
        max={6}
        step={0.05}
        format={(v) => `Q ${v.toFixed(2)}`}
        onChange={(v) => set({ body: v })}
      />
      <LabeledSlider
        label="Metal"
        value={p.metal}
        min={0}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set({ metal: v })}
      />
      <LabeledSlider
        label="Attack"
        value={p.attack}
        min={0}
        max={1}
        step={0.01}
        format={(v) => v.toFixed(2)}
        onChange={(v) => set({ attack: v })}
      />
      <LabeledSlider
        label="Decay"
        value={p.decay}
        min={0.02}
        max={1.2}
        step={0.005}
        format={(v) => `${(v * 1000).toFixed(0)} ms`}
        onChange={(v) => set({ decay: v })}
      />
    </div>
  )
}

function SynthKnobs({ sample }: { sample: SynthSample }) {
  const { dispatch } = useStore()
  const p = sample.params
  const set = (params: Partial<typeof p>) => dispatch({ type: 'set-sample-params', sampleId: sample.id, params })
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2">
      <LabeledSelect
        label="Wave"
        value={p.wave}
        options={WAVE_OPTIONS}
        onChange={(v) => set({ wave: v })}
        className="col-span-2"
      />
      <LabeledSlider
        label="Note"
        value={p.note}
        min={0}
        max={11}
        step={1}
        format={(v) => NOTE_NAMES[v] ?? '?'}
        onChange={(v) => set({ note: v })}
      />
      <LabeledSlider
        label="Octave"
        value={p.octave}
        min={0}
        max={6}
        step={1}
        format={(v) => `${v}`}
        onChange={(v) => set({ octave: v })}
      />
      <LabeledSlider
        label="Attack"
        value={p.attack}
        min={0.001}
        max={1}
        step={0.001}
        format={(v) => `${(v * 1000).toFixed(0)} ms`}
        onChange={(v) => set({ attack: v })}
      />
      <LabeledSlider
        label="Release"
        value={p.release}
        min={0.02}
        max={3}
        step={0.01}
        format={(v) => `${v.toFixed(2)} s`}
        onChange={(v) => set({ release: v })}
      />
      <LabeledSlider
        label="Cutoff"
        value={p.cutoff}
        min={80}
        max={10000}
        step={20}
        format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v.toFixed(0)} Hz`)}
        onChange={(v) => set({ cutoff: v })}
      />
      <LabeledSlider
        label="Resonance"
        value={p.resonance}
        min={0.1}
        max={12}
        step={0.05}
        format={(v) => `Q ${v.toFixed(2)}`}
        onChange={(v) => set({ resonance: v })}
      />
    </div>
  )
}
