import { supabase } from './supabase'

export async function generateDailyInstances(date: string) {
  const dayOfWeek = new Date(date + 'T12:00:00').getDay()

  const { data: existing } = await supabase
    .from('daily_instances')
    .select('id')
    .eq('date', date)
    .limit(1)

  if (existing && existing.length > 0) return

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('active', true)
    .order('sort_order')

  if (!tasks) return

  const { data: streamDay } = await supabase
    .from('stream_schedule')
    .select('confirmed')
    .eq('date', date)
    .single()

  const instancesToCreate = []

  for (const task of tasks) {
    if (task.days_of_week && task.days_of_week.length > 0) {
      if (!task.days_of_week.includes(dayOfWeek)) continue
    }

    if (task.category === 'stream') {
      if (!streamDay?.confirmed) continue
    }

    instancesToCreate.push({
      task_id: task.id,
      date: date,
      status: 'pending',
      moved_count: 0,
    })
  }

  if (instancesToCreate.length > 0) {
    await supabase.from('daily_instances').insert(instancesToCreate)
  }
}

export async function moveToTomorrow(instanceId: string) {
  const { data: instance } = await supabase
    .from('daily_instances')
    .select('*, task:tasks(*)')
    .eq('id', instanceId)
    .single()

  if (!instance) return

  await supabase
    .from('daily_instances')
    .update({ status: 'moved' })
    .eq('id', instanceId)

  const tomorrow = new Date(instance.date + 'T12:00:00')
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('daily_instances')
    .select('id, moved_count')
    .eq('task_id', instance.task_id)
    .eq('date', tomorrowStr)
    .single()

  if (existing) {
    await supabase
      .from('daily_instances')
      .update({ moved_count: existing.moved_count + 1, status: 'pending' })
      .eq('id', existing.id)
  } else {
    await supabase.from('daily_instances').insert({
      task_id: instance.task_id,
      date: tomorrowStr,
      status: 'pending',
      moved_count: instance.moved_count + 1,
    })
  }
}

export async function updateInstanceStatus(
  instanceId: string,
  status: string,
  extra?: { skipped_reason?: string; notes?: string; attachment_url?: string }
) {
  await supabase
    .from('daily_instances')
    .update({
      status,
      ...(status === 'done' && { completed_at: new Date().toISOString() }),
      ...extra,
    })
    .eq('id', instanceId)
}
