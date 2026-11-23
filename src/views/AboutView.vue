<script setup lang="ts">
import { posts } from '../data/posts'

const postCount = posts.length
</script>

<template>
  <section class="about">
    <h1>关于</h1>
    <p>
      你好，我是 ovo80，一名前端开发者。平时喜欢折腾工具、写一点 UI，也喜欢把学到的东西记下来。
    </p>

    <h2>我在做什么</h2>
    <ul>
      <li>写前端：Vue 3、TypeScript、Vite</li>
      <li>搭一些自用的小工具，顺手就开源出来</li>
      <li>断断续续地写博客（目前 {{ postCount }} 篇，还会继续）</li>
    </ul>

    <h2>联系我</h2>
    <p>
      最方便的方式是 GitHub：<a href="https://github.com/ovo80" target="_blank" rel="noreferrer">@ovo80</a>。
    </p>

    <h2>关于本站</h2>
    <p>
      纯静态站点，由 Vue 3 + Vite 构建，部署在 GitHub Pages 上。没有统计、没有追踪，读起来应该很快。
    </p>
  </section>
</template>
