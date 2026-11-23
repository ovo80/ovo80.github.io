<script setup lang="ts">
import { computed, ref } from 'vue'
import PostCard from '../components/PostCard.vue'
import { posts } from '../data/posts'

const activeTag = ref('全部')
const tags = computed(() => ['全部', ...new Set(posts.flatMap((post) => post.tags))])
const filtered = computed(() =>
  activeTag.value === '全部' ? posts : posts.filter((post) => post.tags.includes(activeTag.value)),
)
</script>

<template>
  <section class="page-head">
    <h1>文章</h1>
    <p class="page-sub">共 {{ posts.length }} 篇，按时间倒序。</p>
  </section>

  <div class="tag-filter" role="group" aria-label="按标签筛选">
    <button
      v-for="tag in tags"
      :key="tag"
      type="button"
      class="tag-chip"
      :class="{ active: tag === activeTag }"
      @click="activeTag = tag"
    >
      {{ tag }}
    </button>
  </div>

  <div class="post-list">
    <PostCard v-for="post in filtered" :key="post.slug" :post="post" />
  </div>
</template>
