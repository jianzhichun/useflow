import type { NodeDefault } from '../../types'
import { type EndNodeType } from './types'

const nodeDefault: NodeDefault<EndNodeType> = {
  defaultValue: {
    outputs: [],
  },
  getAvailablePrevNodes() {
    return []
  },
  getAvailableNextNodes() {
    return []
  },
  checkValid(payload: EndNodeType) {
    let isValid = true
    let errorMessages = ''
    if (payload.type) {
      isValid = true
      errorMessages = ''
    }
    return {
      isValid,
      errorMessage: errorMessages,
    }
  },
}

export default nodeDefault
