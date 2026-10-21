import { describe, expect, it } from 'vitest'
import {
  countByStatus,
  createTask,
  deleteTask,
  filterTasks,
  groupByStatus,
  moveTask,
  normalizeTaskList,
  updateTask,
  validateTitle,
} from '../src/lib/tasks.js'

function makeTask(title, overrides = {}) {
  return createTask({ title, ...overrides })
}

describe('validateTitle 标题校验', () => {
  it('空标题被拒绝', () => {
    expect(validateTitle('')).toBe('标题不能为空')
    expect(validateTitle('   ')).toBe('标题不能为空')
    expect(validateTitle(undefined)).toBe('标题不能为空')
  })

  it('正常标题通过', () => {
    expect(validateTitle('写周报')).toBeNull()
  })

  it('超长标题被拒绝', () => {
    expect(validateTitle('a'.repeat(81))).toContain('不能超过')
  })
})

describe('createTask 创建任务', () => {
  it('默认状态为待办，默认优先级为中', () => {
    const task = makeTask('整理需求')
    expect(task.status).toBe('todo')
    expect(task.priority).toBe('medium')
    expect(task.description).toBe('')
    expect(task.id).toBeTruthy()
  })

  it('标题前后空格会被清理', () => {
    expect(makeTask('  修 bug  ').title).toBe('修 bug')
  })

  it('标题为空时抛出错误，不产生脏数据', () => {
    expect(() => makeTask('   ')).toThrow('标题不能为空')
  })

  it('非法的状态/优先级回落到默认值', () => {
    const task = createTask({ title: 'x', status: 'archived', priority: 'urgent' })
    expect(task.status).toBe('todo')
    expect(task.priority).toBe('medium')
  })
})

describe('updateTask 更新任务', () => {
  const base = [makeTask('A'), makeTask('B')]

  it('修改优先级与描述', () => {
    const next = updateTask(base, base[0].id, { description: '补充说明', priority: 'high' })
    expect(next[0].description).toBe('补充说明')
    expect(next[0].priority).toBe('high')
    expect(base[0].priority).toBe('medium') // 原数组不被修改
  })

  it('标题改为空白时整次更新作废', () => {
    const next = updateTask(base, base[0].id, { title: '  ', priority: 'high' })
    expect(next).toBe(base)
    expect(next[0].priority).toBe('medium')
  })

  it('未知 id 原样返回', () => {
    expect(updateTask(base, 'not-exist', { title: 'C' })).toBe(base)
  })
})

describe('moveTask 改变状态与排序', () => {
  it('拖到其它列会修改状态', () => {
    const a = makeTask('A')
    const next = moveTask([a], a.id, 'doing')
    expect(next[0].status).toBe('doing')
  })

  it('指定 beforeId 时插入到该卡片之前', () => {
    const a = makeTask('A')
    const b = makeTask('B', { status: 'doing' })
    const c = makeTask('C', { status: 'doing' })
    const next = moveTask([a, b, c], a.id, 'doing', c.id)
    expect(next.map((t) => t.title)).toEqual(['B', 'A', 'C'])
  })

  it('非法状态被忽略', () => {
    const a = makeTask('A')
    const tasks = [a]
    expect(moveTask(tasks, a.id, 'unknown')).toBe(tasks)
  })

  it('目标 beforeId 不存在时追加到列尾', () => {
    const a = makeTask('A')
    const b = makeTask('B')
    const next = moveTask([a, b], a.id, 'todo', 'ghost')
    expect(next.map((t) => t.title)).toEqual(['B', 'A'])
  })
})

describe('deleteTask 删除', () => {
  it('只删除命中 id 的任务', () => {
    const a = makeTask('A')
    const b = makeTask('B')
    expect(deleteTask([a, b], a.id)).toEqual([b])
  })
})

describe('countByStatus / groupByStatus', () => {
  const tasks = [
    makeTask('A'),
    makeTask('B', { status: 'doing' }),
    makeTask('C', { status: 'done' }),
    makeTask('D', { status: 'done' }),
  ]

  it('按状态计数', () => {
    expect(countByStatus(tasks)).toEqual({ todo: 1, doing: 1, done: 2 })
  })

  it('按状态分组', () => {
    const groups = groupByStatus(tasks)
    expect(groups.done.map((t) => t.title)).toEqual(['C', 'D'])
  })
})

describe('filterTasks 搜索与筛选', () => {
  const tasks = [
    makeTask('写周报', { description: '汇总本周进展', priority: 'high' }),
    makeTask('修登录 bug', { priority: 'low' }),
  ]

  it('默认不过滤', () => {
    expect(filterTasks(tasks)).toHaveLength(2)
  })

  it('搜索命中描述', () => {
    expect(filterTasks(tasks, { query: '本周' })).toHaveLength(1)
  })

  it('按优先级筛选', () => {
    expect(filterTasks(tasks, { priority: 'low' })[0].title).toBe('修登录 bug')
  })

  it('搜索与优先级同时生效', () => {
    expect(filterTasks(tasks, { query: '周报', priority: 'low' })).toHaveLength(0)
  })
})

describe('normalizeTaskList 脏数据修复', () => {
  it('过滤掉无标题项、修复非法字段、补齐 id', () => {
    const result = normalizeTaskList([
      { title: '合法', status: 'doing' },
      { title: '   ' },
      null,
      'oops',
      { id: 'x', title: '非法状态', status: 'archive', priority: 'huge' },
    ])
    expect(result).toHaveLength(2)
    expect(result[0].status).toBe('doing')
    expect(result[1]).toMatchObject({ id: 'x', status: 'todo', priority: 'medium' })
  })

  it('重复 id 会被重新分配', () => {
    const result = normalizeTaskList([
      { id: 'dup', title: 'A' },
      { id: 'dup', title: 'B' },
    ])
    expect(result[0].id).not.toBe(result[1].id)
  })

  it('非数组输入返回空列表', () => {
    expect(normalizeTaskList('nope')).toEqual([])
    expect(normalizeTaskList(null)).toEqual([])
  })
})
