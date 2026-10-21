<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import TaskColumn from './components/TaskColumn.vue'
import TaskDialog from './components/TaskDialog.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import {
  PRIORITIES,
  STATUSES,
  countByStatus,
  createTask,
  deleteTask,
  filterTasks,
  groupByStatus,
  moveTask,
  statusLabel,
  updateTask,
} from './lib/tasks.js'
import { applyTheme, loadTasks, loadTheme, saveTasks, saveTheme, systemTheme } from './lib/storage.js'

/* ------------------------------ 任务数据 ------------------------------ */
const tasks = ref(loadTasks())

watch(tasks, (value) => saveTasks(value), { deep: true })

const counts = computed(() => countByStatus(tasks.value))
const total = computed(() => tasks.value.length)
const progress = computed(() =>
  total.value === 0 ? 0 : Math.round((counts.value.done / total.value) * 100),
)

/* ------------------------------ 搜索与筛选 ------------------------------ */
const query = ref('')
const priorityFilter = ref('all')

const visibleTasks = computed(() =>
  filterTasks(tasks.value, { query: query.value, priority: priorityFilter.value }),
)
const groups = computed(() => groupByStatus(visibleTasks.value))
const isFiltering = computed(() => query.value.trim() !== '' || priorityFilter.value !== 'all')

const TONES = { todo: 'slate', doing: 'indigo', done: 'emerald' }

/* 演示辅助：访问 ?demo=1 且本地没有数据时，灌入一批示例任务 */
function seedDemoTasks() {
  const samples = [
    ['梳理任务管理需求与验收标准', '对照课堂实践的四条功能需求逐项确认', 'done', 'high', 0],
    ['搭建 Vue3 + Vite + Tailwind 骨架', '确定目录结构与优先级配色', 'done', 'medium', 1],
    ['实现任务增删改查', '标题必填、描述选填，删除支持撤销', 'doing', 'high', 2],
    ['看板拖拽交互', '跨列改状态，列内调整顺序', 'doing', 'medium', 3],
    ['深色模式与主题持久化', '写入 localStorage，首屏不闪白', 'todo', 'low', 4],
    ['补充单元测试与课堂演示稿', '领域逻辑覆盖校验、移动、筛选', 'todo', 'medium', 5],
  ]
  return samples.map(([title, description, status, priority, offset]) =>
    createTask({
      title,
      description,
      status,
      priority,
      createdAt: Date.now() - offset * 3600 * 1000,
    }),
  )
}

onMounted(() => {
  applyTheme(theme.value)

  const demo = new URLSearchParams(window.location.search).get('demo')
  if (demo === '1' && tasks.value.length === 0) {
    tasks.value = seedDemoTasks()
  }
})

/* ------------------------------ 主题 ------------------------------ */
const theme = ref(forcedTheme() ?? loadTheme() ?? systemTheme())
applyTheme(theme.value)

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  saveTheme(theme.value)
  applyTheme(theme.value)
}

/* ------------------------------ 弹窗与提示 ------------------------------ */
const dialog = reactive({ open: false, mode: 'create', task: null, status: 'todo' })
const pendingDelete = ref(null)
const toast = reactive({ message: '', visible: false, action: null })
let toastTimer = null

function showToast(message, action = null) {
  toast.message = message
  toast.action = action
  toast.visible = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.visible = false
    toast.action = null
  }, 4200)
}

function openCreate(status = 'todo') {
  dialog.mode = 'create'
  dialog.task = null
  dialog.status = status
  dialog.open = true
}

function openEdit(task) {
  dialog.mode = 'edit'
  dialog.task = task
  dialog.status = task.status
  dialog.open = true
}

function closeDialog() {
  dialog.open = false
}

function handleSubmit(payload) {
  if (dialog.mode === 'edit' && dialog.task) {
    tasks.value = updateTask(tasks.value, dialog.task.id, payload)
    showToast('修改已保存')
  } else {
    const task = createTask(payload)
    // 新任务放在所属列的最前面，方便立刻看到
    tasks.value = [task, ...tasks.value]
    showToast(`已创建「${task.title}」`)
  }
  closeDialog()
}

/* ------------------------------ 删除（可撤销） ------------------------------ */
function askDelete(task) {
  pendingDelete.value = task
}

function confirmDelete() {
  const task = pendingDelete.value
  if (!task) return
  const index = tasks.value.findIndex((t) => t.id === task.id)

  if (dialog.open && dialog.task?.id === task.id) closeDialog()
  tasks.value = deleteTask(tasks.value, task.id)
  pendingDelete.value = null
  dialog.open = false

  showToast(`已删除「${task.title}」`, {
    label: '撤销',
    run: () => {
      const next = [...tasks.value]
      next.splice(Math.max(0, index), 0, task)
      tasks.value = next
      toast.visible = false
    },
  })
}

/* ------------------------------ 拖拽与快捷移动 ------------------------------ */
const draggingId = ref(null)

function onDragStart(task) {
  draggingId.value = task.id
}

function onDragEnd() {
  draggingId.value = null
}

function onDrop({ status, beforeId }) {
  if (!draggingId.value) return
  const task = tasks.value.find((t) => t.id === draggingId.value)
  const from = task?.status
  tasks.value = moveTask(tasks.value, draggingId.value, status, beforeId)
  if (task && from !== status) {
    showToast(`「${task.title}」已移到${statusLabel(status)}`)
  }
  draggingId.value = null
}

function advance(task, status) {
  tasks.value = moveTask(tasks.value, task.id, status)
  showToast(`「${task.title}」已移到${statusLabel(status)}`)
}

function clearDone() {
  const done = tasks.value.filter((t) => t.status === 'done')
  if (done.length === 0) return
  tasks.value = tasks.value.filter((t) => t.status !== 'done')
  showToast(`已清理 ${done.length} 条已完成任务`)
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- 顶栏 -->
    <header class="sticky top-0 z-20 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-2.5">
          <span
            class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm"
            aria-hidden="true"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="5" height="16" rx="1.5" />
              <rect x="10" y="4" width="5" height="10" rx="1.5" />
              <rect x="17" y="4" width="4" height="13" rx="1.5" />
            </svg>
          </span>
          <div class="leading-tight">
            <h1 class="text-[15px] font-semibold tracking-tight text-ink">TaskFlow 任务看板</h1>
            <p class="hidden text-[11px] text-ink-soft sm:block">拖拽卡片即可改变状态 · 数据保存在本地</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="hidden items-center gap-2 rounded-xl border border-line bg-surface px-3 py-1.5 md:flex">
            <span class="text-[11px] text-ink-soft">完成度</span>
            <span class="text-xs font-semibold text-ink tabular-nums">{{ progress }}%</span>
            <span class="h-1.5 w-20 overflow-hidden rounded-full bg-surface-soft">
              <span
                class="block h-full rounded-full bg-emerald-500 transition-all duration-300"
                :style="{ width: `${progress}%` }"
              />
            </span>
          </div>

          <button
            type="button"
            class="btn btn-secondary !px-2.5"
            :aria-pressed="theme === 'dark'"
            :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
            @click="toggleTheme"
          >
            <svg v-if="theme === 'dark'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" stroke-linecap="round" />
            </svg>
            <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" stroke-linejoin="round" />
            </svg>
            <span class="hidden text-xs sm:inline">{{ theme === 'dark' ? '浅色' : '深色' }}</span>
          </button>

          <button type="button" class="btn btn-primary" @click="openCreate('todo')">
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M12 5v14M5 12h14" stroke-linecap="round" />
            </svg>
            新建任务
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 pt-3 pb-4 sm:px-6 md:min-h-0">
      <!-- 工具栏 -->
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative min-w-[180px] flex-1 sm:max-w-xs">
          <svg
            class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ink-soft"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" stroke-linecap="round" />
          </svg>
          <input
            v-model="query"
            class="field !pl-9"
            type="search"
            placeholder="搜索标题或描述"
            aria-label="搜索任务"
          />
        </div>

        <div class="flex items-center gap-1 rounded-xl border border-line bg-surface p-1">
          <button
            type="button"
            class="rounded-lg px-2.5 py-1 text-xs font-medium transition"
            :class="priorityFilter === 'all' ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:text-ink'"
            @click="priorityFilter = 'all'"
          >
            全部
          </button>
          <button
            v-for="item in PRIORITIES"
            :key="item.id"
            type="button"
            class="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition"
            :class="priorityFilter === item.id ? 'bg-brand-soft text-brand' : 'text-ink-soft hover:text-ink'"
            @click="priorityFilter = item.id"
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="{
                'bg-red-500': item.id === 'high',
                'bg-amber-400': item.id === 'medium',
                'bg-emerald-500': item.id === 'low',
              }"
            />
            {{ item.label }}
          </button>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <span class="text-xs text-ink-soft">
            共 <b class="font-semibold text-ink tabular-nums">{{ total }}</b> 条
          </span>
          <button
            v-if="counts.done > 0"
            type="button"
            class="btn btn-ghost !px-2 !py-1 text-xs"
            @click="clearDone"
          >
            清理已完成
          </button>
        </div>
      </div>

      <p v-if="isFiltering" class="text-[11px] text-ink-soft">
        筛选结果 {{ visibleTasks.length }} / {{ total }} 条
        <button type="button" class="ml-1 underline underline-offset-2 hover:text-ink" @click="query = ''; priorityFilter = 'all'">
          重置
        </button>
      </p>

      <!-- 看板 -->
      <div class="grid flex-1 grid-cols-1 gap-3 md:min-h-0 md:grid-cols-3">
        <TaskColumn
          v-for="status in STATUSES"
          :key="status.id"
          :status="status.id"
          :label="status.label"
          :tone="TONES[status.id]"
          :tasks="groups[status.id]"
          :dragging-id="draggingId"
          @add="openCreate"
          @edit="openEdit"
          @delete="askDelete"
          @advance="advance"
          @drop="onDrop"
          @dragstart="onDragStart"
          @dragend="onDragEnd"
        />
      </div>

      <p class="text-center text-[11px] text-ink-soft md:text-left">
        提示：按住卡片拖到其他列即改状态；列内拖动可调整顺序；点击卡片可编辑。
      </p>
    </main>

    <TaskDialog
      :open="dialog.open"
      :mode="dialog.mode"
      :task="dialog.task"
      :default-status="dialog.status"
      @close="closeDialog"
      @submit="handleSubmit"
      @delete="askDelete"
    />

    <ConfirmDialog
      :open="!!pendingDelete"
      title="删除这条任务？"
      :message="pendingDelete ? `「${pendingDelete.title}」将被移除，删除后可以立即撤销。` : ''"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />

    <!-- 轻量提示条 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="toast.visible"
        class="fixed bottom-5 left-1/2 z-70 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs text-white shadow-lg dark:bg-slate-700"
        role="status"
      >
        <span>{{ toast.message }}</span>
        <button
          v-if="toast.action"
          type="button"
          class="font-semibold text-indigo-300 hover:text-indigo-200"
          @click="toast.action.run()"
        >
          {{ toast.action.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>
