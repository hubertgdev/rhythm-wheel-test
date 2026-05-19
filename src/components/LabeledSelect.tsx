import { cn } from '@/lib/utils'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  label: string
  value: T
  options: Option<T>[]
  onChange: (v: T) => void
  className?: string
  disabled?: boolean
}

export function LabeledSelect<T extends string>({ label, value, options, onChange, className, disabled }: Props<T>) {
  return (
    <label className={cn('flex flex-col gap-1 select-none', disabled && 'pointer-events-none opacity-40', className)}>
      <span className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground uppercase tracking-wide">{label}</span>
      </span>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as T)} className="rw-select">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
