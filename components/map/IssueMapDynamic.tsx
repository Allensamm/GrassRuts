import dynamic from 'next/dynamic'
import type { IssueMapItem } from './IssueMap'

const IssueMap = dynamic(() => import('./IssueMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[calc(100vh-180px)] rounded-2xl bg-gray-100 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <p className="text-3xl mb-2">🗺️</p>
        <p className="text-sm">Loading map...</p>
      </div>
    </div>
  ),
})

export type { IssueMapItem }
export default IssueMap
