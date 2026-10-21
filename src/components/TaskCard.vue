<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
  isDragging: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete', 'advance', 'dragstart', 'dragend'])

const PALETTE = {
  high: {
    bar: 'bg-red-500',
    chip: 'text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-500/10 dark:border-red-500/30',
    label: '高',
  },
  medium: {
    bar: 'bg-amber-400',
    chip: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-500/10 dark:border-amber-500/30',
    label: '中',
  },
  low: {
    bar: 'bg-emerald-500',
    chip: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-500/10 dark:border-emerald-500/30',
    label: '低',
  },
}

const palette = computed(() => PALETTE[props.task.priority] ?? PALETTE.medium)
const isDone = computed(() => props.task.status === 'done')

const nextStatus = computed(() => {
  if (props.task.status === 'todo') return { id: 'doing', label: '进行中' }
  if (props.task.status === 'doing') return { id: 'done', label: '完成' }
  return null
})

const createdText = computed(() => {
  const d = new Date(props.task.createdAt)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
})

function onDragStart(event) {
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', props.task.id)
  emit('dragstart', props.task)
}
</script>

<template>
  <article
    class="group relative cursor-grab overflow-hidden rounded-xl border border-line bg-surface p-3 pl-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
    :class="{ 'drag-ghost': isDragging }"
    draggable="true"
    tabindex="0"
    role="group"
    :aria-label="`任务：${task.title}，按回车编辑`"
    @dragstart="onDragStart"
    @dragend="emit('dragend')"
    @click="emit('edit', task)"
    @keydown.enter.prevent="emit('edit', task)"
  >
    <span class="absolute inset-y-0 left-0 w-1" :class="palette.bar" aria-hidden="true" />

    <div class="flex items-start justify-between gap-2">
      <span
        class="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold"
        :class="palette.chip"
      >
        <span class="h-1.5 w-1.5 rounded-full" :class="palette.bar" />
        {{ palette.label }}优先级
      </span>

      <div
        class="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <button
          type="button"
          class="rounded-md p-1 text-ink-soft hover:bg-surface-soft hover:text-ink"
          title="编辑"
          @click.stop="emit('edit', task)"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9" stroke-linecap="round" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" stroke-linejoin="round" />
          </svg>
        </button>
        <button
          type="button"
          class="rounded-md p-1 text-ink-soft hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
          title="删除"
          @click.stop="emit('delete', task)"
        >
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>

    <h3
      class="mt-2 text-sm leading-snug font-medium break-words"
      :class="isDone ? 'text-ink-soft line-through' : 'text-ink'"
    >
      {{ task.title }}
    </h3>

    <p v-if="task.description" class="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">
      {{ task.description }}
    </p>

    <div class="mt-2.5 flex items-center justify-between gap-2 text-[11px] text-ink-soft">
      <span class="tabular-nums">{{ createdText }}</span>
      <button
        v-if="nextStatus"
        type="button"
        class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-ink-soft opacity-0 transition group-hover:opacity-100 hover:bg-surface-soft hover:text-ink focus-visible:opacity-100"
        :title="`移动到${nextStatus.label}`"
        @click.stop="emit('advance', task, nextStatus.id)"
      >
        移到{{ nextStatus.label }}
        <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </article>
</template>
