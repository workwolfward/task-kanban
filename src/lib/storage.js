/**
 * 持久化层：唯一负责读写 localStorage 的地方。
 * 读失败（隐私模式、脏数据）时降级为空列表，不让页面白屏。
 */
import { normalizeTaskList } from './tasks.js'

const TASKS_KEY = 'kanban.tasks.v1'

function safeGet(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

export function loadTasks() {
  const raw = safeGet(TASKS_KEY)
  if (!raw) return []
  try {
    return normalizeTaskList(JSON.parse(raw))
  } catch {
    return []
  }
}

export function saveTasks(tasks) {
  return safeSet(TASKS_KEY, JSON.stringify(tasks))
}
