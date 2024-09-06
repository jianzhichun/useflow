import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import type { VideoRenderType } from './types'
import type { InputVar, NodePanelProps } from '@/app/components/workflow/types'

// const i18nPrefix = 'workflow.nodes.start'

const Panel: FC<NodePanelProps<VideoRenderType>> = ({
  id,
  data,
}) => {

  return (
    <div className='mt-2'>
      <div className='px-4 pb-2 space-y-4'>
        VideoRenderType
      </div>
    </div>
  )
}

export default React.memo(Panel)
