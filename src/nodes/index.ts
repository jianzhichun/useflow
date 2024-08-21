import type { NodeTypes } from '@xyflow/react';

import { CameraInput } from './CameraInput';
import { PoseDetection } from './PoseDetection';
import { AppNode } from './types';
import { PoseValidator } from './PoseValidator';
import { PoseArrangement } from './PoseArrangement';

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
          algorithm: 'manhattan',
          scalingFunction: [
            {
              algorithm: 'linear',
              range: [0, 1],
              a: 100,
              b: 0
            }
          ]
        }
      }
    }
  }),
  'pose-arrangement': Object.assign(PoseArrangement, {
    defaultData() {
      return {
        label: '姿势编排',
        frames: [{
          wait: 3,
          name: '姿势1',
          minScore: 85,
          rollback: 0,
          scoreFormat: 'percentage'
        }]
      }
    }
  })
} satisfies NodeTypes;
