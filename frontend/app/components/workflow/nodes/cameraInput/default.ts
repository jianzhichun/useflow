import { BlockEnum, type NodeDefault } from '../../types'
import type { CameraNodeType } from './types'
import { ALL_AVALIBALE_BLOCKs_AFTER_CAMERA, NODES_EXTRA_DATA, NODES_INITIAL_DATA } from '@/app/components/workflow/constants'

const nodeDefault: NodeDefault<CameraNodeType> = {
  defaultValue: {
    // variables: [],
  },
  getAvailablePrevNodes() {
    return Object.keys(NODES_EXTRA_DATA).filter(key => key !== BlockEnum.End) as BlockEnum[]
  },
  getAvailableNextNodes() {
    return ALL_AVALIBALE_BLOCKs_AFTER_CAMERA
  },
  checkValid() {
    return {
      isValid: true,
    }
  },
}

export default nodeDefault
