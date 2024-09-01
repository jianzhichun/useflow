import { useCallback } from 'react'
import produce from 'immer'
import type {
  EdgeMouseHandler,
  OnEdgesChange,
} from 'reactflow'
import {
  useStoreApi,
} from 'reactflow'
import type {
  Node,
} from '../types'
import { getNodesConnectedSourceOrTargetHandleIdsMap } from '../utils'
import { WorkflowHistoryEvent, useWorkflowHistory } from './use-workflow-history'

export const useEdgesInteractions = () => {
  const store = useStoreApi()
  const { saveStateToHistory } = useWorkflowHistory()

  const handleEdgeEnter = useCallback<EdgeMouseHandler>((_, edge) => {
    const {
      edges,
      setEdges,
    } = store.getState()
    const newEdges = produce(edges, (draft) => {
      const currentEdge = draft.find(e => e.id === edge.id)!

      currentEdge.data._hovering = true
    })
    setEdges(newEdges)
  }, [store])

  const handleEdgeLeave = useCallback<EdgeMouseHandler>((_, edge) => {
    const {
      edges,
      setEdges,
    } = store.getState()
    const newEdges = produce(edges, (draft) => {
      const currentEdge = draft.find(e => e.id === edge.id)!

      currentEdge.data._hovering = false
    })
    setEdges(newEdges)
  }, [store])

  const handleEdgeDeleteByDeleteBranch = useCallback((nodeId: string, branchId: string) => {
    const {
      getNodes,
      setNodes,
      edges,
      setEdges,
    } = store.getState()
    const currentEdgeIndex = edges.findIndex(edge => edge.source === nodeId && edge.sourceHandle === branchId)

    if (currentEdgeIndex < 0)
      return

    const currentEdge = edges[currentEdgeIndex]
    const newNodes = produce(getNodes(), (draft: Node[]) => {
      const sourceNode = draft.find(node => node.id === currentEdge.source)
      const targetNode = draft.find(node => node.id === currentEdge.target)

      if (sourceNode)
        sourceNode.data._connectedSourceHandleIds = sourceNode.data._connectedSourceHandleIds?.filter(handleId => handleId !== currentEdge.sourceHandle)

      if (targetNode)
        targetNode.data._connectedTargetHandleIds = targetNode.data._connectedTargetHandleIds?.filter(handleId => handleId !== currentEdge.targetHandle)
    })
    setNodes(newNodes)
    const newEdges = produce(edges, (draft) => {
      draft.splice(currentEdgeIndex, 1)
    })
    setEdges(newEdges)
    saveStateToHistory(WorkflowHistoryEvent.EdgeDeleteByDeleteBranch)
  }, [store, saveStateToHistory])

  const handleEdgeDelete = useCallback(() => {

    const {
      getNodes,
      setNodes,
      edges,
      setEdges,
    } = store.getState()
    const currentEdgeIndex = edges.findIndex(edge => edge.selected)

    if (currentEdgeIndex < 0)
      return
    const currentEdge = edges[currentEdgeIndex]
    const nodes = getNodes()
    const nodesConnectedSourceOrTargetHandleIdsMap = getNodesConnectedSourceOrTargetHandleIdsMap(
      [
        { type: 'remove', edge: currentEdge },
      ],
      nodes,
    )
    const newNodes = produce(nodes, (draft: Node[]) => {
      draft.forEach((node) => {
        if (nodesConnectedSourceOrTargetHandleIdsMap[node.id]) {
          node.data = {
            ...node.data,
            ...nodesConnectedSourceOrTargetHandleIdsMap[node.id],
          }
        }
      })
    })
    setNodes(newNodes)
    const newEdges = produce(edges, (draft) => {
      draft.splice(currentEdgeIndex, 1)
    })
    setEdges(newEdges)
    saveStateToHistory(WorkflowHistoryEvent.EdgeDelete)
  }, [store, saveStateToHistory])

  const handleEdgesChange = useCallback<OnEdgesChange>((changes) => {
    const {
      edges,
      setEdges,
    } = store.getState()

    const newEdges = produce(edges, (draft) => {
      changes.forEach((change) => {
        if (change.type === 'select')
          draft.find(edge => edge.id === change.id)!.selected = change.selected
      })
    })
    setEdges(newEdges)
  }, [store])

  const handleEdgeCancelRunningStatus = useCallback(() => {
    const {
      edges,
      setEdges,
    } = store.getState()

    const newEdges = produce(edges, (draft) => {
      draft.forEach((edge) => {
        edge.data._runned = false
      })
    })
    setEdges(newEdges)
  }, [store])

  return {
    handleEdgeEnter,
    handleEdgeLeave,
    handleEdgeDeleteByDeleteBranch,
    handleEdgeDelete,
    handleEdgesChange,
    handleEdgeCancelRunningStatus,
  }
}
