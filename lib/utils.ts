import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { IssueStatus, IssueCategory } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateString)
}

export function getStatusLabel(status: IssueStatus): string {
  const labels: Record<IssueStatus, string> = {
    pending: 'Pending',
    high_priority: 'High Priority',
    in_review: 'In Review',
    resolved: 'Resolved',
    verified: 'Verified',
  }
  return labels[status] ?? 'Unknown'
}

export function getStatusColor(status: IssueStatus): string {
  const colors: Record<IssueStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    high_priority: 'bg-red-100 text-red-800',
    in_review: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    verified: 'bg-emerald-100 text-emerald-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}

export function getCategoryIcon(slug: IssueCategory): string {
  const icons: Record<IssueCategory, string> = {
    infrastructure: '🛣️',
    water: '💧',
    electricity: '⚡',
    public_health: '🏥',
    security: '🔒',
    education: '🏫',
    environment: '🌍',
    other: '❓',
  }
  return icons[slug]
}

export function getThresholdProgress(count: number, threshold: number): number {
  return Math.min(Math.round((count / threshold) * 100), 100)
}

export function formatPhone(phone: string): string {
  // Normalize Nigerian phone numbers to +234 format
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('234')) return `+${cleaned}`
  if (cleaned.startsWith('0')) return `+234${cleaned.slice(1)}`
  return `+234${cleaned}`
}
