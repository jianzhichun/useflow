import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import InputVarTypeIcon from '../_base/components/input-var-type-icon'
import type { VideoNodeType } from './types'
import { Variable02 } from '@/app/components/base/icons/src/vender/solid/development'
import type { NodeProps } from '@/app/components/workflow/types'
const i18nPrefix = 'workflow.nodes.start'

const VideoNodeType: FC<NodeProps<VideoNodeType>> = ({
  data,
}) => {
  const { t } = useTranslation()

  return (
    <div className='mb-1 px-3 py-1'>
      <div className='space-y-0.5'>
        Video Input
      </div>
    </div>
  )
}

export default React.memo(VideoNodeType)
