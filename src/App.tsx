import { useReducer } from 'react'
import { DrumMachine } from '@/components/DrumMachine'
import { loadFromLocalStorage } from '@/state/persistence'
import { initialState, mergeWithDefaults, reducer, StoreContext } from '@/state/store'

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const loaded = loadFromLocalStorage()
    return loaded ? mergeWithDefaults(loaded) : initialState
  })
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <DrumMachine />
    </StoreContext.Provider>
  )
}
