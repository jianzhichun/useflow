'use client'

import Link from "next/link"

const Page = () => {
  return (
    <div className='w-full h-full overflow-x-auto'>
      <div className="w-full">
        <Link href='/'>back</Link>
      </div>
      hello world
      {/* <Workflow /> */}
    </div>
  )
}
export default Page
