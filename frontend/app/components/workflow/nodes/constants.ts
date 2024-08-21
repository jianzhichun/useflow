import type { ComponentType } from 'react'
import { BlockEnum } from '../types'
import StartNode from './start/node';

export const NodeComponentMap: Record<string, ComponentType<any>> = {
  [BlockEnum.Start]: StartNode,
}

export const PanelComponentMap: Record<string, ComponentType<any>> = {
}

export const CUSTOM_NODE_TYPE = 'custom'
