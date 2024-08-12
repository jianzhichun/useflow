import { BlockEnum } from "./types"

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

export const NODES_INITIAL_DATA = {
  [BlockEnum.Start]: {
    type: BlockEnum.Start,
    title: '',
    desc: '',
  },
  [BlockEnum.End]: {
    type: BlockEnum.End,
    title: '',
    desc: '',
  },
}