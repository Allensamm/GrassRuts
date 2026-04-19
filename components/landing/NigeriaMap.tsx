'use client'

import { useRef, useState, useEffect } from 'react'

const CITIES = [
  { name: 'Lagos',         x: 23,  y: 246, major: true,  delay: '0s' },
  { name: 'Ibadan',        x: 78,  y: 200, major: false, delay: '0.4s' },
  { name: 'Ilorin',        x: 112, y: 165, major: false, delay: '0.8s' },
  { name: 'Abuja',         x: 210, y: 148, major: true,  delay: '0.3s' },
  { name: 'Kaduna',        x: 200, y: 104, major: false, delay: '0.6s' },
  { name: 'Kano',          x: 238, y: 52,  major: true,  delay: '0.2s' },
  { name: 'Sokoto',        x: 108, y: 20,  major: false, delay: '1.0s' },
  { name: 'Zaria',         x: 216, y: 80,  major: false, delay: '0.9s' },
  { name: 'Jos',           x: 258, y: 125, major: false, delay: '0.5s' },
  { name: 'Bauchi',        x: 295, y: 112, major: false, delay: '1.1s' },
  { name: 'Maiduguri',     x: 420, y: 62,  major: true,  delay: '0.7s' },
  { name: 'Benin City',    x: 120, y: 245, major: false, delay: '1.2s' },
  { name: 'Warri',         x: 130, y: 275, major: false, delay: '1.4s' },
  { name: 'Port Harcourt', x: 182, y: 302, major: true,  delay: '0.1s' },
  { name: 'Enugu',         x: 205, y: 242, major: false, delay: '1.3s' },
  { name: 'Makurdi',       x: 242, y: 200, major: false, delay: '1.5s' },
  { name: 'Calabar',       x: 265, y: 298, major: false, delay: '1.6s' },
  { name: 'Uyo',           x: 222, y: 294, major: false, delay: '1.7s' },
  { name: 'Yola',          x: 355, y: 148, major: false, delay: '1.2s' },
  { name: 'Gombe',         x: 328, y: 98,  major: false, delay: '0.9s' },
]

const LINES = [
  [0,1],[1,2],[2,3],[2,4],[4,5],[4,8],[5,7],[7,6],[5,6],
  [3,4],[3,8],[3,15],[8,9],[9,10],[9,19],[19,10],[8,15],
  [15,14],[14,13],[14,16],[13,17],[13,12],[12,11],[11,1],
  [11,14],[0,11],[15,18],[19,18],[18,16],
]

export default function NigeriaMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      setMouse({
        x: (e.clientX - cx) / rect.width,
        y: (e.clientY - cy) / rect.height,
      })
    }

    const handleLeave = () => {
      setIsHovering(false)
      setMouse({ x: 0, y: 0 })
    }
    const handleEnter = () => setIsHovering(true)

    window.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    el.addEventListener('mouseenter', handleEnter)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
      el.removeEventListener('mouseenter', handleEnter)
    }
  }, [])

  const transition = isHovering ? 'transform 0.08s linear' : 'transform 0.6s ease-out'

  // Parallax offsets per layer
  const slow   = { x: mouse.x * 12, y: mouse.y * 10 }
  const medium = { x: mouse.x * 22, y: mouse.y * 18 }
  const fast   = { x: mouse.x * 36, y: mouse.y * 28 }

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ aspectRatio: '490 / 340' }}
    >
      <svg
        viewBox="0 0 490 340"
        className="w-full h-full"
        aria-hidden="true"
      >
        {/* ── Layer 1: Lines (slowest) ── */}
        <g style={{ transform: `translate(${slow.x}px, ${slow.y}px)`, transition }}>
          {LINES.map(([a, b], i) => (
            <line
              key={i}
              x1={CITIES[a].x} y1={CITIES[a].y}
              x2={CITIES[b].x} y2={CITIES[b].y}
              stroke="rgba(42,174,106,0.25)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* ── Layer 2: Minor city dots (medium) ── */}
        <g style={{ transform: `translate(${medium.x}px, ${medium.y}px)`, transition }}>
          {CITIES.filter(c => !c.major).map(city => (
            <g key={city.name}>
              <circle
                cx={city.x} cy={city.y} r={5}
                fill="#1B7D46"
                style={{
                  animation: 'pulse-dot 2.8s ease-in-out infinite',
                  animationDelay: city.delay,
                  transformOrigin: `${city.x}px ${city.y}px`,
                }}
              />
              <circle cx={city.x} cy={city.y} r={8} fill="rgba(27,125,70,0.18)" />
            </g>
          ))}
        </g>

        {/* ── Layer 3: Major city dots + rings + labels (fastest) ── */}
        <g style={{ transform: `translate(${fast.x}px, ${fast.y}px)`, transition }}>
          {CITIES.filter(c => c.major).map(city => (
            <g key={city.name}>
              {/* Outer ping ring */}
              <circle
                cx={city.x} cy={city.y} r={10}
                fill="none"
                stroke="#2AAE6A"
                strokeWidth="1.5"
                style={{
                  animation: 'ping-ring 2.4s ease-out infinite',
                  animationDelay: city.delay,
                  transformOrigin: `${city.x}px ${city.y}px`,
                }}
              />
              {/* Second ring */}
              <circle
                cx={city.x} cy={city.y} r={10}
                fill="none"
                stroke="#2AAE6A"
                strokeWidth="1"
                style={{
                  animation: 'ping-ring 2.4s ease-out infinite',
                  animationDelay: `calc(${city.delay} + 0.8s)`,
                  transformOrigin: `${city.x}px ${city.y}px`,
                }}
              />
              {/* Glow halo */}
              <circle cx={city.x} cy={city.y} r={10} fill="rgba(42,174,106,0.14)" />
              {/* Core dot */}
              <circle
                cx={city.x} cy={city.y} r={7}
                fill="#2AAE6A"
                style={{
                  animation: 'pulse-dot 2.8s ease-in-out infinite',
                  animationDelay: city.delay,
                  transformOrigin: `${city.x}px ${city.y}px`,
                }}
              />
              {/* Label */}
              <text
                x={city.x + 12} y={city.y + 4}
                fontSize="9"
                fill="rgba(255,255,255,0.6)"
                fontFamily="inherit"
                fontWeight="600"
              >
                {city.name}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* ── Floating badges — move fastest ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ transform: `translate(${fast.x}px, ${fast.y}px)`, transition }}
      >
        {/* Top-center: Kano area */}
        <div
          className="absolute bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-semibold whitespace-nowrap"
          style={{ top: '10%', left: '52%', animation: 'float 3.5s ease-in-out infinite' }}
        >
          🔥 47/50 reports
        </div>
        {/* Left: Lagos area */}
        <div
          className="absolute bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-semibold whitespace-nowrap"
          style={{ top: '60%', left: '4%', animation: 'float 4s ease-in-out infinite', animationDelay: '1s' }}
        >
          ✅ Escalated!
        </div>
        {/* Right: Maiduguri area */}
        <div
          className="absolute bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-semibold whitespace-nowrap"
          style={{ top: '8%', right: '2%', animation: 'float 3s ease-in-out infinite', animationDelay: '0.5s' }}
        >
          📍 New report
        </div>
        {/* Bottom: Port Harcourt area */}
        <div
          className="absolute bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-semibold whitespace-nowrap"
          style={{ bottom: '12%', left: '35%', animation: 'float 3.8s ease-in-out infinite', animationDelay: '1.5s' }}
        >
          👥 12 joined today
        </div>
      </div>
    </div>
  )
}
