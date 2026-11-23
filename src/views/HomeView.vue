<script setup lang="ts">
import PostCard from '../components/PostCard.vue'
import { posts } from '../data/posts'

const latest = posts.slice(0, 3)
</script>

<template>
  <section class="hero">
    <p class="hero-eyebrow">你好，我是</p>
    <h1 class="hero-title">ovo80</h1>
    <p class="hero-sub">写代码，也写点字。这里记录一些关于前端、工具和日常的碎片。</p>
    <div class="hero-links">
      <a class="btn btn-primary" href="#/posts">读文章</a>
      <a class="btn" href="https://github.com/ovo80" target="_blank" rel="noreferrer">GitHub</a>
    </div>
  </section>

  <section class="section">
    <div class="section-head">
      <h2>最近文章</h2>
      <a class="more" href="#/posts">全部 →</a>
    </div>
    <PostCard v-for="post in latest" :key="post.slug" :post="post" />
  </section>
</template>
