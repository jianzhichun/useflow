import type { Block } from '../types'
import { BlockEnum } from '../types'
import { BlockClassificationEnum } from './types'

export const BLOCKS: Block[] = [
  {
    classification: BlockClassificationEnum.Default,
    type: BlockEnum.Start,
    title: 'Start',
    description: '',
  },
  {
    classification: BlockClassificationEnum.Default,
    type: BlockEnum.CameraInput,
    title: 'Video Input',
  },
  {
    classification: BlockClassificationEnum.Default,
    type: BlockEnum.PoseDetection,
    title: 'Pose Detection',
  },
  {
    classification: BlockClassificationEnum.Default,
    type: BlockEnum.CustomPose,
    title: 'Custom Pose',
  },
  {
    classification: BlockClassificationEnum.Default,
    type: BlockEnum.ActionArragement,
    title: 'Action Arrangement',
  },
  {
    classification: BlockClassificationEnum.Default,
    type: BlockEnum.VideoRender,
    title: 'Video Render',
  },
  {
    classification: BlockClassificationEnum.Default,
    type: BlockEnum.End,
    title: 'End',
  },
]

export const BLOCK_CLASSIFICATIONS: string[] = [
  BlockClassificationEnum.Default,
]
