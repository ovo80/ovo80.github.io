<script setup lang="ts">
import { watchEffect } from 'vue'
import ThemeToggle from './components/ThemeToggle.vue'
import AboutView from './views/AboutView.vue'
import HomeView from './views/HomeView.vue'
import NotFoundView from './views/NotFoundView.vue'
import PostView from './views/PostView.vue'
import PostsView from './views/PostsView.vue'
import { route } from './router'

const navItems = [
  { label: '首页', path: '/' },
  { label: '文章', path: '/posts' },
  { label: '关于', path: '/about' },
]

const titles: Record<string, string> = {
  home: 'ovo80 的博客',
  posts: '文章 · ovo80',
  about: '关于 · ovo80',
}

const isActive = (path: string): boolean => {
  const name = route.value.name
  if (path === '/') return name === 'home'
  if (path === '/posts') return name === 'posts' || name === 'post'
  return name === 'about'
}

watchEffect(() => {
  const title = titles[route.value.name]
  if (title) document.title = title
})
</script>

<template>
  <div class="app">
    <header class="site-header">
      <a class="brand" href="#/">ovo80</a>
      <nav class="nav" aria-label="主导航">
        <a
          v-for="item in navItems"
          :key="item.path"
          :href="`#${item.path}`"
          :class="{ active: isActive(item.path) }"
        >
          {{ item.label }}
        </a>
      </nav>
      <ThemeToggle />
    </header>

    <main class="page">
      <HomeView v-if="route.name === 'home'" />
      <PostsView v-else-if="route.name === 'posts'" />
      <PostView v-else-if="route.name === 'post'" :slug="route.slug" />
      <AboutView v-else-if="route.name === 'about'" />
      <NotFoundView v-else />
    </main>

    <footer class="site-footer">
      <div class="site-footer-inner">
        <span>© 2026 ovo80</span>
        <span>
          用 Vue 3 + Vite 手写 ·
          <a href="https://github.com/ovo80/ovo80.github.io" target="_blank" rel="noreferrer">源码</a>
        </span>
      </div>
    </footer>
  </div>
</template>
