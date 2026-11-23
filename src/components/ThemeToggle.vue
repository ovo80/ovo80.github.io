<script setup lang="ts">
import { ref } from 'vue'

const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
const theme = ref<'light' | 'dark'>(current)

const apply = (value: 'light' | 'dark'): void => {
  theme.value = value
  document.documentElement.dataset.theme = value
  try {
    localStorage.setItem('theme', value)
  } catch {
    // 隐身模式等场景下可能不可用，忽略即可
  }
}

const toggle = (): void => {
  apply(theme.value === 'dark' ? 'light' : 'dark')
}
</script>

<template>
  <button
    class="theme-toggle"
    type="button"
    :aria-label="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
    :title="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
    @click="toggle"
  >
    <svg
      v-if="theme === 'dark'"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
</template>
