'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Users, MapPin, CheckCircle2 } from 'lucide-react'

function useCountUp(target: number, started: boolean, duration = 2400) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!started) return
    if (target === 0) { setCount(0); return }

    let startTime: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
      else setCount(target)
    }
    requestAnimationFrame(animate)
  }, [target, started, duration])

  return count
}

interface StatItemProps {
  value: number
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  started: boolean
}

function StatItem({ value, label, icon: Icon, started }: StatItemProps) {
  const count = useCountUp(value, started)
  return (
    <div className="text-center text-white">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-5">
        <Icon size={26} className="text-white/70" />
      </div>
      <div className="text-5xl lg:text-6xl font-extrabold mb-2 tabular-nums tracking-tight">
        {value === 0 ? '—' : count.toLocaleString()}
      </div>
      <div className="text-white/60 text-sm font-medium">{label}</div>
    </div>
  )
}

interface Props {
  totalIssues: number
  totalReports: number
  activeLgas: number
  resolvedIssues: number
}

export default function StatsSection({
  totalIssues,
  totalReports,
  activeLgas,
  resolvedIssues,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
      <StatItem value={totalIssues} label="Issues Reported" icon={Bell} started={started} />
      <StatItem value={totalReports} label="Community Reports" icon={Users} started={started} />
      <StatItem value={activeLgas} label="LGAs Active" icon={MapPin} started={started} />
      <StatItem value={resolvedIssues} label="Issues Resolved" icon={CheckCircle2} started={started} />
    </div>
  )
}
