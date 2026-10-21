<script setup>
// 第 1 轮：只做骨架——三列看板的静态结构，功能留空。
const columns = [
  { id: 'todo', label: '待办', tone: 'bg-slate-400' },
  { id: 'doing', label: '进行中', tone: 'bg-indigo-500' },
  { id: 'done', label: '完成', tone: 'bg-emerald-500' },
]
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
            <p class="hidden text-[11px] text-ink-soft sm:block">骨架已就绪，等待接入任务功能</p>
          </div>
        </div>

        <button type="button" class="btn btn-primary" disabled>
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
          </svg>
          新建任务
        </button>
      </div>
    </header>

    <main class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 pt-3 pb-4 sm:px-6 md:min-h-0">
      <div class="grid flex-1 grid-cols-1 gap-3 md:min-h-0 md:grid-cols-3">
        <section
          v-for="column in columns"
          :key="column.id"
          class="flex min-h-0 flex-col rounded-2xl border border-line bg-surface-soft/70"
        >
          <header class="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :class="column.tone" />
              <h2 class="text-sm font-semibold text-ink">{{ column.label }}</h2>
              <span
                class="rounded-full bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-soft ring-1 ring-line tabular-nums"
              >
                0
              </span>
            </div>
          </header>

          <div class="flex min-h-0 flex-1 items-start px-2.5 pb-3">
            <p
              class="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-line text-xs text-ink-soft"
            >
              暂无任务
            </p>
          </div>
        </section>
      </div>

      <p class="text-center text-[11px] text-ink-soft md:text-left">
        骨架阶段：目录结构、三列布局与主题变量已就绪。
      </p>
    </main>
  </div>
</template>
