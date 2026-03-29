'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, DailyInstance } from '@/types'
import Link from 'next/link'

const CATEGORIES = {
  mercadolibre: { color: '#fbbf24', light: '#fef3c7', dot: '#fde68a', icon: '🛒', label: 'MercadoLibre' },
  content:      { color: '#8b5cf6', light: '#f5f3ff', dot: '#c4b5fd', icon: '🎬', label: 'Contenido' },
  stream:       { color: '#ef4444', light: '#fef2f2', dot: '#fca5a5', icon: '📡', label: 'Stream' },
  personal:     { color: '#10b981', light: '#f0fdf4', dot: '#6ee7b7', icon: '◉', label: 'Personal' },
  hazloCrecer:  { color: '#0ea5e9', light: '#f0f9ff', dot: '#7dd3fc', icon: '💼', label: 'HazloCrecer' },
}

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const { data: instances } = await supabase
        .from('daily_instances')
        .select('*, task:tasks(*)')

      const { data: tasks } = await supabase.from('tasks').select('*')

      if (!instances || !tasks) return

      const today = new Date()
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)

      const weekStartStr = weekStart.toISOString().split('T')[0]
      const todayStr = today.toISOString().split('T')[0]

      // Stats por semana (últimas 4 semanas)
      const weekStats = []
      for (let i = 3; i >= 0; i--) {
        const start = new Date(weekStart)
        start.setDate(start.getDate() - i * 7)
        const end = new Date(start)
        end.setDate(end.getDate() + 6)

        const startStr = start.toISOString().split('T')[0]
        const endStr = end.toISOString().split('T')[0]

        const weekInstances = instances.filter(inst => {
          const d = inst.date
          return d >= startStr && d <= endStr
        })

        const completed = weekInstances.filter(i => i.status === 'done').length
        const total = weekInstances.length

        weekStats.push({
          week: `${start.getDate()}/${start.getMonth() + 1}`,
          completed,
          total,
          pct: total ? Math.round(completed / total * 100) : 0,
        })
      }

      // Stats por categoría
      const categoryStats: any = {}
      Object.keys(CATEGORIES).forEach(cat => {
        const catTasks = tasks.filter((t: Task) => t.category === cat)
        const catInstances = instances.filter((i: any) => catTasks.find(t => t.id === i.task_id))
        categoryStats[cat] = {
          total: catInstances.length,
          completed: catInstances.filter((i: any) => i.status === 'done').length,
          pct: catInstances.length ? Math.round(catInstances.filter((i: any) => i.status === 'done').length / catInstances.length * 100) : 0,
        }
      })

      // Top tareas
      const taskCompletion: any = {}
      instances.forEach((inst: any) => {
        if (!inst.task) return
        if (!taskCompletion[inst.task_id]) {
          taskCompletion[inst.task_id] = { task: inst.task, completed: 0, total: 0 }
        }
        taskCompletion[inst.task_id].total++
        if (inst.status === 'done') taskCompletion[inst.task_id].completed++
      })

      const topTasks = Object.values(taskCompletion)
        .sort((a: any, b: any) => {
          const aPct = a.total ? a.completed / a.total : 0
          const bPct = b.total ? b.completed / b.total : 0
          return bPct - aPct
        })
        .slice(0, 5)

      // Total stats
      const totalCompleted = instances.filter(i => i.status === 'done').length
      const totalInstances = instances.length

      setStats({
        weekStats,
        categoryStats,
        topTasks,
        totalCompleted,
        totalInstances,
        overallPct: totalInstances ? Math.round(totalCompleted / totalInstances * 100) : 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 16px', position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                border: '4px solid #e5e7eb',
                borderTopColor: '#f97316',
                animation: 'spin 1s linear infinite',
              }}
            />
          </div>
          <p style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: 14 }}>Cargando analíticas...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#111', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '20px 28px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, color: '#111' }}>
              📊 Analíticas
            </h1>
            <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>Tu rendimiento en detalle</p>
          </div>
          <Link href="/" style={{ padding: '10px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13, boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}>
            ← Volver
          </Link>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px' }}>
        {/* OVERALL STAT */}
        <div
          style={{
            background: 'linear-gradient(135deg,#f97316,#fb923c)',
            borderRadius: 20,
            padding: '40px',
            marginBottom: 28,
            boxShadow: '0 8px 32px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, marginBottom: 8, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Productividad General
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
              <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-2px' }}>
                {stats.overallPct}%
              </div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                {stats.totalCompleted} de {stats.totalInstances} tareas completadas
              </div>
            </div>
          </div>
        </div>

        {/* WEEKLY STATS */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: '#111', letterSpacing: '-0.5px' }}>
            📈 Última 4 Semanas
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {stats.weekStats.map((week: any, idx: number) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  borderRadius: 16,
                  padding: '20px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(249,115,22,0.05)' }} />
                <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>
                  Semana {week.week}
                </p>
                <div style={{ marginBottom: 12, position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{week.completed}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f97316' }}>{week.pct}%</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${week.pct}%`,
                        background: 'linear-gradient(90deg,#f97316,#fb923c)',
                        borderRadius: 3,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORY STATS */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: '#111', letterSpacing: '-0.5px' }}>
            🎨 Por Categoría
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {Object.entries(stats.categoryStats).map(([catKey, catData]: any) => {
              const cat = CATEGORIES[catKey as keyof typeof CATEGORIES]
              return (
                <div
                  key={catKey}
                  style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: '20px',
                    border: `2px solid ${cat.dot}`,
                    boxShadow: `0 2px 8px ${cat.light}`,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: cat.light }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: 24 }}>{cat.icon}</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: cat.color }}>{cat.label}</h3>
                  </div>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>
                        {catData.completed} / {catData.total}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{catData.pct}%</span>
                    </div>
                    <div style={{ height: 8, background: cat.light, borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${catData.pct}%`,
                          background: cat.color,
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                          boxShadow: `0 0 12px ${cat.color}88`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* TOP TASKS */}
        {stats.topTasks.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16, color: '#111', letterSpacing: '-0.5px' }}>
              ⭐ Top Tareas
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {stats.topTasks.map((task: any, idx: number) => {
                const cat = CATEGORIES[task.task.category as keyof typeof CATEGORIES]
                const pct = task.total ? Math.round(task.completed / task.total * 100) : 0
                return (
                  <div
                    key={task.task.id}
                    style={{
                      background: '#fff',
                      borderRadius: 14,
                      padding: '16px',
                      border: `1px solid ${cat.dot}88`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: cat.light,
                      }}
                    />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: cat.light,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                        }}
                      >
                        {cat.icon}
                      </div>
                    </div>
                    <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 4 }}>
                        {idx + 1}. {task.task.title}
                      </p>
                      <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>
                        {task.completed} completadas de {task.total}
                      </p>
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: cat.color }}>
                        {pct}%
                      </div>
                      <div style={{ fontSize: 10, color: cat.color, fontWeight: 600 }}>Tasa</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
