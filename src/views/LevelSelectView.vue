<template>
  <div class="level-page">
    <div class="level-card glass-card animate-fade-in">
      <div class="level-header">
        <h1 class="level-title">选择目标</h1>
        <p class="level-subtitle">
          你好 {{ authStore.user?.username || '同学' }}，今天准备攻克哪个堡垒？
        </p>
      </div>

      <div class="level-options">
        <div
          class="level-option"
          :class="{ active: selectedLevel === 'cet4' }"
          @click="selectedLevel = 'cet4'"
        >
          <div class="option-icon cet4-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="8" height="8" rx="1" fill="#4ade80"/>
              <rect x="13" y="3" width="8" height="8" rx="1" fill="#22d3ee"/>
              <rect x="3" y="13" width="8" height="8" rx="1" fill="#f472b6"/>
              <rect x="13" y="13" width="8" height="8" rx="1" fill="#fbbf24"/>
            </svg>
          </div>
          <span class="option-name">CET-4</span>
        </div>

        <div
          class="level-option"
          :class="{ active: selectedLevel === 'cet6' }"
          @click="selectedLevel = 'cet6'"
        >
          <div class="option-icon cet6-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3L22 20H2L12 3Z" fill="url(#cet6-gradient)"/>
              <defs>
                <linearGradient id="cet6-gradient" x1="2" y1="20" x2="22" y2="20" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#f59e0b"/>
                  <stop offset="1" stop-color="#ef4444"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span class="option-name">CET-6</span>
        </div>
      </div>

      <button
        class="confirm-btn"
        :disabled="!selectedLevel"
        @click="confirmLevel"
      >
        开始学习 <span class="arrow">→</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWordsStore } from '../stores/words'

const router = useRouter()
const authStore = useAuthStore()
const wordsStore = useWordsStore()
const selectedLevel = ref<'cet4' | 'cet6' | ''>('')

function confirmLevel() {
  if (!selectedLevel.value) return
  authStore.setSelectedLevel(selectedLevel.value)
  wordsStore.loadWords(selectedLevel.value)
  router.push('/')
}
</script>

<style scoped>
.level-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.level-card {
  width: 100%;
  max-width: 420px;
  padding: 48px 40px;
  text-align: center;
}

.level-header {
  margin-bottom: 32px;
}

.level-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.level-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.level-options {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.level-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 28px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.level-option:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.level-option.active {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.35);
}

.option-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-icon svg {
  width: 100%;
  height: 100%;
}

.option-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.confirm-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.confirm-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.confirm-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.arrow {
  transition: transform 0.3s;
}

.confirm-btn:hover:not(:disabled) .arrow {
  transform: translateX(4px);
}
</style>
