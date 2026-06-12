<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'

const route = useRoute()
const hideSidebarRoutes = new Set(['login', 'select-level'])
const showSidebar = computed(() => !hideSidebarRoutes.has(String(route.name)))

const bgImages = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&q=80',
  'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1920&q=80'
]
const bgUrl = bgImages[Math.floor(Math.random() * bgImages.length)]
</script>

<template>
  <div class="app-wrapper">
    <div class="bg-layer" :style="{ backgroundImage: `url(${bgUrl})` }"></div>
    <div class="app-container">
      <Sidebar v-if="showSidebar" />
      <main class="main-content" :class="{ 'full-width': !showSidebar }">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-wrapper {
  position: relative;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.bg-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  z-index: 0;
}

.bg-layer::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 10, 26, 0.5);
}

.app-container {
  position: relative;
  z-index: 1;
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
  scrollbar-width: thin;
}

.main-content::-webkit-scrollbar {
  width: 4px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.main-content.full-width {
  padding: 0;
}
</style>
