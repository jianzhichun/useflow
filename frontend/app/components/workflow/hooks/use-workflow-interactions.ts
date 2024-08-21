import {
  useCallback,
  useState,
} from 'react'
import { useReactFlow } from 'reactflow'
import type { WorkflowDataUpdator } from '../types'
import { WORKFLOW_DATA_UPDATE } from '../constants'
import {
  initialEdges,
  initialNodes,
} from '../utils'
import { useEventEmitterContextContext } from '@/context/event-emitter'

export const useWorkflowUpdate = () => {
  const reactflow = useReactFlow()
  const { eventEmitter } = useEventEmitterContextContext()

  const handleUpdateWorkflowCanvas = useCallback((payload: WorkflowDataUpdator) => {
    const {
      nodes,
      edges,
      viewport,
    } = payload
    const { setViewport } = reactflow
    eventEmitter?.emit({
      type: WORKFLOW_DATA_UPDATE,
      payload: {
        nodes: initialNodes(nodes, edges),
        edges: initialEdges(edges, nodes),
      },
    } as any)
    setViewport(viewport)
  }, [eventEmitter, reactflow])


  return {
    handleUpdateWorkflowCanvas,
  }
}
