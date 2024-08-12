import type { NodeTypes } from '@xyflow/react';

import { CameraInput } from './CameraInput';
import { PoseDetection } from './PoseDetection';
import { AppNode } from './types';

export const initialNodes: AppNode[] = [];

export const nodeTypes = {
  '摄像头输入': CameraInput,
  '姿势识别': PoseDetection
} satisfies NodeTypes;
