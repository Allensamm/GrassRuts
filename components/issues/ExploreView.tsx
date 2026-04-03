'use client'

import IssueCard from './IssueCard'
import IssueMapDynamic from '@/components/map/IssueMapDynamic'
import type { IssueMapItem } from '@/components/map/IssueMapDynamic'

interface Props {
  issues: any[]
  mapIssues: IssueMapItem[]
  isMapView: boolean
}

export default function ExploreView({ issues, mapIssues, isMapView }: Props) {
  if (isMapView) {
    return <IssueMapDynamic issues={mapIssues} fitToIssues />
  }

  if (issues.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-3">🔍</div>
        <p className="font-semibold text-gray-700 mb-1">No issues found</p>
        <p className="text-sm text-gray-400">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {issues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
    </div>
  )
}
