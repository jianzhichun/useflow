import type { FC } from 'react'
import { memo } from 'react'
import { useNodes } from 'reactflow'
import type { CommonNodeType } from '../types'
import { Panel as NodePanel } from '../nodes'
import cn from '@/utils/classnames'

const Panel: FC = () => {
  const nodes = useNodes<CommonNodeType>()
  const selectedNode = nodes.find(node => node.data.selected)

  return (
    <div
      tabIndex={-1}
      className={cn('absolute top-14 right-0 bottom-2 flex z-10 outline-none')}
    >
      {
        !!selectedNode && (
          <NodePanel {...selectedNode!} />
        )
      }
    </div>
  )
}

export default memo(Panel)
