<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) return
  const success = await authStore.login(username.value, password.value)
  if (success) {
    router.push('/select-level')
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card glass-card animate-fade-in">
      <div class="login-header">
        <h1 class="login-title">Welcome Back</h1>
        <p class="login-subtitle">让学习回归纯粹</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <input
            v-model="username"
            type="text"
            class="glass-input"
            placeholder="用户名"
            autocomplete="username"
            :disabled="authStore.loading"
          />
        </div>

        <div class="form-group password-group">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            class="glass-input"
            placeholder="密码"
            autocomplete="current-password"
            :disabled="authStore.loading"
          />
          <button
            type="button"
            class="toggle-password"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? '👁️' : '👁️‍🗨️' }}
          </button>
        </div>

        <div v-if="authStore.error" class="error-message">
          {{ authStore.error }}
        </div>

        <button
          type="submit"
          class="primary-btn"
          :disabled="authStore.loading || !username || !password"
        >
          <span v-if="authStore.loading">登录中...</span>
          <span v-else>进入系统</span>
        </button>

        <p class="register-link">
          还没有账号？<a href="#">立即注册</a>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 48px 40px;
  text-align: center;
}

.login-header {
  margin-bottom: 40px;
}

.login-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  position: relative;
}

.password-group {
  position: relative;
}

.password-group .glass-input {
  padding-right: 44px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
  transition: var(--transition-fast);
  padding: 4px;
}

.toggle-password:hover {
  opacity: 1;
}

.error-message {
  padding: 10px 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  color: var(--danger-color);
  font-size: 13px;
}

.primary-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  background: #fff;
  color: #1a1a1a;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
  margin-top: 8px;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.9);
}

.primary-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.register-link {
  margin-top: 8px;
  font-size: 13px;
  color: var(--text-muted);
}

.register-link a {
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition-fast);
}

.register-link a:hover {
  color: var(--text-primary);
}
</style>
