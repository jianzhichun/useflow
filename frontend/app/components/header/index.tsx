'use client'
import { useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useBoolean } from 'ahooks'
import { useSelectedLayoutSegment } from 'next/navigation'
import { Bars3Icon } from '@heroicons/react/20/solid'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'

const navClassName = `
  flex items-center relative mr-0 sm:mr-3 px-3 h-8 rounded-xl
  font-medium text-sm
  cursor-pointer
`

const Header = () => {
  const selectedSegment = useSelectedLayoutSegment()
  const [isShowNavMenu, { toggle, setFalse: hideNavMenu }] = useBoolean(false)
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  useEffect(() => {
    hideNavMenu()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSegment])
  return (
    <div className='flex flex-1 items-center justify-between px-4'>
      <div className='flex items-center'>
        {isMobile && <div
          className='flex items-center justify-center h-8 w-8 cursor-pointer'
          onClick={toggle}
        >
          <Bars3Icon className="h-4 w-4 text-gray-500" />
        </div>}
        {!isMobile && <>
          <Link href="/apps" className='flex items-center mr-4'>
            {/* <LogoSite className='object-contain' /> */}
            <div className='h-full flex bg-gray-400'>Logo Site</div>
          </Link>
        </>}
      </div>
      {isMobile && (
        <div className='flex'>
          <Link href="/apps" className='flex items-center mr-4'>
            {/* <LogoSite /> */}
            <div className='h-full flex bg-gray-400'>Logo Site</div>
          </Link>
        </div>
      )}
      <div className='flex items-center flex-shrink-0'>
      </div>
    </div>
  )
}
export default Header
