import { useContext } from 'react'
import {
  useStore as useZustandStore,
} from 'zustand'
import { createStore } from 'zustand/vanilla'
// import { debounce } from 'lodash-es'
// import type { Viewport } from 'reactflow'
import type {
  // Edge,
  // Node,
  WorkflowRunningData,
} from './types'
import { WorkflowContext } from './context'

type PreviewRunningData = WorkflowRunningData & {
  resultTabActive?: boolean
  resultText?: string
}

type Shape = {
}

export const createWorkflowStore = () => {
  return createStore<Shape>(set => ({
    
  }))
}

export function useStore<T>(selector: (state: Shape) => T): T {
  const store = useContext(WorkflowContext)
  if (!store)
    throw new Error('Missing WorkflowContext.Provider in the tree')

  return useZustandStore(store, selector)
}

export const useWorkflowStore = () => {
  return useContext(WorkflowContext)!
}
