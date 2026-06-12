import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWordsStore } from '../words'

describe('words store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('加载四级词库后 totalCount > 0', () => {
    const store = useWordsStore()
    store.loadWords('cet4')
    expect(store.totalCount).toBeGreaterThan(0)
  })

  it('加载六级词库后 totalCount > 0', () => {
    const store = useWordsStore()
    store.loadWords('cet6')
    expect(store.totalCount).toBeGreaterThan(0)
  })

  it('切换等级会清空学习状态', () => {
    const store = useWordsStore()
    store.loadWords('cet4')
    store.startLearning(5)
    store.switchLevel('cet6')
    expect(store.learningWords).toHaveLength(0)
    expect(store.masteredWordIds.size).toBe(0)
  })

  it('startLearning 返回指定数量的单词', () => {
    const store = useWordsStore()
    store.loadWords('cet4')
    const words = store.startLearning(5)
    expect(words).toHaveLength(5)
    expect(words[0].round).toBe(0)
    expect(words[0].correctCount).toBe(0)
  })

  it('答对 3 次后进入 mastered', () => {
    const store = useWordsStore()
    store.loadWords('cet4')
    store.startLearning(1)
    const id = store.learningWords[0].id

    store.handleCorrect(id)
    expect(store.masteredWordIds.has(String(id))).toBe(false)

    store.handleCorrect(id)
    expect(store.masteredWordIds.has(String(id))).toBe(false)

    store.handleCorrect(id)
    expect(store.masteredWordIds.has(String(id))).toBe(true)
  })

  it('答错后 correctCount 归零并移至末尾', () => {
    const store = useWordsStore()
    store.loadWords('cet4')
    store.startLearning(3)
    const firstId = store.learningWords[0].id
    const firstWord = store.learningWords[0].word

    store.handleCorrect(firstId)
    expect(store.learningWords[0].correctCount).toBe(1)

    store.handleIncorrect(firstId)
    const lastWord = store.learningWords[store.learningWords.length - 1]
    expect(lastWord.word).toBe(firstWord)
    expect(lastWord.correctCount).toBe(0)
    expect(lastWord.round).toBe(0)
  })

  it('masteredCount 随答对次数增加', () => {
    const store = useWordsStore()
    store.loadWords('cet4')
    store.startLearning(1)
    const id = store.learningWords[0].id
    expect(store.masteredCount).toBe(0)
    store.handleCorrect(id)
    store.handleCorrect(id)
    store.handleCorrect(id)
    expect(store.masteredCount).toBe(1)
  })
})
