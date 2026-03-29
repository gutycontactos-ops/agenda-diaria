'use client'

import { useEffect, useState, useRef } from 'react'
import { DailyInstance, Task } from '@/types'
import { supabase } from '@/lib/supabase'
import { generateDailyInstances, updateInstanceStatus, moveToTomorrow } from '@/lib/task-engine'
import { BottomNav } from '@/components/BottomNav'

const CATEGORIES = {
  mercadolibre: { color: '#fbbf24', light: '#fef3c7', dot: '#fde68a', icon: '🛒', label: 'MercadoLibre' },
  content:      { color: '#8b5cf6', light: '#f5f3ff', dot: '#c4b5fd', icon: '🎬', label: 'Contenido' },
  stream:       { color: '#ef4444', light: '#fef2f2', dot: '#fca5a5', icon: '📡', label: 'Stream' },
  personal:     { color: '#10b981', light: '#f0fdf4', dot: '#6ee7b7', icon: '◉', label: 'Personal' },
  hazloCrecer:  { color: '#0ea5e9', light: '#f0f9ff', dot: '#7dd3fc', icon: '💼', label: 'HazloCrecer' },
}

const DAYS_SHORT = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']
const DAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function getWeekDates(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function TodayClient() {
  const today = new Date()
  const [weekStart, setWeekStart] = useState(getMonday(today))
  const [instances, setInstances] = useState<(DailyInstance & { task?: Task })[]>([])
  const [loading, setLoading] = useState(true)
  const [timeStr, setTimeStr] = useState('')
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768)
  const [activeDayIdx, setActiveDayIdx] = useState(() => {
    const mon = getMonday(new Date())
    const todayD = new Date()
    const diff = Math.round((todayD.getTime() - mon.getTime()) / 86400000)
    return Math.max(0, Math.min(6, diff))
  })
  const [modal, setModal] = useState<number | null>(null)
  const [editingInstance, setEditingInstance] = useState<(DailyInstance & { task?: Task }) | null>(null)
  const [formData, setFormData] = useState({ title: '', time: '', cat: 'personal' as any, dayIdx: 0, selectedDate: '', description: '', recurrence: 'none' as any })
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const touchStartX = useRef<number | null>(null)

  // Clock effect
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setTimeStr(n.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Load week data
  useEffect(() => {
    loadWeekData()
  }, [weekStart])

  const loadWeekData = async () => {
    try {
      setLoading(true)
      const weekDates = getWeekDates(weekStart)
      const weekDateStrings = weekDates.map(dateKey)

      // Generate instances for all days
      await Promise.all(weekDateStrings.map(d => generateDailyInstances(d)))

      // Load instances
      const { data: dailyInstances } = await supabase
        .from('daily_instances')
        .select('*, task:tasks(*)')
        .in('date', weekDateStrings)
        .order('task(time_slot)', { ascending: true })
        .order('task(sort_order)')

      setInstances(dailyInstances || [])
    } catch (error) {
      console.error('Error loading week data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDone = async (instance: DailyInstance & { task?: Task }) => {
    const isDone = instance.status === 'done'
    const newStatus = isDone ? 'pending' : 'done'

    const updated = instances.map(inst =>
      inst.id === instance.id ? { ...inst, status: newStatus } : inst
    )
    setInstances(updated)

    await updateInstanceStatus(instance.id, newStatus)
  }

  const handleMove = async (instanceId: string) => {
    const updated = instances.filter(inst => inst.id !== instanceId)
    setInstances(updated)
    await moveToTomorrow(instanceId)
  }

  const handleSkip = async (instanceId: string) => {
    const updated = instances.filter(inst => inst.id !== instanceId)
    setInstances(updated)
    await updateInstanceStatus(instanceId, 'skipped', { skipped_reason: 'manual' })
  }

  const openCreateModal = (dayIdx: number) => {
    setModal(dayIdx)
    setEditingInstance(null)
    setFormData({ title: '', time: '', cat: 'personal', dayIdx, selectedDate: dateKey(weekDates[dayIdx]), description: '', recurrence: 'none' })
  }

  const openEditModal = (inst: DailyInstance & { task?: Task }) => {
    setEditingInstance(inst)
    setModal(null)
    if (inst.task) {
      const dayIdx = weekDates.findIndex(d => dateKey(d) === inst.date)
      setFormData({
        title: inst.task.title,
        time: inst.task.time_slot || '',
        cat: inst.task.category,
        dayIdx: dayIdx >= 0 ? dayIdx : 0,
        selectedDate: inst.date,
        description: inst.task.description || '',
        recurrence: inst.task.recurrence || 'none',
      })
    }
  }

  const closeModal = () => {
    setModal(null)
    setEditingInstance(null)
    setFormData({ title: '', time: '', cat: 'personal', dayIdx: 0, selectedDate: '', description: '', recurrence: 'none' })
  }

  const handleSaveTask = async () => {
    if (!formData.title.trim() || !formData.selectedDate) return

    try {
      if (editingInstance && editingInstance.task) {
        // Edit mode: update task + maybe move to another day
        const oldDate = editingInstance.date

        const { error: updateError } = await supabase.from('tasks').update({
          title: formData.title,
          time_slot: formData.time || null,
          category: formData.cat,
          description: formData.description || null,
          recurrence: formData.recurrence,
        }).eq('id', editingInstance.task_id)

        if (updateError) throw updateError

        // If day changed, update the instance date
        if (formData.selectedDate !== oldDate) {
          const { error: dateError } = await supabase.from('daily_instances').update({
            date: formData.selectedDate,
          }).eq('id', editingInstance.id)
          if (dateError) throw dateError
        }
      } else if (modal !== null) {
        // Create mode: insert task + instance
        const { data: tasks, error: insertError } = await supabase.from('tasks').insert({
          title: formData.title,
          type: 'flexible',
          time_slot: formData.time || null,
          category: formData.cat,
          active: false,
          sort_order: 999,
          is_locked: false,
          days_of_week: null,
          account: null,
          color_label: null,
          description: formData.description || null,
          recurrence: formData.recurrence,
        }).select()

        if (insertError) {
          console.error('Insert error details:', insertError)
          throw new Error(`Error al crear tarea: ${insertError.message}`)
        }

        if (!tasks || tasks.length === 0) {
          throw new Error('La tarea se creó pero no se pudo leer. Intenta recargar.')
        }

        const task = tasks[0]

        const { error: instanceError } = await supabase.from('daily_instances').insert({
          task_id: task.id,
          date: formData.selectedDate,
          status: 'pending',
          moved_count: 0,
        })

        if (instanceError) {
          console.error('Instance insert error:', instanceError)
          throw new Error(`Error al agendar: ${instanceError.message}`)
        }
      }

      await loadWeekData()
      closeModal()
    } catch (error) {
      console.error('Error saving task:', error)
      alert(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const handleDeleteTask = async () => {
    if (!editingInstance) return

    try {
      await supabase.from('daily_instances').delete().eq('id', editingInstance.id)
      await loadWeekData()
      closeModal()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const weekDates = getWeekDates(weekStart)
  const wKey = weekStart.getTime()

  const pctOf = (di: number) => {
    const dayInstances = instances.filter(inst => inst.date === dateKey(weekDates[di]))
    if (!dayInstances.length) return 0
    return Math.round(dayInstances.filter(i => i.status === 'done').length / dayInstances.length * 100)
  }

  const totalT = instances.length
  const totalD = instances.filter(i => i.status === 'done').length
  const weekPct = totalT ? Math.round(totalD / totalT * 100) : 0

  const weekLabel = () => {
    const s = weekDates[0]
    const e = weekDates[6]
    return `${s.getDate()} ${MONTHS[s.getMonth()]} — ${e.getDate()} ${MONTHS[e.getMonth()]} ${e.getFullYear()}`
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) {
      if (dx < 0 && activeDayIdx < 6) setActiveDayIdx(i => i + 1)
      if (dx > 0 && activeDayIdx > 0) setActiveDayIdx(i => i - 1)
    }
    touchStartX.current = null
  }

  // Task Column Component
  const TaskColumn = ({ di, fullWidth }: { di: number; fullWidth: boolean }) => {
    const date = weekDates[di]
    const isToday = dateKey(date) === dateKey(today)
    const dKey = dateKey(date)
    const dTasks = instances
      .filter(inst => inst.date === dKey)
      .filter(inst => !filterCategory || inst.task?.category === filterCategory)
      .sort((a, b) => {
        const aTime = a.task?.time_slot
        const bTime = b.task?.time_slot
        // Sin hora al final
        if (!aTime && !bTime) return 0
        if (!aTime) return 1
        if (!bTime) return -1
        // Comparar horas ascendentes (mañana a noche)
        return aTime.localeCompare(bTime)
      })
    const pct = pctOf(di)

    return (
      <div
        style={{
          ...(fullWidth
            ? { flex: 1, padding: '16px 16px 100px' }
            : { borderRight: di < 6 ? '1px solid #f0f0f0' : 'none', padding: '16px 10px 24px', minHeight: 500 }),
          background: isToday && !fullWidth ? '#fff' : fullWidth ? '#fafafa' : 'transparent',
          position: 'relative',
        }}
      >
        {isToday && !fullWidth && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#f97316,#fb923c)' }} />
        )}

        {!fullWidth && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: isToday ? '#f97316' : '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>
                  {DAYS_SHORT[di]}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: isToday ? '#111' : '#374151', letterSpacing: '-1px' }}>
                  {date.getDate()}
                </div>
                <div style={{ fontSize: 9, color: isToday ? '#d1d5db' : '#6b7280', fontWeight: 500, marginTop: 2 }}>
                  {MONTHS[date.getMonth()].slice(0, 3)}
                </div>
              </div>
              {dTasks.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color: pct === 100 ? '#10b981' : pct > 0 ? '#f97316' : '#9ca3af', marginTop: 4 }}>
                  {pct}%
                </span>
              )}
            </div>
            <div style={{ height: 2, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: pct === 100 ? 'linear-gradient(90deg,#10b981,#0ea5e9)' : 'linear-gradient(90deg,#f97316,#fb923c)',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: fullWidth ? 8 : 5 }}>
          {dTasks.length === 0 && fullWidth && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#e5e7eb' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Día libre</div>
            </div>
          )}

          {dTasks.map(inst => {
            const task = inst.task
            if (!task) return null

            const cat = CATEGORIES[task.category as keyof typeof CATEGORIES] || CATEGORIES.personal
            const taskDone = inst.status === 'done'

            return (
              <div
                key={inst.id}
                draggable
                onDragStart={() => setDraggedTask(inst.id)}
                onDragEnd={() => setDraggedTask(null)}
                onDragOver={e => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault()
                  if (draggedTask && draggedTask !== inst.id) {
                    const draggedInst = instances.find(i => i.id === draggedTask)
                    if (draggedInst) {
                      await supabase.from('daily_instances').update({
                        date: inst.date,
                      }).eq('id', draggedTask)
                      await loadWeekData()
                    }
                  }
                }}
                style={{
                  borderRadius: fullWidth ? 12 : 10,
                  padding: fullWidth ? '12px 14px 11px' : '9px 10px 8px',
                  background: draggedTask === inst.id ? '#f0f0f0' : (taskDone ? '#fafafa' : '#fff'),
                  border: `1px solid ${taskDone ? '#e5e7eb' : cat.dot + '88'}`,
                  boxShadow: taskDone ? 'none' : (draggedTask === inst.id ? '0 2px 8px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.04)'),
                  opacity: taskDone ? 0.7 : 1,
                  position: 'relative',
                  transition: 'box-shadow 0.18s,transform 0.18s',
                  cursor: 'grab',
                }}
              >
                {!taskDone && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: fullWidth ? 8 : 6,
                      bottom: fullWidth ? 8 : 6,
                      width: 3,
                      borderRadius: '0 2px 2px 0',
                      background: cat.color,
                      opacity: 0.6,
                    }}
                  />
                )}

                {task.type === 'fixed' && !taskDone && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: 8,
                      background: cat.light,
                      border: `1px solid ${cat.dot}`,
                      color: cat.color,
                      fontSize: 8,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 20,
                      letterSpacing: '0.5px',
                    }}
                  >
                    fijo
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: fullWidth ? 10 : 8, paddingLeft: 6 }}>
                  <button
                    onClick={() => handleToggleDone(inst)}
                    style={{
                      width: fullWidth ? 18 : 16,
                      height: fullWidth ? 18 : 16,
                      borderRadius: '50%',
                      flexShrink: 0,
                      marginTop: 2,
                      background: taskDone ? cat.color : '#fff',
                      border: `1.5px solid ${taskDone ? cat.color : cat.dot}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: taskDone ? `0 0 0 3px ${cat.light}` : 'none',
                      transition: 'all 0.16s',
                    }}
                  >
                    {taskDone && '✓'}
                  </button>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {task.time_slot && (
                      <div style={{ fontSize: fullWidth ? 11 : 10, fontWeight: 700, color: cat.color, marginBottom: 2, letterSpacing: '0.3px' }}>
                        {task.time_slot}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: fullWidth ? 13 : 11,
                        fontWeight: 600,
                        color: taskDone ? '#d1d5db' : '#374151',
                        textDecoration: taskDone ? 'line-through' : 'none',
                        lineHeight: 1.4,
                      }}
                    >
                      <span style={{ marginRight: 5, opacity: 0.5, fontSize: fullWidth ? 12 : 10 }}>{cat.icon}</span>
                      {task.title}
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(inst)}
                    style={{
                      flexShrink: 0,
                      background: 'none',
                      border: 'none',
                      color: '#9ca3af',
                      cursor: 'pointer',
                      fontSize: 14,
                      padding: '4px',
                      marginTop: -2,
                    }}
                    title="Editar"
                  >
                    ✎
                  </button>
                </div>

                {!task.is_locked && inst.status !== 'done' && (fullWidth || false) && (
                  <div style={{ display: 'flex', gap: 5, marginTop: fullWidth ? 10 : 7, paddingLeft: fullWidth ? 28 : 22 }}>
                    {di < 6 && (
                      <button
                        onClick={() => handleMove(inst.id)}
                        style={{
                          background: '#f0f9ff',
                          border: '1px solid #bae6fd',
                          color: '#0ea5e9',
                          borderRadius: 6,
                          fontSize: fullWidth ? 11 : 10,
                          fontWeight: 600,
                          padding: fullWidth ? '4px 10px' : '3px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        → mañana
                      </button>
                    )}
                    <button
                      onClick={() => handleSkip(inst.id)}
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#ef4444',
                        borderRadius: 6,
                        fontSize: fullWidth ? 11 : 10,
                        fontWeight: 600,
                        padding: fullWidth ? '4px 10px' : '3px 8px',
                        cursor: 'pointer',
                      }}
                    >
                      saltar
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          <button
            onClick={() => openCreateModal(di)}
            style={{
              width: '100%',
              padding: fullWidth ? '10px' : '7px',
              borderRadius: fullWidth ? 10 : 8,
              border: '1.5px dashed #9ca3af',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: fullWidth ? 12 : 11,
              color: '#6b7280',
              fontWeight: 600,
              letterSpacing: '0.5px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget as HTMLElement).style.borderColor = '#6b7280'
              ;(e.currentTarget as HTMLElement).style.color = '#374151'
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLElement).style.borderColor = '#9ca3af'
              ;(e.currentTarget as HTMLElement).style.color = '#6b7280'
            }}
          >
            + agregar
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
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
          <p style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: 14 }}>Cargando semana...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#111', fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ padding: isMobile ? '12px 16px' : '16px 28px', display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, flexWrap: 'wrap' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  width: isMobile ? 36 : 40,
                  height: isMobile ? 36 : 40,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg,#f97316,#fb923c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isMobile ? 15 : 17,
                  fontWeight: 800,
                  color: '#fff',
                  boxShadow: '0 2px 12px rgba(249,115,22,0.35)',
                }}
              >
                G
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #fff',
                }}
              />
            </div>
            {!isMobile && (
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', color: '#111' }}>
                  gutty_gg
                </div>
                <div style={{ fontSize: 10, color: '#c4c4c4', fontWeight: 500, marginTop: 1, letterSpacing: '0.5px' }}>
                  Creator Dashboard
                </div>
              </div>
            )}
          </div>

          {isMobile ? (
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{DAYS_FULL[activeDayIdx]}</div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                {weekDates[activeDayIdx]?.getDate()} {MONTHS[weekDates[activeDayIdx]?.getMonth()]}
              </div>
            </div>
          ) : (
            <>
              <div style={{ width: 1, height: 28, background: '#f0f0f0', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, letterSpacing: '1px', fontVariantNumeric: 'tabular-nums' }}>
                {timeStr}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  style={{
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    fontSize: 18,
                    color: '#d1d5db',
                    padding: '4px 10px',
                    borderRadius: 6,
                  }}
                  onClick={() => {
                    const d = new Date(weekStart)
                    d.setDate(d.getDate() - 7)
                    setWeekStart(getMonday(d))
                  }}
                >
                  ‹
                </button>
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, minWidth: 220, textAlign: 'center' }}>
                  {weekLabel()}
                </span>
                <button
                  style={{
                    cursor: 'pointer',
                    background: 'none',
                    border: 'none',
                    fontSize: 18,
                    color: '#d1d5db',
                    padding: '4px 10px',
                    borderRadius: 6,
                  }}
                  onClick={() => {
                    const d = new Date(weekStart)
                    d.setDate(d.getDate() + 7)
                    setWeekStart(getMonday(d))
                  }}
                >
                  ›
                </button>
                <button
                  onClick={() => setWeekStart(getMonday(today))}
                  style={{
                    background: 'none',
                    border: '1px solid #e5e7eb',
                    color: '#9ca3af',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Hoy
                </button>
              </div>
            </>
          )}

          {/* Right side */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, background: '#fef2f2', border: '1px solid #fecaca' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 0 2px #fca5a544' }} />
              {!isMobile && <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>Stream · 22:00</span>}
            </div>

            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#111', lineHeight: 1, letterSpacing: '-0.5px' }}>
                    {totalD}
                    <span style={{ color: '#d1d5db', fontSize: 14, fontWeight: 500 }}>/{totalT}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#d1d5db', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 600, marginTop: 1 }}>
                    esta semana
                  </div>
                </div>
                <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                    <circle cx="20" cy="20" r="16" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="3"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      strokeDashoffset={`${2 * Math.PI * 16 * (1 - weekPct / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#f97316' }}>
                    {weekPct}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isMobile && (
          <div style={{ padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Week nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  color: '#d1d5db',
                  cursor: 'pointer',
                  padding: '2px 8px',
                }}
                onClick={() => {
                  const d = new Date(weekStart)
                  d.setDate(d.getDate() - 7)
                  setWeekStart(getMonday(d))
                  setActiveDayIdx(0)
                }}
              >
                ‹ sem anterior
              </button>
              <span style={{ fontSize: 10, color: '#c4c4c4', fontWeight: 600 }}>{weekLabel()}</span>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 16,
                  color: '#d1d5db',
                  cursor: 'pointer',
                  padding: '2px 8px',
                }}
                onClick={() => {
                  const d = new Date(weekStart)
                  d.setDate(d.getDate() + 7)
                  setWeekStart(getMonday(d))
                  setActiveDayIdx(0)
                }}
              >
                sem siguiente ›
              </button>
            </div>

            {/* Day selector dots */}
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {DAYS_SHORT.map((dl, di) => {
                const date = weekDates[di]
                const isToday = dateKey(date) === dateKey(today)
                const active = activeDayIdx === di
                const pct = pctOf(di)

                return (
                  <div
                    key={di}
                    onClick={() => setActiveDayIdx(di)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                      padding: '6px 2px',
                      borderRadius: 10,
                      background: active ? '#fff' : 'transparent',
                      boxShadow: active ? '0 1px 6px rgba(0,0,0,0.08)' : 'none',
                      border: active ? '1px solid #f0f0f0' : '1px solid transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 8, fontWeight: 700, color: active ? (isToday ? '#f97316' : '#374151') : isToday ? '#fed7aa' : '#d1d5db', letterSpacing: '1px' }}>
                      {dl}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: active ? (isToday ? '#f97316' : '#111') : '#d1d5db', lineHeight: 1 }}>
                      {date.getDate()}
                    </div>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: pct === 100 ? '#10b981' : pct > 0 ? '#f97316' : '#e5e7eb' }} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Category pills - desktop only */}
        {!isMobile && (
          <div style={{ padding: '0 28px 12px', display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setFilterCategory(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 20,
                background: filterCategory === null ? '#111' : '#f3f4f6',
                border: `1px solid ${filterCategory === null ? '#111' : '#e5e7eb'}`,
                fontSize: 10,
                color: filterCategory === null ? '#fff' : '#6b7280',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              ✓ Todas
            </button>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setFilterCategory(filterCategory === k ? null : k)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: filterCategory === k ? v.color : v.light,
                  border: `1px solid ${v.dot}`,
                  fontSize: 10,
                  color: filterCategory === k ? '#fff' : v.color,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span>{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      {isMobile ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {/* Progress bar */}
          <div style={{ padding: '12px 16px 0', background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Progreso del día</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: pctOf(activeDayIdx) === 100 ? '#10b981' : '#f97316' }}>
                {pctOf(activeDayIdx)}%
              </span>
            </div>
            <div style={{ height: 3, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden', marginBottom: 12 }}>
              <div
                style={{
                  height: '100%',
                  width: `${pctOf(activeDayIdx)}%`,
                  background: pctOf(activeDayIdx) === 100 ? 'linear-gradient(90deg,#10b981,#0ea5e9)' : 'linear-gradient(90deg,#f97316,#fb923c)',
                  borderRadius: 2,
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
            {/* Category legend mobile */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingBottom: 12 }}>
              {Object.entries(CATEGORIES).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: '2px 8px',
                    borderRadius: 20,
                    background: v.light,
                    border: `1px solid ${v.dot}`,
                    fontSize: 9,
                    color: v.color,
                    fontWeight: 700,
                  }}
                >
                  <span>{v.icon}</span>
                  {v.label}
                </div>
              ))}
            </div>
          </div>

          <TaskColumn di={activeDayIdx} fullWidth={true} />

          {/* Mobile nav arrows */}
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #f0f0f0', padding: '10px 16px', display: 'flex', gap: 10, zIndex: 15, boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
            <button
              onClick={() => setActiveDayIdx(i => Math.max(0, i - 1))}
              disabled={activeDayIdx === 0}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 12,
                border: '1px solid #f0f0f0',
                background: activeDayIdx === 0 ? '#fafafa' : '#fff',
                color: activeDayIdx === 0 ? '#e5e7eb' : '#374151',
                fontWeight: 700,
                fontSize: 13,
                cursor: activeDayIdx === 0 ? 'default' : 'pointer',
              }}
            >
              ← {activeDayIdx > 0 ? DAYS_FULL[activeDayIdx - 1] : ''}
            </button>
            <a
              href="/admin"
              style={{
                width: 52,
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg,#f97316,#fb923c)',
                color: '#fff',
                fontSize: 20,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              +
            </a>
            <button
              onClick={() => setActiveDayIdx(i => Math.min(6, i + 1))}
              disabled={activeDayIdx === 6}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 12,
                border: '1px solid #f0f0f0',
                background: activeDayIdx === 6 ? '#fafafa' : '#fff',
                color: activeDayIdx === 6 ? '#e5e7eb' : '#374151',
                fontWeight: 700,
                fontSize: 13,
                cursor: activeDayIdx === 6 ? 'default' : 'pointer',
              }}
            >
              {activeDayIdx < 6 ? DAYS_FULL[activeDayIdx + 1] : ''} →
            </button>
          </div>
        </div>
      ) : (
        // Desktop: 7-col grid
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#fafafa', overflow: 'auto' }}>
          {DAYS_SHORT.map((_, di) => (
            <TaskColumn key={di} di={di} fullWidth={false} />
          ))}
        </div>
      )}

      {/* MODAL DE CREAR/EDITAR TAREA */}
      {(modal !== null || editingInstance !== null) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            zIndex: 200,
            backdropFilter: 'blur(4px)',
          }}
          onClick={e => e.target === e.currentTarget && closeModal()}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: isMobile ? '20px 20px 0 0' : 20,
              padding: 28,
              width: isMobile ? '100%' : 380,
              boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
              border: '1px solid #f0f0f0',
            }}
          >
            {isMobile && (
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: '#e5e7eb',
                  margin: '0 auto 20px',
                }}
              />
            )}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 10,
                  color: '#d1d5db',
                  fontWeight: 600,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: 5,
                }}
              >
                {editingInstance ? 'Editar Tarea' : 'Nueva Tarea'}
              </div>
              {formData.selectedDate && (
                <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>
                  📅 {new Date(formData.selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                autoFocus
                placeholder="¿Qué vas a hacer?"
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSaveTask()}
                style={{
                  background: '#fafafa',
                  border: '1.5px solid #f0f0f0',
                  color: '#111',
                  padding: '11px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  transition: 'border-color 0.15s',
                  outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = '#f97316')}
                onBlur={e => (e.target.style.borderColor = '#f0f0f0')}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <select
                  value={formData.time}
                  onChange={e => setFormData(p => ({ ...p, time: e.target.value }))}
                  style={{
                    background: '#fafafa',
                    border: '1.5px solid #f0f0f0',
                    color: '#6b7280',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    outline: 'none',
                    maxHeight: '200px',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#f97316')}
                  onBlur={e => (e.target.style.borderColor = '#f0f0f0')}
                >
                  <option value="">Sin hora</option>
                  {Array.from({ length: 24 }, (_, h) => {
                    const hour = String(h).padStart(2, '0')
                    return (
                      <option key={h} value={`${hour}:00`}>
                        {hour}:00
                      </option>
                    )
                  })}
                </select>
                <select
                  value={formData.cat}
                  onChange={e => setFormData(p => ({ ...p, cat: e.target.value }))}
                  style={{
                    background: '#fafafa',
                    border: '1.5px solid #f0f0f0',
                    color: '#374151',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#f97316')}
                  onBlur={e => (e.target.style.borderColor = '#f0f0f0')}
                >
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {v.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  type="date"
                  value={formData.selectedDate}
                  onChange={e => setFormData(p => ({ ...p, selectedDate: e.target.value }))}
                  style={{
                    background: '#fafafa',
                    border: '1.5px solid #f0f0f0',
                    color: '#374151',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#f97316')}
                  onBlur={e => (e.target.style.borderColor = '#f0f0f0')}
                />
                <select
                  value={formData.recurrence}
                  onChange={e => setFormData(p => ({ ...p, recurrence: e.target.value }))}
                  style={{
                    background: '#fafafa',
                    border: '1.5px solid #f0f0f0',
                    color: '#374151',
                    padding: '10px 12px',
                    borderRadius: 10,
                    fontSize: 13,
                    outline: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#f97316')}
                  onBlur={e => (e.target.style.borderColor = '#f0f0f0')}
                >
                  <option value="none">Sin repetición</option>
                  <option value="daily">Diaria</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>

              <textarea
                placeholder="Notas (opcional)..."
                value={formData.description}
                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                style={{
                  background: '#fafafa',
                  border: '1.5px solid #f0f0f0',
                  color: '#111',
                  padding: '11px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  transition: 'border-color 0.15s',
                  outline: 'none',
                  minHeight: 80,
                  resize: 'vertical',
                }}
                onFocus={e => (e.target.style.borderColor = '#f97316')}
                onBlur={e => (e.target.style.borderColor = '#f0f0f0')}
              />

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={closeModal}
                  style={{
                    flex: 1,
                    background: '#fafafa',
                    border: '1.5px solid #f0f0f0',
                    color: '#9ca3af',
                    padding: '12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Cancelar
                </button>
                {editingInstance && (
                  <button
                    onClick={handleDeleteTask}
                    style={{
                      flex: 1,
                      background: '#fef2f2',
                      border: '1.5px solid #fecaca',
                      color: '#ef4444',
                      padding: '12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Eliminar
                  </button>
                )}
                <button
                  onClick={handleSaveTask}
                  style={{
                    flex: editingInstance ? 1 : 2,
                    background: 'linear-gradient(135deg,#f97316,#fb923c)',
                    border: 'none',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                  }}
                >
                  {editingInstance ? 'Actualizar' : 'Agregar'} tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
