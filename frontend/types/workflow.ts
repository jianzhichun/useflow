import type { Viewport } from 'reactflow'
import type {
  BlockEnum,
  Edge,
  Node,
  ToolDefaultValue,
} from '@/app/components/workflow/types'

export type FetchWorkflowDraftResponse = {
  id: string
  graph: {
    nodes: Node[]
    edges: Edge[]
    viewport?: Viewport
  }
  created_at: number
  hash: string
  updated_at: number
}

export type OnNodeAdd = (
  newNodePayload: {
    nodeType: BlockEnum
    sourceHandle?: string
    targetHandle?: string
    toolDefaultValue?: ToolDefaultValue
  },
  oldNodesPayload: {
    prevNodeId?: string
    prevNodeSourceHandle?: string
    nextNodeId?: string
    nextNodeTargetHandle?: string
  }
) => void