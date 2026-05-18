import { useEffect, useMemo, useRef } from 'react'
import { AudioEngine } from '@/audio/AudioEngine'
import { SampleControls } from '@/components/SampleControls'
import { SequenceSettings } from '@/components/SequenceSettings'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TransportBar } from '@/components/TransportBar'
import { Wheel } from '@/components/Wheel'
import { useStore } from '@/state/store'

export function DrumMachine() {
  const { state, dispatch } = useStore()
  const stateRef = useRef(state)
  stateRef.current = state

  const engine = useMemo(() => new AudioEngine(() => stateRef.current), [])

  useEffect(() => () => engine.dispose(), [engine])

  const onPlay = () => {
    engine.play()
    dispatch({ type: 'set-playing', value: true })
  }
  const onPause = () => {
    engine.pause()
    dispatch({ type: 'set-playing', value: false })
  }
  const onStop = () => {
    engine.stop()
    dispatch({ type: 'set-playing', value: false })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Rhythm Wheel</h1>
          <p className="text-xs text-muted-foreground">Circular drum machine</p>
        </div>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-32">
        <div className="rounded-2xl border border-border bg-card p-3">
          <Wheel engine={engine} isPlaying={state.isPlaying} />
        </div>
        <SequenceSettings />
        {state.samples.map((sample) => (
          <SampleControls key={sample.id} sample={sample} engine={engine} />
        ))}
        <p className="text-center text-xs text-muted-foreground">
          Drag a dot to move it. Pull toward the rim for more velocity.
        </p>
      </main>

      <TransportBar onPlay={onPlay} onPause={onPause} onStop={onStop} />
    </div>
  )
}
