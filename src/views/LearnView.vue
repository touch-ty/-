<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWordsStore } from '../stores/words'
import { usePaperStore } from '../stores/paper'
import type { SessionWord } from '../types'
import { useRouter, useRoute } from 'vue-router'

const wordsStore = useWordsStore()
const paperStore = usePaperStore()
const router = useRouter()
const route = useRoute()

const isPaperMode = computed(() => route.query.source === 'paper')
const isReviewMode = computed(() => route.query.mode === 'review')

const currentIndex = ref(0)
const showResult = ref(false)
const resultCorrect = ref(false)
const sessionWords = ref<SessionWord[]>([])
const selectedOption = ref('')
const checked = ref(false)
const showDictionary = ref(false)
const showBatchComplete = ref(false)
const shakeOption = ref('')

// 学习会话快照，隔离后续导入的新单词
const sessionTotalCount = ref(0)
const sessionAllWordsPool = ref<{ id: number; meaning: string }[]>([])
const sessionReviewCorrect = ref(0)

const sessionMasteredCount = computed(() => {
  if (isReviewMode.value) {
    return sessionReviewCorrect.value
  }
  return sessionWords.value.filter(w => {
    if (isPaperMode.value) {
      return paperStore.paperMasteredIds.has(String(w.id))
    }
    return wordsStore.masteredWordIds.has(String(w.id))
  }).length
})

const currentWord = computed(() => sessionWords.value[currentIndex.value])

const round1Options = computed(() => {
  if (!currentWord.value) return []
  const others = sessionAllWordsPool.value
    .filter(w => w.id !== currentWord.value!.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.meaning)
  const options = [currentWord.value.meaning, ...others].sort(() => Math.random() - 0.5)
  return options
})

function startSession() {
  if (isPaperMode.value) {
    if (isReviewMode.value) {
      sessionWords.value = paperStore.startPaperReview(10).map(w => ({ ...w, round: 0 as const, correctCount: 0 }))
    } else {
      sessionWords.value = paperStore.startPaperLearning(10).map(w => ({ ...w, round: 0 as const, correctCount: 0 }))
    }
    sessionTotalCount.value = isReviewMode.value ? sessionWords.value.length : paperStore.paperTotalCount
    sessionAllWordsPool.value = paperStore.paperWordBank.map(w => ({ id: w.id, meaning: w.meaning }))
  } else {
    if (isReviewMode.value) {
      sessionWords.value = wordsStore.startReview(10).map(w => ({ ...w, round: 0 as const, correctCount: 0 }))
    } else {
      sessionWords.value = wordsStore.startLearning(10).map(w => ({ ...w, round: 0 as const, correctCount: 0 }))
    }
    sessionTotalCount.value = isReviewMode.value ? sessionWords.value.length : wordsStore.totalCount
    sessionAllWordsPool.value = wordsStore.allWords.map(w => ({ id: w.id, meaning: w.meaning }))
  }
  sessionReviewCorrect.value = 0
  currentIndex.value = 0
  showResult.value = false
  showDictionary.value = false
  showBatchComplete.value = false
  selectedOption.value = ''
  checked.value = false
}

function selectRound1(opt: string) {
  if (checked.value) return
  selectedOption.value = opt
  const correct = opt === currentWord.value?.meaning
  resultCorrect.value = correct
  checked.value = true

  if (!correct) {
    shakeOption.value = opt
    setTimeout(() => { shakeOption.value = '' }, 500)
  }

  // 无论对错都弹出沉浸式字典
  showDictionary.value = true
}

function handleCorrect(wordId: number) {
  if (isPaperMode.value) {
    paperStore.handlePaperCorrect(wordId)
  } else {
    wordsStore.handleCorrect(wordId)
  }
  if (isReviewMode.value) {
    sessionReviewCorrect.value++
  }
}

function handleIncorrect(wordId: number) {
  if (isPaperMode.value) {
    paperStore.handlePaperIncorrect(wordId)
  } else {
    wordsStore.handleIncorrect(wordId)
  }
}

function continueFromDictionary() {
  showDictionary.value = false
  if (currentWord.value) {
    if (resultCorrect.value) {
      handleCorrect(currentWord.value.id)
    } else {
      handleIncorrect(currentWord.value.id)
    }
  }

  if (isPaperMode.value) {
    // Paper 模式：一轮即毕业，直接下一词
    nextWord()
    return
  }

  setTimeout(() => {
    nextWord()
  }, 300)
}

function checkRound2(answer: string) {
  if (!currentWord.value) return
  const correct = answer === 'know'
  resultCorrect.value = correct
  showResult.value = true
  if (correct) {
    handleCorrect(currentWord.value.id)
  } else {
    handleIncorrect(currentWord.value.id)
  }
  setTimeout(() => {
    nextWord()
  }, correct ? 800 : 1500)
}

function checkRound3(answer: string) {
  if (!currentWord.value) return
  const correct = answer === 'know'
  resultCorrect.value = correct
  showResult.value = true
  if (correct) {
    handleCorrect(currentWord.value.id)
  } else {
    handleIncorrect(currentWord.value.id)
  }
  setTimeout(() => {
    nextWord()
  }, correct ? 800 : 1500)
}

function nextWord() {
  showResult.value = false
  checked.value = false
  selectedOption.value = ''
  if (currentIndex.value < sessionWords.value.length - 1) {
    currentIndex.value++
  } else {
    finishSession()
  }
}

function finishSession() {
  sessionWords.value = []
  currentIndex.value = 0
  showBatchComplete.value = true
}

const currentRound = computed(() => {
  if (!currentWord.value) return 0
  if (isPaperMode.value) return 0
  return currentWord.value.correctCount
})

if (sessionWords.value.length === 0) {
  startSession()
}
</script>

<template>
  <div class="learn-container">
    <!-- 顶部进度 -->
    <div class="progress-bar" v-if="sessionWords.length > 0 && !showBatchComplete">
      <div class="progress-header">
        <div class="progress-label">
          <span>已掌握</span>
          <span>{{ sessionMasteredCount }} / {{ sessionTotalCount }}</span>
        </div>
        <button class="exit-btn" @click="router.push(isPaperMode ? '/paper' : '/')">退出学习</button>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${(sessionMasteredCount / Math.max(sessionTotalCount, 1)) * 100}%` }"></div>
      </div>
    </div>

    <!-- 学习主体 -->
    <div v-if="sessionWords.length > 0 && !showBatchComplete" class="learn-content">
      <!-- 单词卡片 -->
      <div class="word-card glass-card" v-if="currentWord">
        <h2 class="word-text">{{ currentWord.word }}</h2>
        <p class="word-phonetic" v-if="currentWord.phonetic">{{ currentWord.phonetic }}</p>
      </div>

      <!-- Round 1: 初识 - 看英选义 -->
      <div v-if="currentRound === 0" class="options-grid">
        <button
          v-for="(opt, idx) in round1Options"
          :key="idx"
          class="option-btn"
          :class="{
            selected: !checked && selectedOption === opt,
            correct: checked && currentWord && opt === currentWord.meaning,
            wrong: checked && selectedOption === opt && currentWord && opt !== currentWord.meaning,
            shake: shakeOption === opt
          }"
          @click="selectRound1(opt)"
          :disabled="checked"
        >
          {{ opt }}
        </button>
      </div>

      <!-- Round 2: 回想 - 盲测（四六级模式） -->
      <div v-if="!isPaperMode && currentRound === 1" class="options-grid binary">
        <p class="round-hint">你还记得这个单词的意思吗？</p>
        <div class="binary-buttons">
          <button class="action-btn correct" @click="checkRound2('know')">认识</button>
          <button class="action-btn wrong" @click="checkRound2('unknow')">不认识</button>
        </div>
      </div>

      <!-- Round 3: 巩固 - 汉译英回想（四六级模式） -->
      <div v-if="!isPaperMode && currentRound === 2" class="options-grid binary">
        <p class="round-hint">看到释义，你能想起对应的英文单词吗？</p>
        <p class="round-meaning">{{ currentWord?.meaning }}</p>
        <div class="binary-buttons">
          <button class="action-btn correct" @click="checkRound3('know')">认识</button>
          <button class="action-btn wrong" @click="checkRound3('unknow')">不认识</button>
        </div>
      </div>

      <!-- 结果提示 -->
      <div v-if="showResult && !showDictionary" class="result-toast" :class="{ correct: resultCorrect, wrong: !resultCorrect }">
        <span class="result-icon">{{ resultCorrect ? '✅' : '❌' }}</span>
        <span>{{ resultCorrect ? '回答正确！' : '回答错误，该单词将回滚重学' }}</span>
      </div>
    </div>

    <!-- 沉浸式字典弹窗 -->
    <div v-if="showDictionary && currentWord" class="dictionary-overlay" @click.self="continueFromDictionary">
      <div class="dictionary-card glass-card">
        <h2 class="dict-word">{{ currentWord.word }}</h2>
        <p class="dict-phonetic" v-if="currentWord.phonetic">{{ currentWord.phonetic }}</p>
        <p class="dict-meaning">{{ currentWord.meaning }}</p>

        <div v-if="currentWord.explanation" class="dict-section">
          <h4>详细解析</h4>
          <p class="dict-explanation">{{ currentWord.explanation }}</p>
        </div>

        <div v-if="currentWord.translations && currentWord.translations.length > 1" class="dict-section">
          <h4>多重释义</h4>
          <p v-for="(t, i) in currentWord.translations.slice(1)" :key="i" class="dict-translation">{{ t }}</p>
        </div>

        <div v-if="currentWord.sentences && currentWord.sentences.length" class="dict-section">
          <h4>例句</h4>
          <div v-for="(s, i) in currentWord.sentences" :key="i" class="detail-sentence">
            <p class="sentence-en">{{ s.en }}</p>
            <p class="sentence-cn">{{ s.cn }}</p>
          </div>
        </div>

        <div v-if="currentWord.phrases && currentWord.phrases.length" class="dict-section">
          <h4>短语搭配</h4>
          <div v-for="(p, i) in currentWord.phrases" :key="i" class="detail-phrase">
            <span>{{ p.en }}</span> — <span>{{ p.cn }}</span>
          </div>
        </div>

        <div v-if="currentWord.syno && currentWord.syno.length" class="dict-section">
          <h4>近义词</h4>
          <p class="dict-tags">{{ currentWord.syno.join('、') }}</p>
        </div>

        <div v-if="currentWord.wordFamily && currentWord.wordFamily.length" class="dict-section">
          <h4>同根词</h4>
          <p class="dict-tags">{{ currentWord.wordFamily.join('、') }}</p>
        </div>

        <button class="continue-btn" @click="continueFromDictionary">
          继续
        </button>
      </div>
    </div>

    <!-- 批次结算弹窗 -->
    <div v-if="showBatchComplete" class="batch-complete-overlay">
      <div class="batch-complete-card glass-card">
        <span class="complete-icon">🎉</span>
        <h2>本批次完成！</h2>
        <p>已完成 {{ sessionTotalCount }} 个单词的三轮验收</p>
        <div class="batch-actions">
          <button class="glass-btn glass-btn-outline" @click="router.push(isPaperMode ? '/paper' : '/')">{{ isPaperMode ? '返回论文' : '返回大厅' }}</button>
          <button class="glass-btn glass-btn-primary" @click="startSession">继续下一批</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.learn-container {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-top: 16px;
}

/* 顶部进度条 */
.progress-bar {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
}

.exit-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 8px;
  padding: 4px 12px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 12px;
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.progress-track {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* 单词卡片 */
.word-card {
  text-align: center;
  padding: 48px 32px;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
}

.word-text {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

.word-phonetic {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
}

/* 选项按钮 */
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.options-grid.binary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.binary-buttons {
  display: flex;
  justify-content: center;
  gap: 32px;
  width: 100%;
}

.option-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 20px 24px;
  font-size: 17px;
  font-weight: 500;
  color: #fff;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  max-height: calc(1.4em * 3 + 44px);
}

.option-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.option-btn.selected {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.option-btn.correct {
  border-color: #4ade80;
  background: rgba(74, 222, 128, 0.2);
}

.option-btn.wrong {
  border-color: #f87171;
  background: rgba(248, 113, 113, 0.2);
}

.option-btn.shake {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

/* 认识/不认识按钮 */
.action-btn {
  flex: 1;
  max-width: 200px;
  padding: 16px 0;
  background: transparent;
  border: none;
  border-bottom: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 0;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.action-btn.correct {
  border-bottom-color: #4ade80;
}

.action-btn.wrong {
  border-bottom-color: #f87171;
}

.action-btn.correct:hover {
  border-bottom-width: 6px;
  border-bottom-color: #86efac;
}

.action-btn.wrong:hover {
  border-bottom-width: 6px;
  border-bottom-color: #fca5a5;
}

.round-hint {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 8px;
}

.round-meaning {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  text-align: center;
}

/* 结果提示 */
.result-toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
  animation: slideUp 0.3s ease;
}

.result-toast.correct {
  background: rgba(34, 197, 94, 0.6);
  border: 1px solid rgba(34, 197, 94, 0.8);
}

.result-toast.wrong {
  background: rgba(239, 68, 68, 0.6);
  border: 1px solid rgba(239, 68, 68, 0.8);
}

@keyframes slideUp {
  from { transform: translateX(-50%) translateY(20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

/* 沉浸式字典 */
.dictionary-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 24px;
}

.dictionary-card {
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 40px;
  text-align: center;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.dictionary-card::-webkit-scrollbar {
  width: 4px;
}

.dictionary-card::-webkit-scrollbar-track {
  background: transparent;
}

.dictionary-card::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.dictionary-card::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.dict-word {
  font-size: 36px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 4px;
}

.dict-phonetic {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 12px;
}

.dict-meaning {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dict-section {
  text-align: left;
  margin-bottom: 20px;
}

.dict-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.detail-sentence {
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.sentence-en {
  font-size: 15px;
  color: #fff;
  margin-bottom: 4px;
  line-height: 1.5;
}

.sentence-cn {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

.detail-phrase {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
}

.dict-tags {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

.continue-btn {
  width: 100%;
  margin-top: 24px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.continue-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
}

/* 批次结算 */
.batch-complete-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(12px);
}

.batch-complete-card {
  text-align: center;
  padding: 64px 48px;
  max-width: 420px;
  width: 100%;
}

.complete-icon {
  font-size: 56px;
  display: block;
  margin-bottom: 16px;
}

.batch-complete-card h2 {
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.batch-complete-card p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 32px;
}

.batch-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.glass-btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.glass-btn-primary {
  background: #fff;
  color: #1a1a1a;
}

.glass-btn-primary:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.9);
}

.glass-btn-outline {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.glass-btn-outline:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
