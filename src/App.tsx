import { useReducer } from 'react'
import { DrumMachine } from '@/components/DrumMachine'
import { loadFromLocalStorage } from '@/state/persistence'
import { initialState, reducer, StoreContext } from '@/state/store'

export function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadFromLocalStorage() ?? initialState)
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <DrumMachine />
    </StoreContext.Provider>
  )
}
