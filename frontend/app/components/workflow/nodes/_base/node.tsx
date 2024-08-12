import type {
  FC,
  ReactElement,
} from 'react'
import {
  memo,
  useRef,
} from 'react'
import type { NodeProps } from '../../types'
import cn from '@/utils/classnames'

type BaseNodeProps = {
  children: ReactElement
} & NodeProps

const BaseNode: FC<BaseNodeProps> = ({
  id,
  data,
  children,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null)

  return (
    <div
      className={cn(
        'flex border-[2px] rounded-2xl',
      )}
      ref={nodeRef}
      style={{
        width: 'auto',
        height: 'auto',
      }}
    >
      <div
        className={cn(
          'group relative pb-1 shadow-xs',
          'border border-transparent rounded-[15px]',
          'w-[240px] bg-workflow-block-bg',
          'flex flex-col w-full h-full bg-[#fcfdff]/80',
          !data._runningStatus && 'hover:shadow-lg',
          data._isBundled && '!shadow-lg',
        )}
      >
        <div className={cn(
          'flex items-center px-3 pt-3 pb-2 rounded-t-2xl',
        )}>
          <div
            title={data.title}
            className='grow mr-1 system-sm-semibold-uppercase text-text-primary truncate'
          >
            {data.title}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(BaseNode)
