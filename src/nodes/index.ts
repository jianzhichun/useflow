import type { NodeTypes } from '@xyflow/react';

import { CameraInput } from './CameraInput';
import { PoseDetection } from './PoseDetection';
import { AppNode } from './types';
import { PoseValidator } from './PoseValidator';
import { ActionArrangement } from './ActionArrangement';
import { Log } from './Log';
import { VideoRender } from './VideoRender';
import { BodySegmentation } from './BodySegmentation';
import { HandPoseDetection } from './HandPoseDetection';
import { HandPoseValidator } from './HandPoseValidator';
import { DingTalkRobot } from './DingTalkRobot';

export const initialNodes: AppNode[] = [];
export const nodeTypes = {
  'camera-input': Object.assign(CameraInput, {
    defaultData() {
      return {
        label: '摄像头输入',
      }
    }
  }),
  'body-segmentation': Object.assign(BodySegmentation, {
    defaultData() {
      return {
        label: '人像分割',
        modelType: "general"
      }
    }
  }),
  'pose-detection': Object.assign(PoseDetection, {
    defaultData() {
      return {
        label: '姿势识别',
        modelType: "lite"
      }
    }
  }),
  'pose-validator': Object.assign(PoseValidator, {
    defaultData() {
      return {
        label: '姿势校验',
        poseCaptureThreshold: 0.6,
        poseScoreThreshold: 0.7,
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
  'hand-pose-detection': Object.assign(HandPoseDetection, {
    defaultData() {
      return {
        label: '手势识别',
        modelType: "lite"
      }
    }
  }),
  'hand-pose-validator': Object.assign(HandPoseValidator, {
    defaultData() {
      return {
        label: '手势校验',
        poseCaptureThreshold: 0.6,
        poseScoreThreshold: 0.7,
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
  'action-arrangement': Object.assign(ActionArrangement, {
    defaultData() {
      return {
        label: '行为编排',
        frames: [{
          wait: 3,
          waitStrategy: 'condition_next',
          name: '行为1',
          minScore: 85,
          rollback: 0,
          scoreFormat: 'percentage'
        }]
      }
    }
  }),
  'video-render': Object.assign(VideoRender, {
    defaultData() {
      return {
        label: '视频渲染',
        drawActions: [{
          type: 'pose',
          drawKeypoints: true,
          drawSkeleton: true
        }]
      }
    }
  }),
  'dingtalk-robot': Object.assign(DingTalkRobot, {
    defaultData() {
      return {
        label: '钉钉机器人',
        msgs:[{
          type: 'score'
        }]
      }
    }
  }),
  'log': Object.assign(Log, {
    defaultData() {
      return {
        label: '日志',
      }
    }
  })
} satisfies NodeTypes;
