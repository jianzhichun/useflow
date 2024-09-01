import StartNodeDefault from './nodes/start/default'
import EndNodeDefault from './nodes/end/default'
import CameraInputDefault from './nodes/cameraInput/default'
import { BlockEnum } from "./types"

type NodesExtraData = {
  author: string
  about: string
  availablePrevNodes: BlockEnum[]
  availableNextNodes: BlockEnum[]
  getAvailablePrevNodes: (isChatMode: boolean) => BlockEnum[]
  getAvailableNextNodes: (isChatMode: boolean) => BlockEnum[]
  checkValid: any
}
export const NODES_EXTRA_DATA: Record<BlockEnum, NodesExtraData> = {
  [BlockEnum.Start]: {
    author: 'Official',
    about: '',
    availablePrevNodes: [],
    availableNextNodes: [],
    getAvailablePrevNodes: StartNodeDefault.getAvailablePrevNodes,
    getAvailableNextNodes: StartNodeDefault.getAvailableNextNodes,
    checkValid: StartNodeDefault.checkValid,
  },
  [BlockEnum.CameraInput]: {
    author: 'Official',
    about: '',
    availablePrevNodes: [],
    availableNextNodes: [],
    getAvailablePrevNodes: CameraInputDefault.getAvailablePrevNodes,
    getAvailableNextNodes: CameraInputDefault.getAvailableNextNodes,
    checkValid: CameraInputDefault.checkValid,
  },
  [BlockEnum.End]: {
    author: 'Official',
    about: '',
    availablePrevNodes: [],
    availableNextNodes: [],
    getAvailablePrevNodes: EndNodeDefault.getAvailablePrevNodes,
    getAvailableNextNodes: EndNodeDefault.getAvailableNextNodes,
    checkValid: EndNodeDefault.checkValid,
  },
}

export const CUSTOM_NODE = 'custom'

export const START_INITIAL_POSITION = { x: 80, y: 282 }
export const AUTO_LAYOUT_OFFSET = {
  x: -42,
  y: 243,
}

export const NODE_WIDTH = 240
export const X_OFFSET = 60
export const Y_OFFSET = 39
export const NODE_WIDTH_X_OFFSET = NODE_WIDTH + X_OFFSET
export const ITERATION_CHILDREN_Z_INDEX = 1002

export const ITERATION_PADDING = {
  top: 85,
  right: 16,
  bottom: 20,
  left: 16,
}

export const NODES_INITIAL_DATA: Record<BlockEnum, {
  type: BlockEnum
  title: string
  desc: string
}> = {
  [BlockEnum.Start]: {
    type: BlockEnum.Start,
    title: '',
    desc: '',
  },
  [BlockEnum.CameraInput]: {
    type: BlockEnum.CameraInput,
    title: '摄像头输入',
    desc: '获取摄像头的实时画面输入',
  },
  [BlockEnum.End]: {
    type: BlockEnum.End,
    title: '',
    desc: '',
  },
}

export const ALL_AVAILABLE_BLOCKS = Object.keys(NODES_EXTRA_DATA) as BlockEnum[]
export const ALL_AVALIBALE_BLOCKs_AFTER_CAMERA = Object.keys(NODES_EXTRA_DATA).filter(key => key !== BlockEnum.Start) as BlockEnum[]
export const WORKFLOW_DATA_UPDATE = 'WORKFLOW_DATA_UPDATE'
export const DSL_EXPORT_CHECK = 'DSL_EXPORT_CHECK'