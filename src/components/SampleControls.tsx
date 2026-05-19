import { Play } from 'lucide-react'
import type { AudioEngine } from '@/audio/AudioEngine'
import type { ClapSample, HatSample, KickSample, Sample } from '@/audio/types'
import { LabeledSlider } from '@/components/LabeledSlider'
import { Button } from '@/components/ui/button'
import { useStore } from '@/state/store'

type Props = {
  sample: Sample
  engine: AudioEngine | null
}

export function SampleControls({ sample, engine }: Props) {
  const { dispatch } = useStore()
  return (
    <section
      className={`rw-sample rw-sample-${sample.type} flex flex-col gap-3 rounded-xl border border-border bg-card p-3`}
    >
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rw-accent-dot" />
          <h2 className="text-sm font-medium">{sample.name}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={() => engine?.triggerPreview(sample.id)}>
          <Play />
          Audition
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
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

      {sample.type === 'kick' ? (
        <KickKnobs sample={sample} />
      ) : sample.type === 'clap' ? (
        <ClapKnobs sample={sample} />
      ) : (
        <HatKnobs sample={sample} />
      )}
    </section>
  )
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
