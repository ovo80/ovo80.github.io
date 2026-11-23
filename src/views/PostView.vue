<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { getPost } from '../data/posts'
import { formatDate } from '../utils/date'
import { renderMarkdown } from '../utils/markdown'

const props = defineProps<{ slug: string }>()

const post = computed(() => getPost(props.slug))
const html = computed(() => (post.value ? renderMarkdown(post.value.content) : ''))

watchEffect(() => {
  const current = post.value
  if (current) document.title = `${current.title} · ovo80`
})
</script>

<template>
  <article v-if="post" class="post">
    <a class="back" href="#/posts">← 文章列表</a>
    <header class="post-header">
      <h1>{{ post.title }}</h1>
      <p class="post-meta">
        <time :datetime="post.date">{{ formatDate(post.date) }}</time>
        <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
      </p>
    </header>
    <div class="prose" v-html="html"></div>
    <footer class="post-footer">
      <a class="btn" href="#/posts">← 返回文章列表</a>
    </footer>
  </article>

  <section v-else class="not-found">
    <p class="notfound-code">404</p>
    <h1>文章不存在</h1>
    <p>这篇可能还没写，或者链接已经失效。</p>
    <a class="btn btn-primary" href="#/posts">去看看其他文章</a>
  </section>
</template>
