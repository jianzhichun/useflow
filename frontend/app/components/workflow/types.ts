import type {
  Edge as ReactFlowEdge,
  Node as ReactFlowNode,
  Viewport,
} from 'reactflow'

export enum BlockEnum {
  Start = 'start',
  End = 'end',
  VideoInput = 'video-input',
}

export enum NodeRunningStatus {
  NotStart = 'not-start',
  Waiting = 'waiting',
  Running = 'running',
  Succeeded = 'succeeded',
  Failed = 'failed',
}

export type OnSelectBlock = (type: BlockEnum, toolDefaultValue?: ToolDefaultValue) => void

export type ToolDefaultValue = {
  provider_id: string
  provider_type: string
  provider_name: string
  tool_name: string
  tool_label: string
  title: string
}

export type Branch = {
  id: string
  name: string
}

export enum InputVarType {
  textInput = 'text-input',
  paragraph = 'paragraph',
  select = 'select',
  number = 'number',
  url = 'url',
  files = 'files',
  json = 'json', // obj, array
  contexts = 'contexts', // knowledge retrieval
  iterator = 'iterator', // iteration input
}

export type ValueSelector = string[] // [nodeId, key | obj key path]

export type InputVar = {
  type: InputVarType
  label: string | {
    nodeType: BlockEnum
    nodeName: string
    variable: string
  }
  variable: string
  max_length?: number
  default?: string
  required: boolean
  hint?: string
  options?: string[]
  value_selector?: ValueSelector
}

export type CommonNodeType<T = {}> = {
  _connectedSourceHandleIds?: string[]
  _connectedTargetHandleIds?: string[]
  _targetBranches?: Branch[]
  _isSingleRun?: boolean
  _runningStatus?: NodeRunningStatus
  _singleRunningStatus?: NodeRunningStatus
  _isCandidate?: boolean
  _isBundled?: boolean
  _children?: string[]
  _isEntering?: boolean
  _showAddVariablePopup?: boolean
  _holdAddVariablePopup?: boolean
  _iterationLength?: number
  _iterationIndex?: number
  isIterationStart?: boolean
  isInIteration?: boolean
  iteration_id?: string
  selected?: boolean
  title: string
  desc: string
  type: BlockEnum
  width?: number
  height?: number
} & T & Partial<Pick<ToolDefaultValue, 'provider_id' | 'provider_type' | 'provider_name' | 'tool_name'>>

export type CommonEdgeType = {
  _hovering?: boolean
  _connectedNodeIsHovering?: boolean
  _connectedNodeIsSelected?: boolean
  _runned?: boolean
  _isBundled?: boolean
  isInIteration?: boolean
  iteration_id?: string
  sourceType: BlockEnum
  targetType: BlockEnum
}

export type Block = {
  classification?: string
  type: BlockEnum
  title: string
  description?: string
}

export type NodeDefault<T> = {
  defaultValue: Partial<T>
  getAvailablePrevNodes: (isChatMode: boolean) => BlockEnum[]
  getAvailableNextNodes: (isChatMode: boolean) => BlockEnum[]
  checkValid: (payload: T, t: any, moreDataForCheckValid?: any) => { isValid: boolean; errorMessage?: string }
}

export type Node<T = {}> = ReactFlowNode<CommonNodeType<T>>

export type Edge = ReactFlowEdge<CommonEdgeType>

export type SelectedNode = Pick<Node, 'id' | 'data'>

export type NodeProps<T = unknown> = { id: string; data: CommonNodeType<T> }

export type WorkflowDataUpdator = {
  nodes: Node[]
  edges: Edge[]
  viewport: Viewport
}

export type WorkflowRunningData = {
  task_id?: string
  message_id?: string
  conversation_id?: string
  result: {
    sequence_number?: number
    workflow_id?: string
    inputs?: string
    process_data?: string
    outputs?: string
    status: string
    error?: string
    elapsed_time?: number
    total_tokens?: number
    created_at?: number
    created_by?: string
    finished_at?: number
    steps?: number
    showSteps?: boolean
    total_steps?: number
  }
}

export enum VarType {
  variable = 'variable',
  constant = 'constant',
  mixed = 'mixed',
}

export type Variable = {
  variable: string
  label?: string | {
    nodeType: BlockEnum
    nodeName: string
    variable: string
  }
  variable_type?: VarType
  value?: string
  options?: string[]
  required?: boolean
  isParagraph?: boolean
}