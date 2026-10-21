<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '确认删除？' },
  message: { type: String, default: '' },
})

defineEmits(['confirm', 'cancel'])
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
        class="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
        @click.self="$emit('cancel')"
      >
        <div class="panel w-full max-w-sm rounded-2xl p-5" role="alertdialog" aria-modal="true">
          <div class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-500/10">
              <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v4M12 17h.01" stroke-linecap="round" />
                <path d="M10.3 3.9 2.5 17.4A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3.1L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke-linejoin="round" />
              </svg>
            </span>
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-ink">{{ title }}</h3>
              <p v-if="message" class="mt-1 text-xs leading-relaxed break-words text-ink-soft">
                {{ message }}
              </p>
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button type="button" class="btn btn-secondary" @click="$emit('cancel')">取消</button>
            <button type="button" class="btn btn-danger" @click="$emit('confirm')">确认删除</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
