import type { Node, BuiltInNode } from '@xyflow/react';

export type CameraInput = Node<any, '摄像头输入'>;
export type PoseDetection = Node<any, '姿势识别'>;
export type AppNode = BuiltInNode | CameraInput;
