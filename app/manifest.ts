import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Grassruts — Community Issues',
    short_name: 'Grassruts',
    description: 'Report and track community issues collectively. 50 voices get heard.',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F9FAFB',
    theme_color: '#008751',
    icons: [
      { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
    ],
    categories: ['productivity', 'social', 'government'],
  }
}
