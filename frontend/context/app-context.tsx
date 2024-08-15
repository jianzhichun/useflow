'use client'

import { createRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createContext, useContext, useContextSelector } from 'use-context-selector'
import type { FC, ReactNode } from 'react'
import { Theme } from '@/types/app'

export type AppContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  pageContainerRef: React.RefObject<HTMLDivElement>
}

const AppContext = createContext<AppContextValue>({
  theme: Theme.light,
  setTheme: () => { },
  pageContainerRef: createRef(),
})

export function useSelector<T>(selector: (value: AppContextValue) => T): T {
  return useContextSelector(AppContext, selector)
}

export type AppContextProviderProps = {
  children: ReactNode
}

export const AppContextProvider: FC<AppContextProviderProps> = ({ children }) => {
  const pageContainerRef = useRef<HTMLDivElement>(null)


  const [theme, setTheme] = useState<Theme>(Theme.light)
  const handleSetTheme = useCallback((theme: Theme) => {
    setTheme(theme)
    globalThis.document.documentElement.setAttribute('data-theme', theme)
  }, [])

  useEffect(() => {
    globalThis.document.documentElement.setAttribute('data-theme', theme)
  }, [])

  return (
    <AppContext.Provider value={{
      theme,
      setTheme: handleSetTheme,
      pageContainerRef
    }}>
      <div className='flex flex-col h-full overflow-y-auto'>
        <div ref={pageContainerRef} className='grow relative flex flex-col overflow-y-auto overflow-x-hidden bg-background-body'>
          {children}
        </div>
      </div>
    </AppContext.Provider>
  )
}

export const useAppContext = () => useContext(AppContext)

export default AppContext
