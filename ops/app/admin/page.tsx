'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, StreamSchedule } from '@/types'
import { BottomNav } from '@/components/BottomNav'

export default function AdminPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [streams, setStreams] = useState<StreamSchedule[]>([])
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showTaskModal, setShowTaskModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .order('sort_order')

    const today = new Date().toISOString().split('T')[0]
    const weekStart = new Date()
    weekStart.setDate(new Date().getDate() - new Date().getDay() + 1)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const weekDates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      weekDates.push(d.toISOString().split('T')[0])
    }

    const { data: streamsData } = await supabase
      .from('stream_schedule')
      .select('*')
      .in('date', weekDates)

    setTasks(tasksData || [])
    setStreams(
      weekDates.map((date) => {
        const existing = streamsData?.find((s) => s.date === date)
        return existing || { id: '', date, confirmed: false }
      })
    )
  }

  const handleTaskToggle = async (task: Task) => {
    await supabase
      .from('tasks')
      .update({ active: !task.active })
      .eq('id', task.id)

    loadData()
  }

  const handleStreamToggle = async (stream: StreamSchedule) => {
    if (!stream.id) {
      const { data: newStream } = await supabase
        .from('stream_schedule')
        .insert({ date: stream.date, confirmed: true })
        .select()
        .single()

      if (newStream) {
        loadData()
      }
    } else {
      await supabase
        .from('stream_schedule')
        .update({ confirmed: !stream.confirmed })
        .eq('id', stream.id)

      loadData()
    }
  }

  const handleSaveTask = async () => {
    if (!editingTask) return

    if (editingTask.id) {
      await supabase
        .from('tasks')
        .update(editingTask)
        .eq('id', editingTask.id)
    } else {
      const { id: _id, ...taskData } = editingTask
      await supabase.from('tasks').insert(taskData)
    }

    setShowTaskModal(false)
    setEditingTask(null)
    loadData()
  }

  const handleDeleteTask = async (id: string) => {
    if (!confirm('¿Eliminar tarea?')) return

    await supabase.from('tasks').delete().eq('id', id)
    loadData()
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab']

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-24">
      <div className="p-5 max-w-2xl mx-auto">
        <h1 className="text-2xl font-mono font-bold text-[#6366f1] mb-7 tracking-wide">⚙️ GESTIÓN</h1>

        {/* STREAMS */}
        <div className="mb-8">
          <h2 className="text-sm font-mono font-bold text-[#1a1a2e] mb-4 tracking-wide">📡 STREAMS SEMANA</h2>
          <div className="grid grid-cols-7 gap-2">
            {streams.map((stream) => {
              const dayOfWeek = new Date(stream.date + 'T12:00:00').getDay()
              return (
                <button
                  key={stream.date}
                  onClick={() => handleStreamToggle(stream)}
                  className={`aspect-square flex items-center justify-center rounded-lg text-xs font-mono font-bold transition-all shadow-sm ${
                    stream.confirmed
                      ? 'bg-green-500 text-white border-2 border-green-600'
                      : 'bg-white text-[#6b7280] border-2 border-[#e5e7eb] hover:border-[#d1d5db]'
                  }`}
                >
                  {dayNames[dayOfWeek]}
                </button>
              )
            })}
          </div>
        </div>

        {/* TAREAS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-bold text-[#1a1a2e] tracking-wide">📋 TAREAS</h2>
            <button
              onClick={() => {
                setEditingTask({
                  id: '',
                  title: '',
                  type: 'fixed',
                  time_slot: null,
                  days_of_week: null,
                  category: 'personal',
                  account: null,
                  is_locked: false,
                  color_label: null,
                  active: true,
                  sort_order: tasks.length,
                  description: null,
                  recurrence: 'none',
                })
                setShowTaskModal(true)
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs text-white font-semibold transition-colors"
            >
              + Nueva
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-lg bg-white border border-[#e5e7eb] flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="font-mono text-sm font-semibold text-[#1a1a2e]">{task.title}</div>
                  <div className="text-xs text-[#6b7280] mt-1 flex gap-2">
                    <span>{task.type}</span>
                    <span>•</span>
                    <span>{task.category}</span>
                    {task.time_slot && (
                      <>
                        <span>•</span>
                        <span>{task.time_slot}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-3">
                  <button
                    onClick={() => handleTaskToggle(task)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      task.active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-[#f5f5f7] text-[#6b7280] hover:bg-[#e5e7eb]'
                    }`}
                  >
                    {task.active ? '✓' : '✗'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingTask(task)
                      setShowTaskModal(true)
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#f5f5f7] hover:bg-[#e5e7eb] text-xs text-[#6b7280] font-semibold transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-xs text-red-700 font-semibold transition-colors"
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showTaskModal && editingTask && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-xl">
            <h3 className="font-mono font-bold text-[#6366f1] mb-5 text-lg">
              {editingTask.id ? 'Editar Tarea' : 'Nueva Tarea'}
            </h3>

            <div className="space-y-3">
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                placeholder="Título"
                className="w-full px-3 py-2.5 rounded-lg bg-[#f5f5f7] border border-[#e5e7eb] text-[#1a1a2e] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <select
                value={editingTask.type}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, type: e.target.value as any })
                }
                className="w-full px-3 py-2.5 rounded-lg bg-[#f5f5f7] border border-[#e5e7eb] text-[#1a1a2e] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>fixed</option>
                <option>semifixed</option>
                <option>flexible</option>
                <option>personal</option>
              </select>

              <input
                type="time"
                value={editingTask.time_slot || ''}
                onChange={(e) => setEditingTask({ ...editingTask, time_slot: e.target.value })}
                placeholder="Hora"
                className="w-full px-3 py-2.5 rounded-lg bg-[#f5f5f7] border border-[#e5e7eb] text-[#1a1a2e] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <select
                value={editingTask.category}
                onChange={(e) =>
                  setEditingTask({ ...editingTask, category: e.target.value as any })
                }
                className="w-full px-3 py-2.5 rounded-lg bg-[#f5f5f7] border border-[#e5e7eb] text-[#1a1a2e] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>mercadolibre</option>
                <option>content</option>
                <option>stream</option>
                <option>personal</option>
                <option>hazloCrecer</option>
              </select>

              <select
                value={editingTask.account || ''}
                onChange={(e) => setEditingTask({ ...editingTask, account: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg bg-[#f5f5f7] border border-[#e5e7eb] text-[#1a1a2e] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Ninguno</option>
                <option>guty_gg</option>
                <option>0albillon</option>
                <option>ambos</option>
              </select>

              <label className="flex items-center gap-3 text-sm text-[#6b7280] cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingTask.is_locked}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, is_locked: e.target.checked })
                  }
                  className="rounded w-4 h-4 accent-indigo-600"
                />
                Bloqueada
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveTask}
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setShowTaskModal(false)
                  setEditingTask(null)
                }}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#f5f5f7] text-[#6b7280] font-semibold text-sm hover:bg-[#e5e7eb] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  )
}
