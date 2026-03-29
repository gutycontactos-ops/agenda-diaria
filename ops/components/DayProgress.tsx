'use client'

interface DayProgressProps {
  done: number
  total: number
  date: string
}

export function DayProgress({ done, total, date }: DayProgressProps) {
  const percentage = total === 0 ? 0 : (done / total) * 100
  let barColor = '#ef4444' // red
  let gradientStart = '#ef4444'
  let gradientEnd = '#f97316'

  if (percentage > 80) {
    barColor = '#10b981' // emerald
    gradientStart = '#059669'
    gradientEnd = '#10b981'
  } else if (percentage > 50) {
    barColor = '#f59e0b' // amber
    gradientStart = '#d97706'
    gradientEnd = '#f59e0b'
  }

  const formatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })

  const formattedDate = formatter.format(new Date(date + 'T12:00:00'))
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  return (
    <div
      className="p-5 rounded-2xl mb-6 text-white shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`,
      }}
    >
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-sm opacity-90">{capitalizedDate}</span>
        <span className="font-mono text-3xl font-bold">
          {done}/{total} ✓
        </span>
      </div>
      <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            boxShadow: `0 0 12px ${barColor}`,
          }}
        />
      </div>
    </div>
  )
}
