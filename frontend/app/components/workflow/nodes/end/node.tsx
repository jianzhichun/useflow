import type { FC } from 'react'
import React from 'react'
import type { EndNodeType } from './types'
import type { NodeProps } from '@/app/components/workflow/types'

const Node: FC<NodeProps<EndNodeType>> = ({
  data,
}) => {
  return (
    <div className='mb-1 px-3 py-1'>
      <div className='space-y-0.5'>
      </div>
    </div>
  )
}

export default React.memo(Node)
