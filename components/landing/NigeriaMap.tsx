'use client'

const CITIES = [
  { name: 'Lagos',         x: 23,  y: 246, major: true,  delay: '0s' },
  { name: 'Ibadan',        x: 48,  y: 210, major: false, delay: '0.4s' },
  { name: 'Ilorin',        x: 72,  y: 178, major: false, delay: '0.8s' },
  { name: 'Abuja',         x: 168, y: 155, major: true,  delay: '0.3s' },
  { name: 'Kaduna',        x: 162, y: 110, major: false, delay: '0.6s' },
  { name: 'Kano',          x: 198, y: 60,  major: true,  delay: '0.2s' },
  { name: 'Sokoto',        x: 88,  y: 26,  major: false, delay: '1.0s' },
  { name: 'Zaria',         x: 173, y: 88,  major: false, delay: '0.9s' },
  { name: 'Jos',           x: 210, y: 130, major: false, delay: '0.5s' },
  { name: 'Bauchi',        x: 242, y: 118, major: false, delay: '1.1s' },
  { name: 'Maiduguri',     x: 352, y: 68,  major: true,  delay: '0.7s' },
  { name: 'Benin City',    x: 100, y: 252, major: false, delay: '1.2s' },
  { name: 'Warri',         x: 107, y: 278, major: false, delay: '1.4s' },
  { name: 'Port Harcourt', x: 148, y: 302, major: true,  delay: '0.1s' },
  { name: 'Enugu',         x: 165, y: 248, major: false, delay: '1.3s' },
  { name: 'Makurdi',       x: 198, y: 204, major: false, delay: '1.5s' },
  { name: 'Calabar',       x: 216, y: 298, major: false, delay: '1.6s' },
  { name: 'Uyo',           x: 180, y: 294, major: false, delay: '1.7s' },
]

const LINES = [
  [0, 1], [1, 2], [2, 3], [2, 4], [4, 5], [4, 8], [5, 7], [7, 6], [5, 6],
  [3, 4], [3, 8], [3, 15], [8, 9], [9, 10], [8, 15], [15, 14], [14, 13],
  [14, 16], [13, 17], [13, 12], [12, 11], [11, 1], [11, 14], [0, 11],
]

export default function NigeriaMap() {
  return (
    <div className="relative w-full max-w-[420px] mx-auto select-none">
      <svg
        viewBox="0 0 400 330"
        className="w-full h-auto"
        aria-hidden="true"
      >
        {/* Lines between cities */}
        {LINES.map(([a, b], i) => (
          <line
            key={i}
            x1={CITIES[a].x} y1={CITIES[a].y}
            x2={CITIES[b].x} y2={CITIES[b].y}
            stroke="rgba(0,200,100,0.18)"
            strokeWidth="1"
          />
        ))}

        {/* Ping rings on major cities */}
        {CITIES.filter(c => c.major).map(city => (
          <circle
            key={city.name + '-ring'}
            cx={city.x} cy={city.y} r="6"
            fill="none"
            stroke="#00D46A"
            strokeWidth="1"
            style={{
              animation: `ping-ring 2.4s ease-out infinite`,
              animationDelay: city.delay,
              transformOrigin: `${city.x}px ${city.y}px`,
            }}
          />
        ))}

        {/* City dots */}
        {CITIES.map(city => (
          <g key={city.name}>
            <circle
              cx={city.x} cy={city.y}
              r={city.major ? 5 : 3}
              fill={city.major ? '#00D46A' : '#008751'}
              style={{
                animation: 'pulse-dot 2.8s ease-in-out infinite',
                animationDelay: city.delay,
                transformOrigin: `${city.x}px ${city.y}px`,
              }}
            />
          </g>
        ))}

        {/* City labels for major cities */}
        {CITIES.filter(c => c.major).map(city => (
          <text
            key={city.name + '-label'}
            x={city.x + 8} y={city.y + 4}
            fontSize="8"
            fill="rgba(255,255,255,0.55)"
            fontFamily="inherit"
          >
            {city.name}
          </text>
        ))}
      </svg>

      {/* Floating report count badges */}
      <div
        className="absolute top-[22%] left-[38%] bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-semibold"
        style={{ animation: 'float 3.5s ease-in-out infinite' }}
      >
        🔥 47/50 reports
      </div>
      <div
        className="absolute bottom-[28%] left-[10%] bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-semibold"
        style={{ animation: 'float 4s ease-in-out infinite', animationDelay: '1s' }}
      >
        ✅ Escalated!
      </div>
      <div
        className="absolute top-[15%] right-[10%] bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-semibold"
        style={{ animation: 'float 3s ease-in-out infinite', animationDelay: '0.5s' }}
      >
        📍 New report
      </div>
    </div>
  )
}
