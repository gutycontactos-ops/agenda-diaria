'use client'

import { ReelIdea } from '@/types'
import { useState } from 'react'

interface ReelIdeaCardProps {
  idea: ReelIdea | null
  loading: boolean
  onAcceptGuty: () => void
  onAcceptAlbillon: () => void
  onSkipAll: () => void
}

export function ReelIdeaCard({
  idea,
  loading,
  onAcceptGuty,
  onAcceptAlbillon,
  onSkipAll,
}: ReelIdeaCardProps) {
  const [expanded, setExpanded] = useState(!idea?.accepted_guty && !idea?.accepted_albillon)

  if (loading) {
    return (
      <div className="p-5 rounded-2xl bg-white border border-[#e5e7eb] mb-6 animate-pulse shadow-md">
        <div className="h-5 bg-[#f0f0f0] rounded-lg mb-3" />
        <div className="h-5 bg-[#f0f0f0] rounded-lg" />
      </div>
    )
  }

  if (!idea) return null

  return (
    <div
      className="p-5 rounded-2xl bg-white border border-[#e5e7eb] mb-6 cursor-pointer transition-all shadow-md hover:shadow-lg"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono font-bold text-[#6366f1] text-sm tracking-wide">💡 IDEAS DE REELS</h3>
        <span className="text-lg text-[#6b7280] transition-transform">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="space-y-5">
          {/* Guty_GG */}
          <div className="border-l-4 border-[#f59e0b] pl-4 bg-amber-50/30 rounded-r-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🎮</span>
              <span className="text-sm font-mono font-semibold text-[#1a1a2e]">Guty_GG</span>
              {idea.accepted_guty && (
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold ml-auto">
                  ✓ Grabada
                </span>
              )}
            </div>
            <p className="text-sm text-[#4b5563] leading-relaxed">{idea.guty_gg_idea}</p>
          </div>

          {/* 0alBillon */}
          <div className="border-l-4 border-[#06b6d4] pl-4 bg-cyan-50/30 rounded-r-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💼</span>
              <span className="text-sm font-mono font-semibold text-[#1a1a2e]">0alBillon</span>
              {idea.accepted_albillon && (
                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold ml-auto">
                  ✓ Grabada
                </span>
              )}
            </div>
            <p className="text-sm text-[#4b5563] leading-relaxed">{idea.zero_albillon_idea}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4 border-t border-[#e5e7eb]">
            {!idea.accepted_guty && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAcceptGuty()
                }}
                className="flex-1 px-3 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-xs font-semibold text-white transition-colors shadow-sm"
              >
                🎮 Grabar
              </button>
            )}
            {!idea.accepted_albillon && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAcceptAlbillon()
                }}
                className="flex-1 px-3 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-xs font-semibold text-white transition-colors shadow-sm"
              >
                💼 Grabar
              </button>
            )}
            {!idea.accepted_guty && !idea.accepted_albillon && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSkipAll()
                }}
                className="flex-1 px-3 py-2.5 rounded-lg bg-[#f5f5f7] hover:bg-[#e5e7eb] text-xs font-semibold text-[#6b7280] transition-colors"
              >
                Sin ánimos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
