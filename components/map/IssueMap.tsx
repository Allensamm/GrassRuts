'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import { cn, getStatusLabel, getStatusColor } from '@/lib/utils'
import type { IssueStatus } from '@/types'

// Nigeria bounds
const NIGERIA_CENTER: [number, number] = [9.082, 8.6753]
const NIGERIA_ZOOM = 6

const STATUS_COLORS: Record<string, string> = {
  pending: '#008751',
  high_priority: '#dc2626',
  in_review: '#2563eb',
  resolved: '#16a34a',
  verified: '#15803d',
}

function createMarkerIcon(status: string, icon: string) {
  const color = STATUS_COLORS[status] ?? '#008751'
  return L.divIcon({
    html: `<div style="background:${color};width:34px;height:34px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:16px;line-height:1">${icon}</div>`,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -36],
  })
}

function FitBounds({ issues }: { issues: IssueMapItem[] }) {
  const map = useMap()
  useEffect(() => {
    const withCoords = issues.filter(i => i.lat && i.lng)
    if (withCoords.length > 0) {
      const bounds = L.latLngBounds(withCoords.map(i => [i.lat!, i.lng!]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }
  }, [issues, map])
  return null
}

export interface IssueMapItem {
  id: string
  title: string
  status: string
  report_count: number
  threshold: number
  lat: number | null
  lng: number | null
  category_icon: string
  category_name: string
  lga_name: string
}

interface Props {
  issues: IssueMapItem[]
  fitToIssues?: boolean
}

export default function IssueMap({ issues, fitToIssues }: Props) {
  const withCoords = issues.filter(i => i.lat && i.lng)

  return (
    <div className="w-full h-[calc(100vh-180px)] rounded-2xl overflow-hidden border border-gray-100">
      {withCoords.length === 0 ? (
        <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center text-gray-400">
          <p className="text-4xl mb-2">🗺️</p>
          <p className="text-sm font-medium">No geotagged issues yet</p>
          <p className="text-xs mt-1">Issues appear on the map when reporters share their GPS location</p>
        </div>
      ) : (
        <MapContainer
          center={NIGERIA_CENTER}
          zoom={NIGERIA_ZOOM}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {fitToIssues && <FitBounds issues={withCoords} />}
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            showCoverageOnHover={false}
          >
            {withCoords.map(issue => (
              <Marker
                key={issue.id}
                position={[issue.lat!, issue.lng!]}
                icon={createMarkerIcon(issue.status, issue.category_icon)}
              >
                <Popup className="issue-popup" minWidth={220}>
                  <div className="p-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{issue.category_icon}</span>
                      <span className="text-xs text-gray-500">{issue.category_name}</span>
                      <span className={cn(
                        'ml-auto text-xs font-semibold px-2 py-0.5 rounded-full',
                        getStatusColor(issue.status as IssueStatus)
                      )}>
                        {getStatusLabel(issue.status as IssueStatus)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug mb-1 line-clamp-2">
                      {issue.title}
                    </p>
                    <p className="text-xs text-gray-500 mb-2">
                      📍 {issue.lga_name} &middot; {issue.report_count}/{issue.threshold} reports
                    </p>
                    <Link
                      href={`/issues/${issue.id}`}
                      className="block w-full text-center bg-[#008751] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-[#006B40] transition-colors"
                    >
                      View Issue →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      )}
    </div>
  )
}
