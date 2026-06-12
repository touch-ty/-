import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LevelSelectView from '../LevelSelectView.vue'
import { useAuthStore } from '@/stores/auth'

const mockLocalStorage: Record<string, string> = {}

describe('LevelSelectView', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockLocalStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockLocalStorage[key] = value },
      removeItem: (key: string) => { delete mockLocalStorage[key] },
    })
    setActivePinia(createPinia())
    const auth = useAuthStore()
    auth.user = { id: 'u1', username: 'tester', avatar: '' }
  })

  it('渲染两个选项', () => {
    const wrapper = mount(LevelSelectView)
    const options = wrapper.findAll('.level-option')
    expect(options).toHaveLength(2)
    expect(options[0].text()).toContain('CET-4')
    expect(options[1].text()).toContain('CET-6')
  })

  it('点击选项后激活', async () => {
    const wrapper = mount(LevelSelectView)
    const option = wrapper.findAll('.level-option')[0]
    await option.trigger('click')
    expect(option.classes()).toContain('active')
  })

  it('未选择时按钮禁用', () => {
    const wrapper = mount(LevelSelectView)
    const btn = wrapper.find('.confirm-btn')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('选择后按钮可用', async () => {
    const wrapper = mount(LevelSelectView)
    const option = wrapper.findAll('.level-option')[0]
    await option.trigger('click')
    const btn = wrapper.find('.confirm-btn')
    expect(btn.attributes('disabled')).toBeUndefined()
  })
})
