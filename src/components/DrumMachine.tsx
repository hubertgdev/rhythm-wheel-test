import { Download, Upload } from 'lucide-react'
import { type ChangeEvent, useEffect, useMemo, useRef } from 'react'
import { AudioEngine } from '@/audio/AudioEngine'
import { SampleControls } from '@/components/SampleControls'
import { SequenceSettings } from '@/components/SequenceSettings'
import { ThemeToggle } from '@/components/ThemeToggle'
import { TransportBar } from '@/components/TransportBar'
import { Button } from '@/components/ui/button'
import { Wheel } from '@/components/Wheel'
import { exportToFile, importFromFile, saveToLocalStorage } from '@/state/persistence'
import { mergeWithDefaults, useStore } from '@/state/store'

const AUTOSAVE_DEBOUNCE_MS = 500

export function DrumMachine() {
  const { state, dispatch } = useStore()
  const stateRef = useRef(state)
  stateRef.current = state
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const engine = useMemo(() => new AudioEngine(() => stateRef.current), [])

  useEffect(() => () => engine.dispose(), [engine])

  useEffect(() => {
    const handle = window.setTimeout(() => saveToLocalStorage(state), AUTOSAVE_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [state])

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

  const onExport = () => exportToFile(state)
  const onImportClick = () => fileInputRef.current?.click()
  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const loaded = await importFromFile(file)
    if (!loaded) {
      window.alert("Couldn't import: the file is invalid or from an incompatible version.")
      return
    }
    engine.stop()
    dispatch({ type: 'load-state', state: mergeWithDefaults(loaded) })
  }

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Rhythm Wheel</h1>
          <p className="text-xs text-muted-foreground">Circular drum machine</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Export to file" onClick={onExport}>
            <Download />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Import from file" onClick={onImportClick}>
            <Upload />
          </Button>
          <ThemeToggle />
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={onImportFile}
          />
        </div>
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
