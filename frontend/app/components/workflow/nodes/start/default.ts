import type { NodeDefault } from '../../types'
import type { StartNodeType } from './types'
import { ALL_AVAILABLE_BLOCKS } from '@/app/components/workflow/constants'

const nodeDefault: NodeDefault<StartNodeType> = {
  defaultValue: {
    variables: [],
  },
  getAvailablePrevNodes() {
    return []
  },
  getAvailableNextNodes() {
    return ALL_AVAILABLE_BLOCKS
  },
  checkValid() {
    return {
      isValid: true,
    }
  },
}

export default nodeDefault
