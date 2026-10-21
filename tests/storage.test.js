import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyTheme,
  forcedTheme,
  loadTasks,
  loadTheme,
  saveTasks,
  saveTheme,
  systemTheme,
} from '../src/lib/storage.js'

class MemoryStorage {
  constructor() {
    this.map = new Map()
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null
  }
  setItem(key, value) {
    this.map.set(key, String(value))
  }
  removeItem(key) {
    this.map.delete(key)
  }
}

let storage
let classList

beforeEach(() => {
  storage = new MemoryStorage()
  classList = new Set()
  globalThis.window = {
    localStorage: storage,
    location: { search: '' },
    matchMedia: () => ({ matches: false }),
  }
  globalThis.document = {
    documentElement: {
      classList: {
        toggle: (name, on) => (on ? classList.add(name) : classList.delete(name)),
        contains: (name) => classList.has(name),
      },
      style: {},
    },
  }
})

describe('任务持久化', () => {
  it('写入后可以原样读回', () => {
    const tasks = [
      { id: 'a', title: '写周报', description: '', status: 'todo', priority: 'high', createdAt: 1, updatedAt: 1 },
    ]
    expect(saveTasks(tasks)).toBe(true)
    expect(loadTasks()).toEqual(tasks)
  })

  it('没有数据时返回空列表', () => {
    expect(loadTasks()).toEqual([])
  })

  it('存储内容被改坏时不抛错，降级为空列表', () => {
    storage.setItem('kanban.tasks.v1', '{not json')
    expect(loadTasks()).toEqual([])
  })

  it('非数组内容降级为空列表', () => {
    storage.setItem('kanban.tasks.v1', '{"a":1}')
    expect(loadTasks()).toEqual([])
  })

  it('读取时会修复脏数据', () => {
    storage.setItem(
      'kanban.tasks.v1',
      JSON.stringify([{ title: '正常' }, { title: '   ' }, { title: '坏枚举', status: 'x', priority: 'y' }]),
    )
    const tasks = loadTasks()
    expect(tasks).toHaveLength(2)
    expect(tasks[1]).toMatchObject({ status: 'todo', priority: 'medium' })
  })

  it('写入失败时返回 false，由调用方提示用户', () => {
    storage.setItem = () => {
      throw new Error('QuotaExceededError')
    }
    expect(saveTasks([{ id: 'a', title: 'x' }])).toBe(false)
  })
})

describe('主题持久化', () => {
  it('首次访问没有记录', () => {
    expect(loadTheme()).toBeNull()
  })

  it('写入后能读回', () => {
    saveTheme('dark')
    expect(loadTheme()).toBe('dark')
    saveTheme('light')
    expect(loadTheme()).toBe('light')
  })

  it('非法值当作没有记录', () => {
    storage.setItem('kanban.theme', 'blue')
    expect(loadTheme()).toBeNull()
  })

  it('跟随系统偏好', () => {
    expect(systemTheme()).toBe('light')
    globalThis.window.matchMedia = () => ({ matches: true })
    expect(systemTheme()).toBe('dark')
  })

  it('?theme= 可临时覆盖', () => {
    window.location.search = '?theme=dark'
    expect(forcedTheme()).toBe('dark')
    window.location.search = '?theme=blue'
    expect(forcedTheme()).toBeNull()
  })

  it('applyTheme 按主题增删 dark class', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
