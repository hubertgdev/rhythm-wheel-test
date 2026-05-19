import type { Sample, SequenceState } from '@/audio/types'

const STORAGE_KEY = 'rw-state-v1'
const SCHEMA_VERSION = 1
const VALID_TYPES: Sample['type'][] = ['kick', 'clap', 'snare', 'hat-closed', 'hat-open', 'synth-a', 'synth-b']

type Persisted = {
  version: number
  state: Omit<SequenceState, 'isPlaying'>
}

const stripTransient = (state: SequenceState): Persisted['state'] => {
  const { isPlaying: _isPlaying, ...rest } = state
  return rest
}

const validateState = (s: unknown): SequenceState | null => {
  if (typeof s !== 'object' || s === null) return null
  const obj = s as Record<string, unknown>
  if (typeof obj.bpm !== 'number' || typeof obj.beats !== 'number') return null
  if (!Array.isArray(obj.samples)) return null
  for (const sample of obj.samples) {
    if (!sample || typeof sample !== 'object') return null
    const sObj = sample as Record<string, unknown>
    if (typeof sObj.id !== 'string') return null
    if (!VALID_TYPES.includes(sObj.type as Sample['type'])) return null
    if (!Array.isArray(sObj.dots)) return null
    if (typeof sObj.params !== 'object' || sObj.params === null) return null
  }
  return { ...(obj as Omit<SequenceState, 'isPlaying'>), isPlaying: false }
}

export function loadFromLocalStorage(): SequenceState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Persisted
    if (parsed?.version !== SCHEMA_VERSION) return null
    return validateState(parsed.state)
  } catch {
    return null
  }
}

export function saveToLocalStorage(state: SequenceState) {
  try {
    const payload: Persisted = { version: SCHEMA_VERSION, state: stripTransient(state) }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // quota or unavailable — silently ignore
  }
}

export function exportToFile(state: SequenceState) {
  const payload: Persisted = { version: SCHEMA_VERSION, state: stripTransient(state) }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  a.download = `rhythm-wheel-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importFromFile(file: File): Promise<SequenceState | null> {
  try {
    const text = await file.text()
    const parsed = JSON.parse(text) as Persisted
    if (parsed?.version !== SCHEMA_VERSION) return null
    return validateState(parsed.state)
  } catch {
    return null
  }
}
