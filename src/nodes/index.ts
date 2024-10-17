import type { NodeTypes } from '@xyflow/react';

import { CameraInput } from './CameraInput';
import { PoseDetection } from './PoseDetection';
import { PoseValidator } from './PoseValidator';
import { ActionArrangement } from './ActionArrangement';
import { Log } from './Log';
import { VideoRender } from './VideoRender';
import { BodySegmentation } from './BodySegmentation';
import { HandPoseDetection } from './HandPoseDetection';
import { HandPoseValidator } from './HandPoseValidator';
import { DingTalkRobot } from './DingTalkRobot';
import { JointOffset } from './JointOffset';
import { FrameCrop } from './FrameCrop';
import { ObjectDetection } from './ObjectDetection';
import { ScriptConvert } from './ScriptConvert';

export const nodeTypes = {
  'camera-input': Object.assign(CameraInput, {
    category: "流式输入输出",
    defaultData() {
      return {
        label: '摄像头输入',
      }
    }
  }),
  'frame-crop': Object.assign(FrameCrop, {
    category: "流式输入输出",
    defaultData() {
      return {
        label: '区域切割',
        isPreview: true
      }
    }
  }),
  'body-segmentation': Object.assign(BodySegmentation, {
    category: "流式输入输出",
    defaultData() {
      return {
        label: '人像分割',
        modelType: "general"
      }
    }
  }),
  'object-detection': Object.assign(ObjectDetection, {
    category: "流式输入输出",
    defaultData() {
      return {
        label: '对象识别',
        confidenceThreshold: 0.5,
        tracking: true
      }
    }
  }),
  'pose-detection': Object.assign(PoseDetection, {
    category: "动作识别",
    defaultData() {
      return {
        label: '姿势识别',
        modelType: "lite"
      }
    }
  }),
  'pose-validator': Object.assign(PoseValidator, {
    category: "动作识别",
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
    category: "动作识别",
    defaultData() {
      return {
        label: '手势识别',
        modelType: "lite"
      }
    }
  }),
  'hand-pose-validator': Object.assign(HandPoseValidator, {
    category: "动作识别",
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
    category: "编排",
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
    category: "流式输入输出",
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
    category: "预警和通知",
    defaultData() {
      return {
        label: '钉钉机器人',
        msgs: [{
          type: 'score'
        }]
      }
    }
  }),
  'joint-offset': Object.assign(JointOffset, {
    category: "动作识别",
    defaultData() {
      return {
        label: '关节偏移',
      }
    }
  }),
  'log': Object.assign(Log, {
    defaultData() {
      return {
        label: '日志',
      }
    }
  }),
  'script-convert': Object.assign(ScriptConvert, {
    category: "流式输入输出",
    defaultData() {
      return {
        label: '转换脚本',
      }
    }
  })
} satisfies NodeTypes;
