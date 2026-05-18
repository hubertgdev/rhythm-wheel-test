import { Pause, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStore } from '@/state/store'

type Props = {
  onPlay: () => void
  onPause: () => void
  onStop: () => void
}

export function TransportBar({ onPlay, onPause, onStop }: Props) {
  const { state } = useStore()
  const playing = state.isPlaying
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-center gap-2 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        {playing ? (
          <Button size="lg" variant="default" onClick={onPause} className="min-w-[6rem]">
            <Pause />
            Pause
          </Button>
        ) : (
          <Button size="lg" variant="default" onClick={onPlay} className="min-w-[6rem]">
            <Play />
            Play
          </Button>
        )}
        <Button size="lg" variant="outline" onClick={onStop} className="min-w-[4.5rem]">
          <Square />
          Stop
        </Button>
      </div>
    </div>
  )
}
