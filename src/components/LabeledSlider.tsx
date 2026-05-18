import { cn } from '@/lib/utils'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  format?: (v: number) => string
  onChange: (v: number) => void
  className?: string
}

export function LabeledSlider({ label, value, min, max, step = 1, unit, format, onChange, className }: Props) {
  const display = format ? format(value) : `${value}${unit ?? ''}`
  return (
    <label className={cn('flex flex-col gap-1 select-none', className)}>
      <span className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="font-mono text-foreground tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rw-slider"
      />
    </label>
  )
}
