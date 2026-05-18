import { LabeledSlider } from '@/components/LabeledSlider'
import { useStore } from '@/state/store'

export function SequenceSettings() {
  const { state, dispatch } = useStore()
  return (
    <section className="grid grid-cols-2 gap-3">
      <LabeledSlider
        label="BPM"
        value={state.bpm}
        min={20}
        max={300}
        onChange={(v) => dispatch({ type: 'set-bpm', value: v })}
      />
      <LabeledSlider
        label="Beats"
        value={state.beats}
        min={1}
        max={64}
        onChange={(v) => dispatch({ type: 'set-beats', value: v })}
      />
    </section>
  )
}
