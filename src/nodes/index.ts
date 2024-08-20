import type { NodeTypes } from '@xyflow/react';

import { CameraInput } from './CameraInput';
import { PoseDetection } from './PoseDetection';
import { AppNode } from './types';
import { PoseValidator } from './PoseValidator';

export const initialNodes: AppNode[] = [];

export const nodeTypes = {
  'camera-input': Object.assign(CameraInput, {
    defaultData() {
      return {
        label: '摄像头输入',
      }
    }
  }),
  'pose-detection': Object.assign(PoseDetection, {
    defaultData() {
      return {
        label: '姿势识别',
      }
    }
  }),
  'pose-validator': Object.assign(PoseValidator, {
    defaultData() {
      return {
        label: '姿势校验',
        poseThreshold: 0.97,
        scoreAlgorithm: {
          algorithm: 'manhattan'
        }
      }
    }
  })
} satisfies NodeTypes;
