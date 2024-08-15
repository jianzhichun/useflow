import type { NodeTypes } from '@xyflow/react';

import { CameraInput } from './CameraInput';
import { PoseDetection } from './PoseDetection';
import { AppNode } from './types';
import { PoseEditor } from './PoseEditor';

export const initialNodes: AppNode[] = [];

export const nodeTypes = {
  '摄像头输入': CameraInput,
  '姿势识别': PoseDetection,
  '姿势编辑': PoseEditor
} satisfies NodeTypes;
