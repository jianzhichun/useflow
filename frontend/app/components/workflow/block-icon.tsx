import type { FC } from 'react'
import { memo } from 'react'
import { BlockEnum } from './types'
import {
  Answer,
  Code,
  End,
  Home,
  Http,
  IfElse,
  Iteration,
  KnowledgeRetrieval,
  Llm,
  ParameterExtractor,
  QuestionClassifier,
  TemplatingTransform,
  VariableX,
} from '@/app/components/base/icons/src/vender/workflow'
import AppIcon from '@/app/components/base/app-icon'

type BlockIconProps = {
  type: BlockEnum
  size?: string
  className?: string
  toolIcon?: string | { content: string; background: string }
}
const ICON_CONTAINER_CLASSNAME_SIZE_MAP: Record<string, string> = {
  xs: 'w-4 h-4 rounded-[5px] shadow-xs',
  sm: 'w-5 h-5 rounded-md shadow-xs',
  md: 'w-6 h-6 rounded-lg shadow-md',
}
const getIcon = (type: BlockEnum, className: string) => {
  return {
    [BlockEnum.Start]: <Home className={className} />,
    [BlockEnum.CameraInput]: <Llm className={className} />,
    [BlockEnum.PoseDetection]: <Llm className={className} />,
    [BlockEnum.CustomPose]: <Llm className={className} />,
    [BlockEnum.ActionArragement]: <Llm className={className} />,
    [BlockEnum.VideoRender]: <Llm className={className} />,
    [BlockEnum.End]: <End className={className} />,
  }[type]
}
const ICON_CONTAINER_BG_COLOR_MAP: Record<string, string> = {
  [BlockEnum.Start]: 'bg-primary-500',
  [BlockEnum.CameraInput]: 'bg-[#6172F3]',
  [BlockEnum.PoseDetection]: 'bg-[#2E90FA]',
  [BlockEnum.CustomPose]: 'bg-[#F79009]',
  [BlockEnum.VideoRender]: 'bg-[#06AED4]',
  [BlockEnum.ActionArragement]: 'bg-[#16B364]',
  [BlockEnum.End]: 'bg-[#2E90FA]',
  // [BlockEnum.Answer]: 'bg-[#F79009]',
  // [BlockEnum.KnowledgeRetrieval]: 'bg-[#16B364]',
  // [BlockEnum.QuestionClassifier]: 'bg-[#16B364]',
  // [BlockEnum.TemplateTransform]: 'bg-[#2E90FA]',
  // [BlockEnum.VariableAssigner]: 'bg-[#2E90FA]',
  // [BlockEnum.VariableAggregator]: 'bg-[#2E90FA]',
  // [BlockEnum.ParameterExtractor]: 'bg-[#2E90FA]',
}
const BlockIcon: FC<BlockIconProps> = ({
  type,
  size = 'sm',
  className,
  toolIcon,
}) => {
  return (
    <div className={`
      flex items-center justify-center border-[0.5px] border-white/2 text-white
      ${ICON_CONTAINER_CLASSNAME_SIZE_MAP[size]}
      ${ICON_CONTAINER_BG_COLOR_MAP[type]}
      ${toolIcon && '!shadow-none'}
      ${className}
    `}
    >
      {/* {
        type !== BlockEnum.Tool && (
          getIcon(type, size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5')
        )
      } */}
      {
        // type === BlockEnum.Tool && toolIcon && (
        toolIcon && (
          <>
            {
              typeof toolIcon === 'string'
                ? (
                  <div
                    className='shrink-0 w-full h-full bg-cover bg-center rounded-md'
                    style={{
                      backgroundImage: `url(${toolIcon})`,
                    }}
                  ></div>
                )
                : (
                  <AppIcon
                    className='shrink-0 !w-full !h-full'
                    size='tiny'
                    icon={toolIcon?.content}
                    background={toolIcon?.background}
                  />
                )
            }
          </>
        )
      }
    </div>
  )
}

export const VarBlockIcon: FC<BlockIconProps> = ({
  type,
  className,
}) => {
  return (
    <>
      {getIcon(type, `w-3 h-3 ${className}`)}
    </>
  )
}

export default memo(BlockIcon)
