'use client'
import type { FC } from 'react'
import React from 'react'
import s from './style.module.css'
import cn from '@/utils/classnames'

export type IAppDetailLayoutProps = {
  children: React.ReactNode
  params: { appId: string }
}

const AppDetailLayout: FC<IAppDetailLayoutProps> = (props) => {
  const {
    children,
    params: { appId }, // get appId in path
  } = props

  return (
    <div className={cn(s.app, 'flex', 'overflow-hidden')}>
      <div className="bg-white grow overflow-hidden">
        {children}
      </div>
    </div>
  )
}
export default React.memo(AppDetailLayout)
