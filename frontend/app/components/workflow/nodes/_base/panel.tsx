import type {
  FC,
  ReactElement,
} from 'react'
import {
  cloneElement,
  memo,
} from 'react'
import { useResizePanel } from './hooks/use-resize-panel'
import cn from '@/utils/classnames'
import type { Node } from '@/app/components/workflow/types'

type BasePanelProps = {
  children: ReactElement
} & Node

const BasePanel: FC<BasePanelProps> = ({
  id,
  data,
  children,
}) => {
  const panelWidth = localStorage.getItem('workflow-node-panel-width') ? parseFloat(localStorage.getItem('workflow-node-panel-width')!) : 420

  const {
    triggerRef,
    containerRef,
  } = useResizePanel({
    direction: 'horizontal',
    triggerDirection: 'left',
    minWidth: 420,
    maxWidth: 720,
    // onResize: handleResize,
  })

  return (
    <div className={cn(
      'relative mr-2 h-full',
    )}>
      <div
        ref={triggerRef}
        className='absolute top-1/2 -translate-y-1/2 -left-2 w-3 h-6 cursor-col-resize resize-x'>
        <div className='w-1 h-6 bg-divider-regular rounded-sm'></div>
      </div>
      <div
        ref={containerRef}
        className={cn('h-full bg-components-panel-bg shadow-lg border-[0.5px] border-components-panel-border rounded-2xl', 'overflow-y-auto')}
        style={{
          width: `${panelWidth}px`,
        }}
      >
        <div className='py-2'>
          {cloneElement(children, { id, data })}
        </div>
      </div>
    </div>
  )
}

export default memo(BasePanel)
