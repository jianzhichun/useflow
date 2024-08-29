import type { Node, BuiltInNode } from '@xyflow/react';

export type CameraInput = Node<any, 'camera-input'>;
export type BodySegmentation = Node<any, 'body-segmentation'>;
export type PoseDetection = Node<any, 'pose-detection'>;
export type PoseValidator = Node<any, 'pose-validator'>;
export type HandPoseValidator = Node<any, 'hand-pose-validator'>;
export type HandPoseDetection = Node<any, 'hand-pose-detection'>;
export type ActionArrangement = Node<any, 'action-arrangement'>;
export type VideoRender = Node<any, 'video-render'>;
export type Log = Node<any, 'log'>;
export type DingTalkRobot = Node<any, 'dingtalk-robot'>;

export type AppNode = BuiltInNode | CameraInput;