import { useCallback, useEffect, useMemo, useState } from "react"
import { useContext } from 'use-context-selector'
import dayjs from 'dayjs'
import { useWorkflowStore } from "../store"
import { FetchWorkflowDraftResponse } from "@/types/workflow"
import { workflowInitData } from '@/mockData/workflow'
import I18n from '@/context/i18n';
import {
  getIncomers,
  getOutgoers,
  useReactFlow,
  useStoreApi,
} from 'reactflow'
import { useNodesExtraData } from './use-nodes-data'
import { useWorkflowHistory, WorkflowHistoryEvent } from "./use-workflow-history"
import {
  getLayoutByDagre,
} from '../utils'
import {
  BlockEnum,
  type Edge,
  type Node,
  type ValueSelector,
} from '../types'
import { CUSTOM_NODE, SUPPORT_OUTPUT_VARS_NODE } from "../constants"
import produce from "immer"
import { uniqBy } from 'lodash-es'

export const useWorkflowInit = () => {
  const workflowStore = useWorkflowStore()
  const [data, setData] = useState<FetchWorkflowDraftResponse>()
  const [isLoading, setIsLoading] = useState(true)

  const handleGetInitialWorkflowData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await Promise.resolve<FetchWorkflowDraftResponse>(workflowInitData)
      setData(data)
    } finally {
      setIsLoading(false)
    }
  }, [workflowStore])

  useEffect(() => {
    handleGetInitialWorkflowData()
  }, [])

  return {
    data,
    isLoading,
  }
}

export const useWorkflow = () => {
  const { locale } = useContext(I18n)
  const store = useStoreApi()
  const reactflow = useReactFlow()
  const workflowStore = useWorkflowStore()
  const nodesExtraData = useNodesExtraData()
  // const { handleSyncWorkflowDraft } = useNodesSyncDraft()
  const { saveStateToHistory } = useWorkflowHistory()

  const setPanelWidth = useCallback((width: number) => {
    localStorage.setItem('workflow-node-panel-width', `${width}`)
    workflowStore.setState({ panelWidth: width })
  }, [workflowStore])

  const handleLayout = useCallback(async () => {
    workflowStore.setState({ nodeAnimation: true })
    const {
      getNodes,
      edges,
      setNodes,
    } = store.getState()
    const { setViewport } = reactflow
    const nodes = getNodes()
    const layout = getLayoutByDagre(nodes, edges)
    const rankMap = {} as Record<string, Node>

    nodes.forEach((node) => {
      if (!node.parentId && node.type === CUSTOM_NODE) {
        const rank = layout.node(node.id).rank!

        if (!rankMap[rank]) {
          rankMap[rank] = node
        }
        else {
          if (rankMap[rank].position.y > node.position.y)
            rankMap[rank] = node
        }
      }
    })

    const newNodes = produce(nodes, (draft) => {
      draft.forEach((node) => {
        if (!node.parentId && node.type === CUSTOM_NODE) {
          const nodeWithPosition = layout.node(node.id)

          node.position = {
            x: nodeWithPosition.x - node.width! / 2,
            y: nodeWithPosition.y - node.height! / 2 + rankMap[nodeWithPosition.rank!].height! / 2,
          }
        }
      })
    })
    setNodes(newNodes)
    const zoom = 0.7
    setViewport({
      x: 0,
      y: 0,
      zoom,
    })
    saveStateToHistory(WorkflowHistoryEvent.LayoutOrganize)
    // setTimeout(() => {
    //   handleSyncWorkflowDraft()
    // })
  }, [workflowStore, store, reactflow, saveStateToHistory])

  const getTreeLeafNodes = useCallback((nodeId: string) => {
    const {
      getNodes,
      edges,
    } = store.getState()
    const nodes = getNodes()
    let startNode = nodes.find(node => node.data.type === BlockEnum.Start)
    const currentNode = nodes.find(node => node.id === nodeId)

    if (currentNode?.parentId)
      startNode = nodes.find(node => node.parentId === currentNode.parentId && node.data.isIterationStart)

    if (!startNode)
      return []

    const list: Node[] = []
    const preOrder = (root: Node, callback: (node: Node) => void) => {
      if (root.id === nodeId)
        return
      const outgoers = getOutgoers(root, nodes, edges)

      if (outgoers.length) {
        outgoers.forEach((outgoer) => {
          preOrder(outgoer, callback)
        })
      }
      else {
        if (root.id !== nodeId)
          callback(root)
      }
    }
    preOrder(startNode, (node) => {
      list.push(node)
    })

    const incomers = getIncomers({ id: nodeId } as Node, nodes, edges)

    list.push(...incomers)

    return uniqBy(list, 'id').filter((item) => {
      return SUPPORT_OUTPUT_VARS_NODE.includes(item.data.type)
    })
  }, [store])

  const getBeforeNodesInSameBranch = useCallback((nodeId: string, newNodes?: Node[], newEdges?: Edge[]) => {
    const {
      getNodes,
      edges,
    } = store.getState()
    const nodes = newNodes || getNodes()
    const currentNode = nodes.find(node => node.id === nodeId)

    const list: Node[] = []

    if (!currentNode)
      return list

    if (currentNode.parentId) {
      const parentNode = nodes.find(node => node.id === currentNode.parentId)
      if (parentNode) {
        const parentList = getBeforeNodesInSameBranch(parentNode.id)

        list.push(...parentList)
      }
    }

    const traverse = (root: Node, callback: (node: Node) => void) => {
      if (root) {
        const incomers = getIncomers(root, nodes, newEdges || edges)

        if (incomers.length) {
          incomers.forEach((node) => {
            if (!list.find(n => node.id === n.id)) {
              callback(node)
              traverse(node, callback)
            }
          })
        }
      }
    }
    traverse(currentNode, (node) => {
      list.push(node)
    })

    const length = list.length
    if (length) {
      return uniqBy(list, 'id').reverse().filter((item) => {
        return SUPPORT_OUTPUT_VARS_NODE.includes(item.data.type)
      })
    }

    return []
  }, [store])

  const getBeforeNodesInSameBranchIncludeParent = useCallback((nodeId: string, newNodes?: Node[], newEdges?: Edge[]) => {
    const nodes = getBeforeNodesInSameBranch(nodeId, newNodes, newEdges)
    const {
      getNodes,
    } = store.getState()
    const allNodes = getNodes()
    const node = allNodes.find(n => n.id === nodeId)
    const parentNodeId = node?.parentId
    const parentNode = allNodes.find(n => n.id === parentNodeId)
    if (parentNode)
      nodes.push(parentNode)

    return nodes
  }, [getBeforeNodesInSameBranch, store])

  const getAfterNodesInSameBranch = useCallback((nodeId: string) => {
    const {
      getNodes,
      edges,
    } = store.getState()
    const nodes = getNodes()
    const currentNode = nodes.find(node => node.id === nodeId)!

    if (!currentNode)
      return []
    const list: Node[] = [currentNode]

    const traverse = (root: Node, callback: (node: Node) => void) => {
      if (root) {
        const outgoers = getOutgoers(root, nodes, edges)

        if (outgoers.length) {
          outgoers.forEach((node) => {
            callback(node)
            traverse(node, callback)
          })
        }
      }
    }
    traverse(currentNode, (node) => {
      list.push(node)
    })

    return uniqBy(list, 'id')
  }, [store])

  const getBeforeNodeById = useCallback((nodeId: string) => {
    const {
      getNodes,
      edges,
    } = store.getState()
    const nodes = getNodes()
    const node = nodes.find(node => node.id === nodeId)!

    return getIncomers(node, nodes, edges)
  }, [store])

  const getIterationNodeChildren = useCallback((nodeId: string) => {
    const {
      getNodes,
    } = store.getState()
    const nodes = getNodes()

    return nodes.filter(node => node.parentId === nodeId)
  }, [store])

  // const handleOutVarRenameChange = useCallback((nodeId: string, oldValeSelector: ValueSelector, newVarSelector: ValueSelector) => {
  //   const { getNodes, setNodes } = store.getState()
  //   const afterNodes = getAfterNodesInSameBranch(nodeId)
  //   const effectNodes = findUsedVarNodes(oldValeSelector, afterNodes)
  //   if (effectNodes.length > 0) {
  //     const newNodes = getNodes().map((node) => {
  //       if (effectNodes.find(n => n.id === node.id))
  //         return updateNodeVars(node, oldValeSelector, newVarSelector)

  //       return node
  //     })
  //     setNodes(newNodes)
  //   }

  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [store])

  // const isVarUsedInNodes = useCallback((varSelector: ValueSelector) => {
  //   const nodeId = varSelector[0]
  //   const afterNodes = getAfterNodesInSameBranch(nodeId)
  //   const effectNodes = findUsedVarNodes(varSelector, afterNodes)
  //   return effectNodes.length > 0
  // }, [getAfterNodesInSameBranch])

  // const removeUsedVarInNodes = useCallback((varSelector: ValueSelector) => {
  //   const nodeId = varSelector[0]
  //   const { getNodes, setNodes } = store.getState()
  //   const afterNodes = getAfterNodesInSameBranch(nodeId)
  //   const effectNodes = findUsedVarNodes(varSelector, afterNodes)
  //   if (effectNodes.length > 0) {
  //     const newNodes = getNodes().map((node) => {
  //       if (effectNodes.find(n => n.id === node.id))
  //         return updateNodeVars(node, varSelector, [])

  //       return node
  //     })
  //     setNodes(newNodes)
  //   }
  // }, [getAfterNodesInSameBranch, store])

  // const isNodeVarsUsedInNodes = useCallback((node: Node, isChatMode: boolean) => {
  //   const outputVars = getNodeOutputVars(node, isChatMode)
  //   const isUsed = outputVars.some((varSelector) => {
  //     return isVarUsedInNodes(varSelector)
  //   })
  //   return isUsed
  // }, [isVarUsedInNodes])

  // const isValidConnection = useCallback(({ source, target }: Connection) => {
  //   const {
  //     edges,
  //     getNodes,
  //   } = store.getState()
  //   const nodes = getNodes()
  //   const sourceNode: Node = nodes.find(node => node.id === source)!
  //   const targetNode: Node = nodes.find(node => node.id === target)!

  //   if (targetNode.data.isIterationStart)
  //     return false

  //   if (sourceNode.type === CUSTOM_NOTE_NODE || targetNode.type === CUSTOM_NOTE_NODE)
  //     return false

  //   if (sourceNode && targetNode) {
  //     const sourceNodeAvailableNextNodes = nodesExtraData[sourceNode.data.type].availableNextNodes
  //     const targetNodeAvailablePrevNodes = [...nodesExtraData[targetNode.data.type].availablePrevNodes, BlockEnum.Start]

  //     if (!sourceNodeAvailableNextNodes.includes(targetNode.data.type))
  //       return false

  //     if (!targetNodeAvailablePrevNodes.includes(sourceNode.data.type))
  //       return false
  //   }

  //   const hasCycle = (node: Node, visited = new Set()) => {
  //     if (visited.has(node.id))
  //       return false

  //     visited.add(node.id)

  //     for (const outgoer of getOutgoers(node, nodes, edges)) {
  //       if (outgoer.id === source)
  //         return true
  //       if (hasCycle(outgoer, visited))
  //         return true
  //     }
  //   }

  //   return !hasCycle(targetNode)
  // }, [store, nodesExtraData])

  const formatTimeFromNow = useCallback((time: number) => {
    // @ts-ignore
    return dayjs(time).locale(locale === 'zh-Hans' ? 'zh-cn' : locale).fromNow()
  }, [locale])

  const getNode = useCallback((nodeId?: string) => {
    const { getNodes } = store.getState()
    const nodes = getNodes()

    return nodes.find(node => node.id === nodeId) || nodes.find(node => node.data.type === BlockEnum.Start)
  }, [store])

  // const enableShortcuts = useCallback(() => {
  //   const { setShortcutsDisabled } = workflowStore.getState()
  //   setShortcutsDisabled(false)
  // }, [workflowStore])

  // const disableShortcuts = useCallback(() => {
  //   const { setShortcutsDisabled } = workflowStore.getState()
  //   setShortcutsDisabled(true)
  // }, [workflowStore])

  return {
    setPanelWidth,
    handleLayout,
    getTreeLeafNodes,
    getBeforeNodesInSameBranch,
    getBeforeNodesInSameBranchIncludeParent,
    getAfterNodesInSameBranch,
    // handleOutVarRenameChange,
    // isVarUsedInNodes,
    // removeUsedVarInNodes,
    // isNodeVarsUsedInNodes,
    // isValidConnection,
    formatTimeFromNow,
    getNode,
    getBeforeNodeById,
    getIterationNodeChildren,
    // enableShortcuts,
    // disableShortcuts,
  }
}