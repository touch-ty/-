import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  username: string
  avatar?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string>('')
  const loading = ref(false)
  const error = ref('')
  const selectedLevel = ref<'cet4' | 'cet6' | ''>('')

  const isLoggedIn = computed(() => !!token.value)
  const hasSelectedLevel = computed(() => !!selectedLevel.value)

  const stored = localStorage.getItem('auth')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      user.value = parsed.user
      token.value = parsed.token
      selectedLevel.value = parsed.selectedLevel || ''
    } catch { /* ignore */ }
  }

  async function login(username: string, password: string) {
    loading.value = true
    error.value = ''
    await new Promise(r => setTimeout(r, 800))
    if (password.length < 3) {
      error.value = '密码错误或未注册，请检查账号信息'
      loading.value = false
      return false
    }
    const mockUser: User = { id: 'u1', username, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` }
    user.value = mockUser
    token.value = 'mock-jwt-token-' + Date.now()
    localStorage.setItem('auth', JSON.stringify({ user: mockUser, token: token.value, selectedLevel: selectedLevel.value }))
    loading.value = false
    return true
  }

  function setSelectedLevel(level: 'cet4' | 'cet6') {
    selectedLevel.value = level
    const stored = localStorage.getItem('auth')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        parsed.selectedLevel = level
        localStorage.setItem('auth', JSON.stringify(parsed))
      } catch { /* ignore */ }
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    selectedLevel.value = ''
    localStorage.removeItem('auth')
  }

  return { user, token, loading, error, isLoggedIn, selectedLevel, hasSelectedLevel, login, setSelectedLevel, logout }
})
