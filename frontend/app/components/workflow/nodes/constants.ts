import type { ComponentType } from 'react'
import { BlockEnum } from '../types'
import StartNode from './start/node';
import CameraNodeType from './cameraInput/node';
import StartPanel from './start/panel';
import EndNode from './end/panel';
import EndPanel from './end/panel';
import CameraInputPanel from './cameraInput/panel';

export const NodeComponentMap: Record<string, ComponentType<any>> = {
  [BlockEnum.Start]: StartNode,
  [BlockEnum.CameraInput]: CameraNodeType,
  [BlockEnum.End]: EndNode,
}

export const PanelComponentMap: Record<string, ComponentType<any>> = {
  [BlockEnum.Start]: StartPanel,
  [BlockEnum.CameraInput]: CameraInputPanel,
  [BlockEnum.End]: EndPanel,
}

export const CUSTOM_NODE_TYPE = 'custom'
