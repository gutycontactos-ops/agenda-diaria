'use client'

import { DailyInstance, Task } from '@/types'
import { useState, useRef } from 'react'

const categoryEmojis: Record<string, string> = {
  mercadolibre: '🛒',
  content: '🎬',
  stream: '🎮',
  personal: '👤',
  hazloCrecer: '💼',
}

const categoryColors: Record<string, { border: string; bg: string; text: string }> = {
  mercadolibre: { border: '#fbbf24', bg: '#fef3c7', text: '#78350f' },
  content: { border: '#f472b6', bg: '#fce7f3', text: '#831843' },
  stream: { border: '#a78bfa', bg: '#f3e8ff', text: '#4c1d95' },
  personal: { border: '#60a5fa', bg: '#dbeafe', text: '#1e3a8a' },
  hazloCrecer: { border: '#34d399', bg: '#d1fae5', text: '#064e3b' },
}

interface TaskCardProps {
  instance: DailyInstance & { task?: Task }
  onStatusChange: (instanceId: string, status: string, extra?: any) => void
  onMove: (instanceId: string) => void
  onAttach?: (instanceId: string, file: File) => void
}

export function TaskCard({ instance, onStatusChange, onMove, onAttach }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [notes, setNotes] = useState(instance.notes || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const task = instance.task
  if (!task) return null

  const statusCycle = (status: string) => {
    const cycle = ['pending', 'in_progress', 'done']
    const currentIndex = cycle.indexOf(status)
    return cycle[(currentIndex + 1) % cycle.length]
  }

  const handlePress = () => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true)
    }, 500)
  }

  const handleRelease = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const handleCardClick = () => {
    if (!showMenu) {
      const newStatus = statusCycle(instance.status)
      onStatusChange(instance.id, newStatus)
    }
  }

  const handleSkip = () => {
    onStatusChange(instance.id, 'skipped', { skipped_reason: 'manual' })
    setShowMenu(false)
  }

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onAttach) {
      onAttach(instance.id, file)
    }
    setShowMenu(false)
  }

  const isLocked = task.is_locked
  const isBlocked = instance.moved_count >= 2
  const isDone = instance.status === 'done'
  const isInProgress = instance.status === 'in_progress'

  const colors = categoryColors[task.category] || { border: '#6366f1', bg: '#eef2ff', text: '#3730a3' }
  let boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)'
  if (isInProgress) {
    boxShadow = `0 0 16px ${colors.border}33, 0 2px 8px rgba(0, 0, 0, 0.08)`
  }
  if (isDone) {
    boxShadow = `0 0 12px ${colors.border}33, 0 2px 8px rgba(0, 0, 0, 0.08)`
  }

  return (
    <>
      <div
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        onClick={handleCardClick}
        className={`relative rounded-xl bg-white cursor-pointer transition-all ${
          isDone ? 'opacity-60' : ''
        }`}
        style={{
          borderLeft: `5px solid ${colors.border}`,
          boxShadow: boxShadow,
        }}
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-2xl">{categoryEmojis[task.category] || '📌'}</span>
              <div className="flex-1">
                <h3 className="font-mono text-sm font-semibold text-[#1a1a2e]">{task.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: colors.bg, color: colors.text }}
                  >
                    {task.category}
                  </span>
                  {isLocked && <span className="text-xs">🔒</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDone && <span className="text-2xl text-green-500">✓</span>}
              {isInProgress && <span className="text-xl animate-pulse">⏳</span>}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3 text-xs text-[#6b7280]">
            {task.time_slot && (
              <span className="font-mono bg-[#f5f5f7] px-2.5 py-1.5 rounded-lg">
                🕐 {task.time_slot}
              </span>
            )}
            {task.account && (
              <span className="px-2.5 py-1.5 rounded-lg bg-[#f5f5f7]">
                {task.account === 'ambos' ? '👥 Ambos' : task.account === 'guty_gg' ? '🎮 Guty' : '💼 Alb'}
              </span>
            )}
            {isBlocked && (
              <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold">
                ⚠️ Bloqueada
              </span>
            )}
          </div>

          {instance.notes && (
            <p className="mt-2 text-xs text-[#6b7280] italic">{instance.notes}</p>
          )}

          <div className="mt-4 flex gap-2">
            {!isLocked && instance.status !== 'done' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMove(instance.id)
                }}
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#f5f5f7] text-[#1a1a2e] hover:bg-[#e5e7eb] transition-colors"
              >
                → Mañana
              </button>
            )}
          </div>
        </div>
      </div>

      {showMenu && (
        <div className="fixed inset-0 z-40 bg-black/30 flex items-end">
          <div className="w-full bg-white border-t border-[#e5e7eb] p-4 rounded-t-2xl">
            <div className="space-y-2">
              <button
                onClick={handleSkip}
                className="w-full px-4 py-3 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Saltada
              </button>
              <button
                onClick={() => {
                  const note = prompt('Añadir nota:', instance.notes || '')
                  if (note !== null) {
                    onStatusChange(instance.id, instance.status, { notes: note })
                  }
                  setShowMenu(false)
                }}
                className="w-full px-4 py-3 rounded-lg bg-[#f5f5f7] text-[#1a1a2e] text-sm font-semibold hover:bg-[#e5e7eb] transition-colors"
              >
                Añadir nota
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 rounded-lg bg-[#f5f5f7] text-[#1a1a2e] text-sm font-semibold hover:bg-[#e5e7eb] transition-colors"
              >
                Adjuntar imagen
              </button>
              <button
                onClick={() => setShowMenu(false)}
                className="w-full px-4 py-3 rounded-lg bg-[#f5f5f7] text-[#6b7280] text-sm font-semibold hover:bg-[#e5e7eb] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAttach}
        className="hidden"
      />
    </>
  )
}
