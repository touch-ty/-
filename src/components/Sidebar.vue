<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const navItems = [
  { path: '/', name: 'home', label: '大厅 Home' },
  { path: '/paper', name: 'paper', label: '论文 Paper' },
  { path: '/forum', name: 'forum', label: '论坛 Forum' }
]

function onNavClick(path: string) {
  router.push(path)
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1 class="logo">TOEIC</h1>
      <p class="subtitle">Master</p>
    </div>

    <nav class="sidebar-nav">
      <a
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path)) }"
        @click.prevent="onNavClick(item.path)"
      >
        {{ item.label }}
      </a>
    </nav>

    <div class="sidebar-footer" v-if="authStore.user">
      <button class="logout-btn" @click="logout">退出</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 180px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  padding: 32px 0 16px;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 0 20px 32px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.subtitle {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 2px;
  margin-top: 2px;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 12px;
}

.nav-item {
  display: block;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 13px;
  font-weight: 400;
  transition: var(--transition-fast);
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.sidebar-footer {
  padding: 16px 20px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: auto;
}

.logout-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 0;
  transition: var(--transition-fast);
}

.logout-btn:hover {
  color: var(--text-primary);
}
</style>
