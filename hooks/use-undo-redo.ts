import { useState, useCallback, useRef } from 'react'

export interface UndoRedoState<T> {
  past: T[]
  present: T
  future: T[]
}

export interface UndoRedoActions<T> {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  setState: (newState: T) => void
  setStateGrouped: (newState: T) => void
  endGroup: () => void
  clear: () => void
  getCurrentState: () => T
}

export function useUndoRedo<T>(initialState: T, maxHistorySize: number = 50): UndoRedoActions<T> {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: []
  })

  const isUpdatingRef = useRef(false)
  const isGroupingRef = useRef(false)
  const groupStartStateRef = useRef<T | null>(null)

  const updateState = useCallback((newState: T) => {
    if (isUpdatingRef.current) {
      // If we're in the middle of an undo/redo operation, don't add to history
      setState(prev => ({ ...prev, present: newState }))
      return
    }

    setState(prev => {
      // Don't add to history if the state hasn't actually changed
      if (JSON.stringify(prev.present) === JSON.stringify(newState)) {
        return prev
      }

      const newPast = [...prev.past, prev.present]
      
      // Limit history size
      if (newPast.length > maxHistorySize) {
        newPast.shift()
      }

      return {
        past: newPast,
        present: newState,
        future: [] // Clear future when new action is performed
      }
    })
  }, [maxHistorySize])

  const updateStateGrouped = useCallback((newState: T) => {
    if (isUpdatingRef.current) {
      // If we're in the middle of an undo/redo operation, don't add to history
      setState(prev => ({ ...prev, present: newState }))
      return
    }

    // If we're starting a new group, store the starting state
    if (!isGroupingRef.current) {
      isGroupingRef.current = true
      groupStartStateRef.current = state.present
    }

    // Just update the present state without adding to history
    setState(prev => ({ ...prev, present: newState }))
  }, [state.present])

  const endGroup = useCallback(() => {
    if (isGroupingRef.current && groupStartStateRef.current) {
      // Add the group start state to history
      setState(prev => {
        const newPast = [...prev.past, groupStartStateRef.current!]
        
        // Limit history size
        if (newPast.length > maxHistorySize) {
          newPast.shift()
        }

        return {
          past: newPast,
          present: prev.present,
          future: [] // Clear future when new action is performed
        }
      })
    }
    
    // Reset grouping state
    isGroupingRef.current = false
    groupStartStateRef.current = null
  }, [maxHistorySize])

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.past.length === 0) return prev

      const previous = prev.past[prev.past.length - 1]
      const newPast = prev.past.slice(0, -1)
      const newFuture = [prev.present, ...prev.future]

      return {
        past: newPast,
        present: previous,
        future: newFuture
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.future.length === 0) return prev

      const next = prev.future[0]
      const newFuture = prev.future.slice(1)
      const newPast = [...prev.past, prev.present]

      return {
        past: newPast,
        present: next,
        future: newFuture
      }
    })
  }, [])

  const clear = useCallback(() => {
    setState(prev => ({
      past: [],
      present: prev.present,
      future: []
    }))
  }, [])

  return {
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    setState: updateState,
    setStateGrouped: updateStateGrouped,
    endGroup,
    clear,
    getCurrentState: () => state.present
  }
}
