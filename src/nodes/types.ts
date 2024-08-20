import type { Node, BuiltInNode } from '@xyflow/react';

export type CameraInput = Node<any, 'camera-input'>;
export type PoseDetection = Node<any, 'pose-detection'>;
export type PoseValidator = Node<any, 'pose-validator'>;

export type AppNode = BuiltInNode | CameraInput;