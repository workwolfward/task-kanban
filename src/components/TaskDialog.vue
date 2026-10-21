<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { DESC_MAX, PRIORITIES, STATUSES, TITLE_MAX, validateTitle } from '../lib/tasks.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  task: { type: Object, default: null },
  defaultStatus: { type: String, default: 'todo' },
})

const emit = defineEmits(['close', 'submit', 'delete'])

const title = ref('')
const description = ref('')
const priority = ref('medium')
const status = ref('todo')
const error = ref('')
const titleInput = ref(null)

const isEdit = computed(() => props.mode === 'edit')
const heading = computed(() => (isEdit.value ? '编辑任务' : '新建任务'))

function reset() {
  title.value = props.task?.title ?? ''
  description.value = props.task?.description ?? ''
  priority.value = props.task?.priority ?? 'medium'
  status.value = props.task?.status ?? props.defaultStatus ?? 'todo'
  error.value = ''
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    reset()
    await nextTick()
    titleInput.value?.focus()
  },
)

watch(title, () => {
  if (error.value) error.value = ''
})

function close() {
  emit('close')
}

function submit() {
  const message = validateTitle(title.value)
  if (message) {
    error.value = message
    titleInput.value?.focus()
    return
  }
  emit('submit', {
    title: title.value,
    description: description.value,
    priority: priority.value,
    status: status.value,
  })
}

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    close()
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
        @click.self="close"
      >
        <Transition
          appear
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-3 opacity-0 sm:scale-95"
          leave-active-class="transition duration-100 ease-in"
          leave-to-class="opacity-0"
        >
          <form
            class="panel w-full max-w-lg rounded-t-2xl p-5 sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            :aria-label="heading"
            @submit.prevent="submit"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <h2 class="text-base font-semibold text-ink">{{ heading }}</h2>
                <p class="mt-0.5 text-xs text-ink-soft">标题必填，描述选填。</p>
              </div>
              <button
                type="button"
                class="rounded-lg p-1.5 text-ink-soft hover:bg-surface-soft hover:text-ink"
                aria-label="关闭"
                @click="close"
              >
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
                </svg>
              </button>
            </div>

            <div class="mt-4 space-y-4">
              <div>
                <label class="mb-1 flex items-center justify-between text-xs font-medium text-ink-soft">
                  <span>标题 <span class="text-red-500">*</span></span>
                  <span class="tabular-nums">{{ title.length }}/{{ TITLE_MAX }}</span>
                </label>
                <input
                  ref="titleInput"
                  v-model="title"
                  class="field"
                  :class="error ? 'border-red-400 focus:border-red-500' : ''"
                  :maxlength="TITLE_MAX"
                  placeholder="例如：完成看板拖拽交互"
                  autocomplete="off"
                />
                <p v-if="error" class="mt-1 text-xs text-red-500">{{ error }}</p>
              </div>

              <div>
                <label class="mb-1 flex items-center justify-between text-xs font-medium text-ink-soft">
                  <span>描述</span>
                  <span class="tabular-nums">{{ description.length }}/{{ DESC_MAX }}</span>
                </label>
                <textarea
                  v-model="description"
                  class="field min-h-[76px] resize-none"
                  :maxlength="DESC_MAX"
                  placeholder="补充背景、验收标准或注意事项（选填）"
                />
              </div>

              <div>
                <span class="mb-1 block text-xs font-medium text-ink-soft">优先级</span>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="item in PRIORITIES"
                    :key="item.id"
                    type="button"
                    class="flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-xs font-medium transition"
                    :class="
                      priority === item.id
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-line bg-surface text-ink-soft hover:bg-surface-soft'
                    "
                    @click="priority = item.id"
                  >
                    <span
                      class="h-2 w-2 rounded-full"
                      :class="{
                        'bg-red-500': item.id === 'high',
                        'bg-amber-400': item.id === 'medium',
                        'bg-emerald-500': item.id === 'low',
                      }"
                    />
                    {{ item.label }}
                  </button>
                </div>
              </div>

              <div>
                <span class="mb-1 block text-xs font-medium text-ink-soft">状态</span>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="item in STATUSES"
                    :key="item.id"
                    type="button"
                    class="rounded-xl border px-2 py-2 text-xs font-medium transition"
                    :class="
                      status === item.id
                        ? 'border-brand bg-brand-soft text-brand'
                        : 'border-line bg-surface text-ink-soft hover:bg-surface-soft'
                    "
                    @click="status = item.id"
                  >
                    {{ item.label }}
                  </button>
                </div>
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between gap-2">
              <button
                v-if="isEdit"
                type="button"
                class="btn btn-ghost text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                @click="emit('delete', task)"
              >
                删除
              </button>
              <span v-else />
              <div class="flex items-center gap-2">
                <button type="button" class="btn btn-secondary" @click="close">取消</button>
                <button type="submit" class="btn btn-primary">
                  {{ isEdit ? '保存' : '创建任务' }}
                </button>
              </div>
            </div>
          </form>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
