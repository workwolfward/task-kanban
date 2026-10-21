<script setup>
// 第 2 轮：核心功能——任务清单的增删改查（数据只存在内存里）。
import { computed, reactive, ref } from 'vue'
import TaskDialog from './components/TaskDialog.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import {
  STATUSES,
  countByStatus,
  createTask,
  deleteTask,
  groupByStatus,
  updateTask,
} from './lib/tasks.js'

const tasks = ref([])

const groups = computed(() => groupByStatus(tasks.value))
const counts = computed(() => countByStatus(tasks.value))
const total = computed(() => tasks.value.length)

const TONES = { todo: 'bg-slate-400', doing: 'bg-indigo-500', done: 'bg-emerald-500' }

const CHIPS = {
  high: 'text-red-600 bg-red-50 border-red-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
}

const BARS = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-emerald-500' }

const LABELS = { high: '高', medium: '中', low: '低' }

const dialog = reactive({ open: false, mode: 'create', task: null, status: 'todo' })
const pendingDelete = ref(null)

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
  } else {
    tasks.value = [createTask(payload), ...tasks.value]
  }
  closeDialog()
}

function askDelete(task) {
  pendingDelete.value = task
}

function confirmDelete() {
  if (!pendingDelete.value) return
  tasks.value = deleteTask(tasks.value, pendingDelete.value.id)
  pendingDelete.value = null
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
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
            <p class="hidden text-[11px] text-ink-soft sm:block">任务清单已可用，尚未接入持久化</p>
          </div>
        </div>

        <button type="button" class="btn btn-primary" @click="openCreate('todo')">
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
          </svg>
          新建任务
        </button>
      </div>
    </header>

    <main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 pt-3 pb-4 sm:px-6 md:min-h-0">
      <div class="flex items-center gap-2 text-xs text-ink-soft">
        <span>共 <b class="font-semibold text-ink tabular-nums">{{ total }}</b> 条</span>
        <span class="text-line">·</span>
        <span>待办 {{ counts.todo }} / 进行中 {{ counts.doing }} / 完成 {{ counts.done }}</span>
      </div>

      <div class="grid flex-1 grid-cols-1 gap-3 md:min-h-0 md:grid-cols-3">
        <section
          v-for="status in STATUSES"
          :key="status.id"
          class="flex min-h-0 flex-col rounded-2xl border border-line bg-surface-soft/70"
        >
          <header class="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :class="TONES[status.id]" />
              <h2 class="text-sm font-semibold text-ink">{{ status.label }}</h2>
              <span
                class="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-soft ring-1 ring-line tabular-nums"
              >
                {{ groups[status.id].length }}
              </span>
            </div>
            <button
              type="button"
              class="rounded-lg p-1 text-ink-soft transition hover:bg-surface hover:text-ink"
              :title="`在「${status.label}」新建任务`"
              @click="openCreate(status.id)"
            >
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14" stroke-linecap="round" />
              </svg>
            </button>
          </header>

          <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 pb-3">
            <article
              v-for="task in groups[status.id]"
              :key="task.id"
              class="group relative cursor-pointer overflow-hidden rounded-xl border border-line bg-surface py-3 pr-3 pl-4 transition hover:shadow-md"
              @click="openEdit(task)"
            >
              <span class="absolute inset-y-0 left-0 w-1" :class="BARS[task.priority]" aria-hidden="true" />
              <div class="flex items-start justify-between gap-2">
                <span
                  class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold"
                  :class="CHIPS[task.priority]"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="BARS[task.priority]" />
                  {{ LABELS[task.priority] }}优先级
                </span>
                <div class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    class="rounded-md p-1 text-ink-soft hover:bg-surface-soft hover:text-ink"
                    title="编辑"
                    @click.stop="openEdit(task)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 20h9" stroke-linecap="round" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="rounded-md p-1 text-ink-soft hover:bg-red-50 hover:text-red-600"
                    title="删除"
                    @click.stop="askDelete(task)"
                  >
                    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 class="mt-2 text-sm leading-snug font-medium break-words text-ink">{{ task.title }}</h3>
              <p v-if="task.description" class="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                {{ task.description }}
              </p>
            </article>

            <p
              v-if="groups[status.id].length === 0"
              class="flex h-24 items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-soft"
            >
              暂无任务
            </p>
          </div>
        </section>
      </div>

      <p class="text-center text-[11px] text-ink-soft md:text-left">
        第 2 轮：点击卡片可编辑，右上角可删除；刷新后数据会丢失（下一轮接入持久化）。
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
      :message="pendingDelete ? `「${pendingDelete.title}」将被移除。` : ''"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    />
  </div>
</template>
