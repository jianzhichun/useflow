import type { ComponentType } from 'react'
import { BlockEnum } from '../types'
import StartNode from './start/node';
import CameraNodeType from './cameraInput/node';

export const NodeComponentMap: Record<string, ComponentType<any>> = {
  [BlockEnum.Start]: StartNode,
  [BlockEnum.CameraInput]: CameraNodeType,
}

export const PanelComponentMap: Record<string, ComponentType<any>> = {
}

export const CUSTOM_NODE_TYPE = 'custom'
