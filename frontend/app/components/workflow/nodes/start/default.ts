import type { NodeDefault } from '../../types'
import type { StartNodeType } from './types'
// import { ALL_CHAT_AVAILABLE_BLOCKS, ALL_COMPLETION_AVAILABLE_BLOCKS } from '@/app/components/workflow/constants'

const nodeDefault: NodeDefault<StartNodeType> = {
  defaultValue: {
    variables: [],
  },
  getAvailablePrevNodes() {
    return []
  },
  getAvailableNextNodes() {
    // const nodes = isChatMode ? ALL_CHAT_AVAILABLE_BLOCKS : ALL_COMPLETION_AVAILABLE_BLOCKS
    // return nodes
    return []
  },
  checkValid() {
    return {
      isValid: true,
    }
  },
}

export default nodeDefault
