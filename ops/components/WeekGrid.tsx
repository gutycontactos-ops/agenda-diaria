'use client'

import { useRouter } from 'next/navigation'

interface DayStats {
  date: string
  done: number
  total: number
}

interface WeekGridProps {
  weekDates: string[]
  statsPerDay: DayStats[]
}

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab']

export function WeekGrid({ weekDates, statsPerDay }: WeekGridProps) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const getProgressColor = (done: number, total: number) => {
    if (total === 0) return 'bg-gray-600'
    const percentage = (done / total) * 100
    if (percentage >= 80) return 'bg-[#22c55e]'
    if (percentage >= 50) return 'bg-[#f59e0b]'
    return 'bg-[#ef4444]'
  }

  return (
    <div className="grid grid-cols-7 gap-2 p-4">
      {weekDates.map((date) => {
        const stats = statsPerDay.find((s) => s.date === date)
        const dayOfWeek = new Date(date + 'T12:00:00').getDay()
        const dayNum = new Date(date + 'T12:00:00').getDate()
        const isToday = date === today

        const percentage = stats?.total === 0 ? 0 : ((stats?.done || 0) / (stats?.total || 1)) * 100

        return (
          <button
            key={date}
            onClick={() => router.push(`/?date=${date}`)}
            className={`aspect-square flex flex-col items-center justify-center rounded-lg p-2 transition-all border-2 ${
              isToday ? 'border-[#f59e0b] bg-[#111111]' : 'border-[#1f1f1f] bg-[#0a0a0a] hover:bg-[#111111]'
            }`}
          >
            <span className="text-xs font-mono text-gray-400">{dayNames[dayOfWeek]}</span>
            <span className="text-sm font-bold text-gray-200">{dayNum}</span>
            <div className="w-full h-1 bg-[#0a0a0a] rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full transition-all ${getProgressColor(stats?.done || 0, stats?.total || 0)}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
