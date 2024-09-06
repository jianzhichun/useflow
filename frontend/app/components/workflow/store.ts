import { useContext } from 'react'
import {
  useStore as useZustandStore,
} from 'zustand'
import { createStore } from 'zustand/vanilla'
// import { debounce } from 'lodash-es'
// import type { Viewport } from 'reactflow'
import type {
  // Edge,
  Node,
  WorkflowRunningData,
} from './types'
import { WorkflowContext } from './context'

type PreviewRunningData = WorkflowRunningData & {
  resultTabActive?: boolean
  resultText?: string
}

type Shape = {
  panelWidth: number;
  panelMenu?: {
    top: number
    left: number
  }
  setPanelMenu: (panelMenu: Shape['panelMenu']) => void;
  candidateNode?: Node;
  setCandidateNode: (candidateNode?: Node) => void;
  mousePosition: { pageX: number; pageY: number; elementX: number; elementY: number }
  setMousePosition: (mousePosition: Shape['mousePosition']) => void;
  nodeAnimation: boolean
  setNodeAnimation: (nodeAnimation: boolean) => void;
  nodeMenu?: {
    top: number
    left: number
    nodeId: string
  }
  setNodeMenu: (nodeMenu: Shape['nodeMenu']) => void
}

export const createWorkflowStore = () => {
  return createStore<Shape>(set => ({
    panelWidth: localStorage.getItem('workflow-node-panel-width') ? parseFloat(localStorage.getItem('workflow-node-panel-width')!) : 420,
    panelMenu: undefined,
    setPanelMenu: panelMenu => set(() => ({ panelMenu })),
    candidateNode: undefined,
    setCandidateNode: candidateNode => set(() => ({ candidateNode })),
    mousePosition: { pageX: 0, pageY: 0, elementX: 0, elementY: 0 },
    setMousePosition: mousePosition => set(() => ({ mousePosition })),
    nodeAnimation: false,
    setNodeAnimation: nodeAnimation => set(() => ({ nodeAnimation })),
    nodeMenu: undefined,
    setNodeMenu: nodeMenu => set(() => ({ nodeMenu })),
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
