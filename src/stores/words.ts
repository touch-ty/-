import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cet4Words } from '../data/cet4'
import { cet6Words } from '../data/cet6'
import type { Word, SessionWord } from '../types'

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export const useWordsStore = defineStore('words', () => {
  const allWords = ref<Word[]>([])
  const learningWords = ref<SessionWord[]>([])
  const masteredWordIds = ref<Set<string>>(new Set())
  const learnedWordIds = ref<Set<string>>(new Set())
  const wrongSpellingList = ref<SessionWord[]>(safeParse('wrongSpellingList', []))

  function loadWords(level: 'cet4' | 'cet6') {
    const paperWords = allWords.value.filter(w => w.level === 'paper')
    if (level === 'cet4') {
      allWords.value = [...(cet4Words as Word[]), ...paperWords]
    } else {
      allWords.value = [...(cet6Words as Word[]), ...paperWords]
    }
  }

  function switchLevel(level: 'cet4' | 'cet6') {
    learningWords.value = []
    masteredWordIds.value.clear()
    learnedWordIds.value.clear()
    loadWords(level)
  }

  const learnCount = computed(() => {
    return allWords.value.filter(w => {
      const id = String(w.id)
      return !learnedWordIds.value.has(id) && !masteredWordIds.value.has(id)
    }).length
  })

  const reviewCount = computed(() => {
    return learningWords.value.filter(w => {
      if (!w.lastReviewed) return false
      const daysSince = (Date.now() - w.lastReviewed) / (1000 * 60 * 60 * 24)
      return daysSince >= 1
    }).length
  })

  const masteredCount = computed(() => masteredWordIds.value.size)
  const totalCount = computed(() => allWords.value.length)

  function startLearning(count: number = 10): SessionWord[] {
    const available = allWords.value.filter(w => {
      return !masteredWordIds.value.has(String(w.id))
    })
    const selected = available
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(w => ({
        ...w,
        round: 0,
        correctCount: 0,
        lastReviewed: undefined
      })) as SessionWord[]
    const existingIds = new Set(learningWords.value.map(w => String(w.id)))
    const newWords = selected.filter(w => !existingIds.has(String(w.id)))
    if (newWords.length > 0) {
      learningWords.value.push(...newWords.map(w => ({
        ...w,
        round: 0,
        correctCount: 0,
        lastReviewed: undefined
      })) as SessionWord[])
    }
    return selected
  }

  function startReview(count: number = 10): SessionWord[] {
    const available = learningWords.value.filter(w => {
      if (!w.lastReviewed) return false
      const daysSince = (Date.now() - w.lastReviewed) / (1000 * 60 * 60 * 24)
      return daysSince >= 1 && w.correctCount >= 3
    })
    const selected = available
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(w => ({
        ...w,
        round: 0,
        correctCount: 0
      })) as SessionWord[]
    return selected
  }

  function handleCorrect(wordId: number) {
    const idx = learningWords.value.findIndex(w => w.id === wordId)
    if (idx === -1) return
    const w = learningWords.value[idx]
    w.correctCount++
    w.lastReviewed = Date.now()
    if (w.correctCount >= 3) {
      masteredWordIds.value.add(String(wordId))
      learnedWordIds.value.add(String(wordId))
      // 保留在 learningWords 中，以便后续复习
    }
    w.round = w.correctCount
  }

  function handleIncorrect(wordId: number) {
    const idx = learningWords.value.findIndex(w => w.id === wordId)
    if (idx === -1) return
    const w = learningWords.value[idx]
    w.correctCount = 0
    w.round = 0
    const word = learningWords.value.splice(idx, 1)[0]
    learningWords.value.push(word)
  }

  function addToWrongSpelling(word: SessionWord) {
    const exists = wrongSpellingList.value.find(w => w.id === word.id)
    if (!exists) {
      wrongSpellingList.value.push({ ...word, round: 0, correctCount: 0 })
      localStorage.setItem('wrongSpellingList', JSON.stringify(wrongSpellingList.value.map(w => w.id)))
    }
  }

  function removeFromWrongSpelling(wordId: number) {
    const idx = wrongSpellingList.value.findIndex(w => w.id === wordId)
    if (idx !== -1) {
      wrongSpellingList.value.splice(idx, 1)
      localStorage.setItem('wrongSpellingList', JSON.stringify(wrongSpellingList.value.map(w => w.id)))
    }
  }

  function importPaperWords(words: Word[]) {
    for (const w of words) {
      if (!allWords.value.find(aw => aw.word.toLowerCase() === w.word.toLowerCase())) {
        allWords.value.push(w)
      }
    }
  }

  function getPaperWords(): Word[] {
    return allWords.value.filter(w => w.level === 'paper')
  }

  return {
    allWords,
    learningWords,
    masteredWordIds,
    learnedWordIds,
    wrongSpellingList,
    learnCount,
    reviewCount,
    masteredCount,
    totalCount,
    loadWords,
    switchLevel,
    startLearning,
    startReview,
    handleCorrect,
    handleIncorrect,
    addToWrongSpelling,
    removeFromWrongSpelling,
    importPaperWords,
    getPaperWords
  }
})
