/**
 * 领域模型与纯函数集合。
 * 这一层不依赖 Vue、不依赖浏览器 API，便于单元测试直接验证业务规则。
 */

export const STATUSES = [
  { id: 'todo', label: '待办' },
  { id: 'doing', label: '进行中' },
  { id: 'done', label: '完成' },
]

export const STATUS_IDS = STATUSES.map((s) => s.id)

export const PRIORITIES = [
  { id: 'high', label: '高' },
  { id: 'medium', label: '中' },
  { id: 'low', label: '低' },
]

export const PRIORITY_IDS = PRIORITIES.map((p) => p.id)

export const TITLE_MAX = 80
export const DESC_MAX = 300

export const DEFAULT_PRIORITY = 'medium'
export const DEFAULT_STATUS = 'todo'

export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function statusLabel(id) {
  return STATUSES.find((s) => s.id === id)?.label ?? id
}

export function priorityLabel(id) {
  return PRIORITIES.find((p) => p.id === id)?.label ?? id
}

/** 标题是唯一必填项；返回错误文案，通过则返回 null */
export function validateTitle(title) {
  const value = typeof title === 'string' ? title.trim() : ''
  if (!value) return '标题不能为空'
  if (value.length > TITLE_MAX) return `标题不能超过 ${TITLE_MAX} 个字符`
  return null
}

/** 组装一条新任务（不做副作用，也不落盘） */
export function createTask(input = {}) {
  const error = validateTitle(input.title)
  if (error) throw new Error(error)

  const now = Date.now()
  const description = typeof input.description === 'string' ? input.description.trim() : ''

  return {
    id: input.id ?? createId(),
    title: input.title.trim(),
    description: description.slice(0, DESC_MAX),
    status: STATUS_IDS.includes(input.status) ? input.status : DEFAULT_STATUS,
    priority: PRIORITY_IDS.includes(input.priority) ? input.priority : DEFAULT_PRIORITY,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  }
}

/** 宽松地修复一条来自 localStorage 的数据，脏数据返回 null 由调用方丢弃 */
export function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) return null

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    title: title.slice(0, TITLE_MAX),
    description:
      typeof raw.description === 'string' ? raw.description.slice(0, DESC_MAX) : '',
    status: STATUS_IDS.includes(raw.status) ? raw.status : DEFAULT_STATUS,
    priority: PRIORITY_IDS.includes(raw.priority) ? raw.priority : DEFAULT_PRIORITY,
    createdAt: Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now(),
    updatedAt: Number.isFinite(raw.updatedAt) ? raw.updatedAt : Date.now(),
  }
}

export function normalizeTaskList(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const result = []
  for (const item of value) {
    const task = normalizeTask(item)
    if (!task) continue
    // 去重，避免渲染时 key 冲突
    if (seen.has(task.id)) task.id = createId()
    seen.add(task.id)
    result.push(task)
  }
  return result
}

function indexOfTask(tasks, id) {
  return tasks.findIndex((t) => t.id === id)
}

/**
 * 移动任务到目标列。
 * beforeId 为 null 时追加到列尾；否则插入到该卡片之前（列内排序 / 跨列插入）。
 */
export function moveTask(tasks, id, toStatus, beforeId = null) {
  if (!STATUS_IDS.includes(toStatus)) return tasks
  const from = indexOfTask(tasks, id)
  if (from === -1) return tasks

  const moving = tasks[from]
  const rest = tasks.filter((t) => t.id !== id)

  let insertAt = rest.length
  if (beforeId) {
    const target = rest.findIndex((t) => t.id === beforeId)
    if (target !== -1) insertAt = target
  }

  const next = [...rest.slice(0, insertAt), { ...moving, status: toStatus, updatedAt: Date.now() }, ...rest.slice(insertAt)]

  // 位置与状态都没变化时返回原引用，避免多余的持久化写入
  const unchanged =
    moving.status === toStatus &&
    next.findIndex((t) => t.id === id) === from
  return unchanged ? tasks : next
}

/** 只允许更新这几个字段，标题留空则整次更新作废（返回原数组） */
export function updateTask(tasks, id, patch = {}) {
  const index = indexOfTask(tasks, id)
  if (index === -1) return tasks

  const current = tasks[index]
  const nextTitle = patch.title === undefined ? current.title : String(patch.title).trim()
  if (validateTitle(nextTitle)) return tasks

  const updated = {
    ...current,
    title: nextTitle,
    description:
      patch.description === undefined
        ? current.description
        : String(patch.description).trim().slice(0, DESC_MAX),
    priority: PRIORITY_IDS.includes(patch.priority) ? patch.priority : current.priority,
    status: STATUS_IDS.includes(patch.status) ? patch.status : current.status,
    updatedAt: Date.now(),
  }

  const next = [...tasks]
  next[index] = updated
  return next
}

export function deleteTask(tasks, id) {
  return tasks.filter((t) => t.id !== id)
}

export function countByStatus(tasks) {
  const counts = { todo: 0, doing: 0, done: 0 }
  for (const task of tasks) {
    if (counts[task.status] !== undefined) counts[task.status] += 1
  }
  return counts
}

/** 搜索标题 + 描述，并按优先级过滤；不改变原数组 */
export function filterTasks(tasks, { query = '', priority = 'all' } = {}) {
  const keyword = query.trim().toLowerCase()
  return tasks.filter((task) => {
    if (priority !== 'all' && task.priority !== priority) return false
    if (!keyword) return true
    return (
      task.title.toLowerCase().includes(keyword) ||
      task.description.toLowerCase().includes(keyword)
    )
  })
}

export function groupByStatus(tasks) {
  const groups = { todo: [], doing: [], done: [] }
  for (const task of tasks) {
    if (groups[task.status]) groups[task.status].push(task)
  }
  return groups
}
