import { useReducer } from 'react'
import { DrumMachine } from '@/components/DrumMachine'
import { initialState, reducer, StoreContext } from '@/state/store'

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      <DrumMachine />
    </StoreContext.Provider>
  )
}
