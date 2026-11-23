<script setup lang="ts">
import type { Post } from '../types'
import { formatDate } from '../utils/date'

defineProps<{ post: Post }>()
</script>

<template>
  <article class="post-card">
    <a class="post-card-title" :href="`#/posts/${post.slug}`">{{ post.title }}</a>
    <p class="post-card-meta">
      <time :datetime="post.date">{{ formatDate(post.date) }}</time>
      <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
    </p>
    <p class="post-card-excerpt">{{ post.excerpt }}</p>
  </article>
</template>
