/**
 * 持久化层：唯一负责读写 localStorage 的地方。
 * 读失败（隐私模式、脏数据）时降级为空列表 / 系统主题，不让页面白屏。
 */
import { normalizeTaskList } from './tasks.js'

const TASKS_KEY = 'kanban.tasks.v1'
const THEME_KEY = 'kanban.theme'
export const THEME_SOURCE_KEY = 'kanban.theme.source'

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

/** 返回 'light' | 'dark' | null（null 表示用户还没手动选过） */
export function loadTheme() {
  const value = safeGet(THEME_KEY)
  return value === 'light' || value === 'dark' ? value : null
}

/** 演示 / 截图用：?theme=light|dark 可临时覆盖主题，但不写入存储 */
export function forcedTheme() {
  try {
    const value = new URLSearchParams(window.location.search).get('theme')
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

export function saveTheme(theme) {
  safeSet(THEME_KEY, theme)
  safeSet(THEME_SOURCE_KEY, 'user')
}

export function systemTheme() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
}
