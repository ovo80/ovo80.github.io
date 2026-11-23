import { computed, ref } from 'vue'

export type Route =
  | { name: 'home' }
  | { name: 'posts' }
  | { name: 'post'; slug: string }
  | { name: 'about' }
  | { name: 'not-found' }

const normalize = (hash: string): string => {
  const path = hash.replace(/^#/, '').split('?')[0] ?? ''
  if (path === '' || path === '/') return '/'
  const trimmed = path.replace(/\/+$/, '')
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export const currentPath = ref(normalize(window.location.hash))

export const route = computed<Route>(() => {
  const path = currentPath.value
  if (path === '/') return { name: 'home' }
  if (path === '/posts') return { name: 'posts' }
  if (path === '/about') return { name: 'about' }

  const post = /^\/posts\/([A-Za-z0-9_-]+)$/.exec(path)
  if (post) return { name: 'post', slug: post[1] }

  return { name: 'not-found' }
})

window.addEventListener('hashchange', () => {
  currentPath.value = normalize(window.location.hash)
  window.scrollTo({ top: 0 })
})
