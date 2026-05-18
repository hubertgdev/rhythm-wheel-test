import { Play, RotateCw } from 'lucide-react'
import type { AudioEngine } from '@/audio/AudioEngine'
import type { Sample } from '@/audio/types'
import { LabeledSlider } from '@/components/LabeledSlider'
import { Button } from '@/components/ui/button'
import { useStore } from '@/state/store'

type Props = {
  sample: Sample
  engine: AudioEngine | null
}

export function SampleControls({ sample, engine }: Props) {
  const { dispatch } = useStore()
  const p = sample.params

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3">
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
        <div className="flex items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => dispatch({ type: 'redistribute-dots', sampleId: sample.id })}
          >
            <RotateCw />
            Even
          </Button>
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

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <LabeledSlider
          label="Pitch"
          value={p.pitch}
          min={30}
          max={300}
          step={1}
          unit=" Hz"
          onChange={(v) => dispatch({ type: 'set-kick-params', sampleId: sample.id, params: { pitch: v } })}
        />
        <LabeledSlider
          label="Pitch Env"
          value={p.pitchEnv}
          min={0}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => dispatch({ type: 'set-kick-params', sampleId: sample.id, params: { pitchEnv: v } })}
        />
        <LabeledSlider
          label="Pitch Decay"
          value={p.pitchDecay}
          min={0.005}
          max={0.3}
          step={0.001}
          format={(v) => `${(v * 1000).toFixed(0)} ms`}
          onChange={(v) => dispatch({ type: 'set-kick-params', sampleId: sample.id, params: { pitchDecay: v } })}
        />
        <LabeledSlider
          label="Amp Decay"
          value={p.ampDecay}
          min={0.05}
          max={2}
          step={0.01}
          format={(v) => `${v.toFixed(2)} s`}
          onChange={(v) => dispatch({ type: 'set-kick-params', sampleId: sample.id, params: { ampDecay: v } })}
        />
        <LabeledSlider
          label="Click"
          value={p.click}
          min={0}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => dispatch({ type: 'set-kick-params', sampleId: sample.id, params: { click: v } })}
        />
        <LabeledSlider
          label="Drive"
          value={p.drive}
          min={0}
          max={1}
          step={0.01}
          format={(v) => v.toFixed(2)}
          onChange={(v) => dispatch({ type: 'set-kick-params', sampleId: sample.id, params: { drive: v } })}
        />
      </div>
    </section>
  )
}
