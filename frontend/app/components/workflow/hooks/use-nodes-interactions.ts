import type { MouseEvent } from 'react'
import { useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import produce from 'immer'
import type {
  NodeDragHandler,
  NodeMouseHandler,
  OnConnect,
  OnConnectEnd,
  OnConnectStart,
  ResizeParamsWithDirection,
} from 'reactflow'
import {
  getConnectedEdges,
  getOutgoers,
  useReactFlow,
  useStoreApi,
} from 'reactflow'
import type {
  Edge,
  Node,
} from '../types'
import { BlockEnum } from '../types'
import { useWorkflowStore } from '../store'
import {
  ITERATION_CHILDREN_Z_INDEX,
  ITERATION_PADDING,
} from '../constants'
import { WorkflowHistoryEvent, useWorkflowHistory } from './use-workflow-history'

export const useNodesInteractions = () => {
  const { t } = useTranslation()
  const store = useStoreApi()
  const workflowStore = useWorkflowStore()
  const reactflow = useReactFlow()
  const dragNodeStartPosition = useRef({ x: 0, y: 0 } as { x: number; y: number })

  const { saveStateToHistory, undo, redo } = useWorkflowHistory()

  const handleNodeDragStart = useCallback<NodeDragHandler>((_, node) => {
  }, [])

  const handleNodeDrag = useCallback<NodeDragHandler>((e, node: Node) => {
  }, [])

  const handleNodeDragStop = useCallback<NodeDragHandler>((_, node) => {
  }, [])

  const handleNodeEnter = useCallback<NodeMouseHandler>((_, node) => {
  }, [])

  const handleNodeLeave = useCallback<NodeMouseHandler>((_, node) => {
  }, [])

  const handleNodeSelect = useCallback((nodeId: string, cancelSelection?: boolean) => {
  }, [])

  const handleNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    handleNodeSelect(node.id)
  }, [handleNodeSelect])

  const handleNodeConnect = useCallback<OnConnect>(({
    source,
    sourceHandle,
    target,
    targetHandle,
  }) => {

  }, [])

  const handleNodeConnectStart = useCallback<OnConnectStart>((_, { nodeId, handleType, handleId }) => {
  }, [])

  const handleNodeConnectEnd = useCallback<OnConnectEnd>((e: any) => {
  }, [])

  const handleNodeDelete = useCallback((nodeId: string) => {
  }, [])

  const handleNodeAdd = useCallback<any>(() => {
  }, [])

  const handleNodeChange = useCallback((
    currentNodeId: string,
    nodeType: BlockEnum,
    sourceHandle: string,
  ) => {
  }, [])

  const handleNodeCancelRunningStatus = useCallback(() => {
    const {
      getNodes,
      setNodes,
    } = store.getState()

    const nodes = getNodes()
    const newNodes = produce(nodes, (draft) => {
      draft.forEach((node) => {
        node.data._runningStatus = undefined
      })
    })
    setNodes(newNodes)
  }, [store])

  const handleNodesCancelSelected = useCallback(() => {
    const {
      getNodes,
      setNodes,
    } = store.getState()

    const nodes = getNodes()
    const newNodes = produce(nodes, (draft) => {
      draft.forEach((node) => {
        node.data.selected = false
      })
    })
    setNodes(newNodes)
  }, [store])

  const handleNodeContextMenu = useCallback((e: MouseEvent, node: Node) => {
    e.preventDefault()
    const container = document.querySelector('#workflow-container')
    const { x, y } = container!.getBoundingClientRect()
    workflowStore.setState({
      nodeMenu: {
        top: e.clientY - y,
        left: e.clientX - x,
        nodeId: node.id,
      },
    })
    handleNodeSelect(node.id)
  }, [])

  const handleNodesCopy = useCallback(() => {
  }, [])

  const handleNodesPaste = useCallback(() => {
  }, [])

  const handleNodesDuplicate = useCallback(() => {
    handleNodesCopy()
    handleNodesPaste()
  }, [handleNodesCopy, handleNodesPaste])

  const handleNodesDelete = useCallback(() => {
  }, [])

  const handleNodeResize = useCallback((nodeId: string, params: ResizeParamsWithDirection) => {
    const {
      getNodes,
      setNodes,
    } = store.getState()
    const { x, y, width, height } = params

    const nodes = getNodes()
    const currentNode = nodes.find(n => n.id === nodeId)!
    const childrenNodes = nodes.filter(n => currentNode.data._children?.includes(n.id))
    let rightNode: Node
    let bottomNode: Node

    childrenNodes.forEach((n) => {
      if (rightNode) {
        if (n.position.x + n.width! > rightNode.position.x + rightNode.width!)
          rightNode = n
      }
      else {
        rightNode = n
      }
      if (bottomNode) {
        if (n.position.y + n.height! > bottomNode.position.y + bottomNode.height!)
          bottomNode = n
      }
      else {
        bottomNode = n
      }
    })

    if (rightNode! && bottomNode!) {
      if (width < rightNode!.position.x + rightNode.width! + ITERATION_PADDING.right)
        return
      if (height < bottomNode.position.y + bottomNode.height! + ITERATION_PADDING.bottom)
        return
    }
    const newNodes = produce(nodes, (draft) => {
      draft.forEach((n) => {
        if (n.id === nodeId) {
          n.data.width = width
          n.data.height = height
          n.width = width
          n.height = height
          n.position.x = x
          n.position.y = y
        }
      })
    })
    setNodes(newNodes)
    saveStateToHistory(WorkflowHistoryEvent.NodeResize)
  }, [store, saveStateToHistory])

  const handleHistoryBack = useCallback(() => {
  }, [store, undo, workflowStore])

  const handleHistoryForward = useCallback(() => {
  }, [redo, store, workflowStore])

  return {
    handleNodeDragStart,
    handleNodeDrag,
    handleNodeDragStop,
    handleNodeEnter,
    handleNodeLeave,
    handleNodeSelect,
    handleNodeClick,
    handleNodeConnect,
    handleNodeConnectStart,
    handleNodeConnectEnd,
    handleNodeDelete,
    handleNodeChange,
    handleNodeAdd,
    handleNodeCancelRunningStatus,
    handleNodesCancelSelected,
    handleNodeContextMenu,
    handleNodesCopy,
    handleNodesPaste,
    handleNodesDuplicate,
    handleNodesDelete,
    handleNodeResize,
    handleHistoryBack,
    handleHistoryForward,
  }
}
