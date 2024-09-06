import type { ComponentType } from 'react'
import { BlockEnum } from '../types'
import StartNode from './start/node';
import CameraNodeType from './cameraInput/node';
import PoseDetectionType from './poseDetection/node';
import CustomPoseType from './customPose/node';
import ActionArragementType from './actionArragement/node';
import VideoRenderType from './videoRender/node';
import StartPanel from './start/panel';
import EndNode from './end/panel';
import PoseDetectionPanel from './poseDetection/panel';
import CustomPosePanel from './customPose/panel';
import CameraInputPanel from './cameraInput/panel';
import ActionArragementPanel from './actionArragement/panel';
import VideoRenderPanel from './videoRender/panel';

export const NodeComponentMap: Record<string, ComponentType<any>> = {
  [BlockEnum.Start]: StartNode,
  [BlockEnum.CameraInput]: CameraNodeType,
  [BlockEnum.PoseDetection]: PoseDetectionType,
  [BlockEnum.CustomPose]: CustomPoseType,
  [BlockEnum.ActionArragement]: ActionArragementType,
  [BlockEnum.VideoRender]: VideoRenderType,
  [BlockEnum.End]: EndNode,
}

export const PanelComponentMap: Record<string, ComponentType<any>> = {
  [BlockEnum.Start]: StartPanel,
  [BlockEnum.CameraInput]: CameraInputPanel,
  [BlockEnum.PoseDetection]: PoseDetectionPanel,
  [BlockEnum.CustomPose]: CustomPosePanel,
  [BlockEnum.ActionArragement]: ActionArragementPanel,
  [BlockEnum.VideoRender]: VideoRenderPanel,
  [BlockEnum.End]: PoseDetectionPanel,
}

export const CUSTOM_NODE_TYPE = 'custom'
