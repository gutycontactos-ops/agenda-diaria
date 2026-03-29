export type TaskType = 'fixed' | 'semifixed' | 'flexible' | 'personal'
export type TaskCategory = 'mercadolibre' | 'content' | 'stream' | 'personal' | 'hazloCrecer'
export type InstanceStatus = 'pending' | 'done' | 'skipped' | 'moved' | 'in_progress'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly'

export interface Task {
  id: string
  title: string
  type: TaskType
  time_slot: string | null
  days_of_week: number[] | null
  category: TaskCategory
  account: string | null
  is_locked: boolean
  color_label: string | null
  active: boolean
  sort_order: number
  description: string | null
  recurrence: Recurrence
}

export interface DailyInstance {
  id: string
  task_id: string
  date: string
  status: InstanceStatus
  skipped_reason: string | null
  moved_count: number
  completed_at: string | null
  notes: string | null
  attachment_url: string | null
  created_at: string
  task?: Task
}

export interface ReelIdea {
  id: string
  date: string
  guty_gg_idea: string | null
  zero_albillon_idea: string | null
  accepted_guty: boolean
  accepted_albillon: boolean
}

export interface StreamSchedule {
  id: string
  date: string
  confirmed: boolean
}
