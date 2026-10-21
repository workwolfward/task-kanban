<script setup>
import { ref } from 'vue'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  status: { type: String, required: true },
  label: { type: String, required: true },
  tasks: { type: Array, default: () => [] },
  draggingId: { type: String, default: null },
  tone: { type: String, default: 'slate' },
})

const emit = defineEmits([
  'drop',
  'add',
  'edit',
  'delete',
  'advance',
  'dragstart',
  'dragend',
])

const isOver = ref(false)
const hoverId = ref(null)

const TONES = {
  slate: 'bg-slate-400',
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
}

function onDragOver(event) {
  if (!event.dataTransfer) return
  event.dataTransfer.dropEffect = 'move'
  isOver.value = true
}

function onDragLeave(event) {
  // 只有真正离开整列时才取消高亮，避免进入子元素时闪烁
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isOver.value = false
    hoverId.value = null
  }
}

function onDrop(beforeId) {
  isOver.value = false
  hoverId.value = null
  emit('drop', { status: props.status, beforeId })
}

function onCardDropBefore(taskId) {
  onDrop(taskId)
}
</script>

<template>
  <section
    class="flex min-h-0 flex-col rounded-2xl border border-line bg-surface-soft/70 transition-colors"
    :class="{ 'drop-active': isOver }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop(null)"
  >
    <header class="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
      <div class="flex items-center gap-2">
        <span class="h-2 w-2 rounded-full" :class="TONES[tone] ?? TONES.slate" />
        <h2 class="text-sm font-semibold text-ink">{{ label }}</h2>
        <span
          class="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-soft ring-1 ring-line tabular-nums"
        >
          {{ tasks.length }}
        </span>
      </div>
      <button
        type="button"
        class="rounded-lg p-1 text-ink-soft transition hover:bg-surface hover:text-ink"
        :title="`在「${label}」新建任务`"
        @click="emit('add', status)"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
      </button>
    </header>

    <div class="min-h-0 flex-1 space-y-2 overflow-y-auto px-2.5 pt-0.5 pb-3">
      <template v-for="task in tasks" :key="task.id">
        <div
          v-if="hoverId === task.id"
          class="h-0.5 rounded-full bg-brand"
          aria-hidden="true"
        />
        <div
          @dragover.stop.prevent="hoverId = task.id"
          @drop.stop.prevent="onCardDropBefore(task.id)"
        >
          <TaskCard
            :task="task"
            :is-dragging="draggingId === task.id"
            @edit="emit('edit', $event)"
            @delete="emit('delete', $event)"
            @advance="(t, s) => emit('advance', t, s)"
            @dragstart="emit('dragstart', $event)"
            @dragend="emit('dragend')"
          />
        </div>
      </template>

      <p
        v-if="tasks.length === 0"
        class="flex h-24 items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-soft"
      >
        暂无任务，拖拽卡片到这里
      </p>
    </div>
  </section>
</template>
