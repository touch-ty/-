<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWordsStore } from '../stores/words'
import type { SessionWord } from '../stores/words'
import { useRouter } from 'vue-router'

const wordsStore = useWordsStore()
const router = useRouter()

const currentIndex = ref(0)
const showResult = ref(false)
const resultCorrect = ref(false)
const sessionWords = ref<SessionWord[]>([])
const selectedOption = ref('')
const checked = ref(false)
const showDictionary = ref(false)
const showSpellingPrompt = ref(false)
const showSpellingTest = ref(false)
const spellInput = ref('')
const spellingWords = ref<SessionWord[]>([])
const spellingIndex = ref(0)
const isRetestMode = ref(false)
const shakeOption = ref('')

const currentWord = computed(() => {
  if (showSpellingTest.value) {
    return spellingWords.value[spellingIndex.value]
  }
  return sessionWords.value[currentIndex.value]
})

// 从词库中查找完整单词信息，确保弹窗显示完整数据
const fullCurrentWord = computed(() => {
  if (!currentWord.value) return undefined
  return wordsStore.allWords.find(w => w.id === currentWord.value!.id) || currentWord.value
})

const round1Options = computed(() => {
  if (!currentWord.value) return []
  const others = wordsStore.allWords
    .filter(w => w.id !== currentWord.value!.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.meaning)
  const options = [currentWord.value.meaning, ...others].sort(() => Math.random() - 0.5)
  return options
})

const masteredCount = computed(() => wordsStore.masteredCount)
const totalCount = computed(() => wordsStore.totalCount)

function startSession() {
  let words = wordsStore.startReview(10).map(w => ({ ...w, round: 0 as const, correctCount: 0 }))
  if (words.length === 0) {
    // 优先从词库中随机取完整单词作为测试数据
    if (wordsStore.allWords.length > 0) {
      words = wordsStore.allWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 5)
        .map(w => ({ ...w, round: 0 as const, correctCount: 0, lastReviewed: Date.now() - 1000 * 60 * 60 * 25 }))
    } else {
      // 词库未加载时的兜底数据
      words = [
        {
          id: 9991, word: 'abandon', meaning: '放弃，抛弃', phonetic: '/əˈbændən/', level: 'cet4',
          round: 0, correctCount: 0, lastReviewed: Date.now() - 1000 * 60 * 60 * 25,
          sentences: [
            { en: 'They had to abandon their car and walk the rest of the way.', cn: '他们不得不弃车步行剩下的路程。' },
            { en: 'The project was abandoned due to lack of funding.', cn: '由于缺乏资金，该项目被放弃了。' }
          ],
          phrases: [
            { en: 'abandon ship', cn: '弃船' },
            { en: 'with abandon', cn: '放纵地，尽情地' }
          ],
          syno: ['desert', 'forsake', 'quit'],
          wordFamily: ['abandonment', 'abandoned']
        },
        {
          id: 9992, word: 'ability', meaning: '能力，才能', phonetic: '/əˈbɪləti/', level: 'cet4',
          round: 0, correctCount: 0, lastReviewed: Date.now() - 1000 * 60 * 60 * 48,
          sentences: [
            { en: 'She has the ability to solve complex problems quickly.', cn: '她有能力快速解决复杂问题。' },
            { en: 'The test measures your ability to reason logically.', cn: '这项测试衡量你的逻辑推理能力。' }
          ],
          phrases: [
            { en: 'to the best of one\'s ability', cn: '竭尽全力' }
          ],
          syno: ['capability', 'capacity', 'competence'],
          wordFamily: ['able', 'unable', 'ably']
        },
        {
          id: 9993, word: 'absolute', meaning: '绝对的，完全的', phonetic: '/ˈæbsəluːt/', level: 'cet4',
          round: 0, correctCount: 0, lastReviewed: Date.now() - 1000 * 60 * 60 * 30,
          sentences: [
            { en: 'I have absolute confidence in your judgment.', cn: '我对你的判断有绝对的信心。' },
            { en: 'There was absolute silence in the room.', cn: '房间里一片寂静。' }
          ],
          phrases: [
            { en: 'absolute zero', cn: '绝对零度' }
          ],
          syno: ['complete', 'total', 'utter'],
          wordFamily: ['absolutely']
        },
        {
          id: 9994, word: 'academic', meaning: '学术的，学院的', phonetic: '/ˌækəˈdemɪk/', level: 'cet4',
          round: 0, correctCount: 0, lastReviewed: Date.now() - 1000 * 60 * 60 * 50,
          sentences: [
            { en: 'The university has high academic standards.', cn: '这所大学有很高的学术标准。' },
            { en: 'His academic performance improved significantly this semester.', cn: '这学期他的学业成绩显著提高。' }
          ],
          phrases: [
            { en: 'academic year', cn: '学年' },
            { en: 'academic research', cn: '学术研究' }
          ],
          syno: ['scholarly', 'educational', 'theoretical'],
          wordFamily: ['academy', 'academically']
        },
        {
          id: 9995, word: 'acceptable', meaning: '可接受的，合意的', phonetic: '/əkˈseptəbl/', level: 'cet4',
          round: 0, correctCount: 0, lastReviewed: Date.now() - 1000 * 60 * 60 * 26,
          sentences: [
            { en: 'The food was acceptable but not outstanding.', cn: '食物还可以，但并不出众。' },
            { en: 'We need to find an acceptable solution for everyone.', cn: '我们需要找到一个对所有人都可接受的解决方案。' }
          ],
          phrases: [
            { en: 'socially acceptable', cn: '社会上可接受的' }
          ],
          syno: ['satisfactory', 'adequate', 'tolerable'],
          wordFamily: ['accept', 'acceptance', 'acceptably']
        }
      ]
    }
  }
  sessionWords.value = words as SessionWord[]
  currentIndex.value = 0
  showResult.value = false
  showDictionary.value = false
  showSpellingPrompt.value = false
  showSpellingTest.value = false
  spellInput.value = ''
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

function continueFromDictionary() {
  showDictionary.value = false
  if (currentWord.value) {
    if (resultCorrect.value) {
      wordsStore.handleCorrect(currentWord.value.id)
    } else {
      wordsStore.handleIncorrect(currentWord.value.id)
    }
  }
  setTimeout(() => {
    nextWord()
  }, 300)
}

function playAudio() {
  // 模拟播放音频
  const utterance = new SpeechSynthesisUtterance(currentWord.value?.word || '')
  utterance.lang = 'en-US'
  window.speechSynthesis.speak(utterance)
}

function checkRound2(answer: string) {
  if (!currentWord.value) return
  const correct = answer === 'know'
  resultCorrect.value = correct
  showResult.value = true
  if (correct) {
    wordsStore.handleCorrect(currentWord.value.id)
  } else {
    wordsStore.handleIncorrect(currentWord.value.id)
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
  showSpellingPrompt.value = true
}

function startSpellingTest() {
  showSpellingPrompt.value = false
  spellingWords.value = [...wordsStore.wrongSpellingList]
  if (spellingWords.value.length === 0) {
    // 如果没有错词，用当前学习过的词
    spellingWords.value = wordsStore.learningWords.slice(0, 10).map(w => ({ ...w, round: 0, correctCount: 0 }))
  }
  spellingIndex.value = 0
  isRetestMode.value = false
  showSpellingTest.value = true
  spellInput.value = ''
}

function skipSpellingTest() {
  showSpellingPrompt.value = false
  router.push('/')
}

function submitSpelling() {
  if (!currentWord.value) return
  const correct = spellInput.value.trim().toLowerCase() === currentWord.value.word.toLowerCase()
  resultCorrect.value = correct
  showResult.value = true

  if (!correct) {
    wordsStore.addToWrongSpelling(currentWord.value)
  } else if (isRetestMode.value) {
    wordsStore.removeFromWrongSpelling(currentWord.value.id)
  }

  setTimeout(() => {
    showResult.value = false
    spellInput.value = ''
    if (spellingIndex.value < spellingWords.value.length - 1) {
      spellingIndex.value++
    } else if (!correct && !isRetestMode.value) {
      // 首轮拼写结束，有错词，进入重测模式
      const wrongWords = wordsStore.wrongSpellingList
      if (wrongWords.length > 0) {
        spellingWords.value = [...wrongWords]
        spellingIndex.value = 0
        isRetestMode.value = true
      } else {
        showSpellingTest.value = false
      }
    } else if (isRetestMode.value && wordsStore.wrongSpellingList.length > 0) {
      // 重测模式结束但还有错词，继续重测
      spellingWords.value = [...wordsStore.wrongSpellingList]
      spellingIndex.value = 0
    } else {
      showSpellingTest.value = false
    }
  }, correct ? 800 : 1500)
}

const currentRound = computed(() => {
  if (!currentWord.value) return 0
  return currentWord.value.correctCount
})

if (sessionWords.value.length === 0) {
  startSession()
}
</script>

<template>
  <div class="review-container">
    <!-- 顶部进度 -->
    <div class="progress-bar" v-if="(sessionWords.length > 0 || showSpellingTest) && !showSpellingPrompt">
      <div class="progress-label">
        <span>已掌握</span>
        <span>{{ masteredCount }} / {{ totalCount }}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: `${(masteredCount / Math.max(totalCount, 1)) * 100}%` }"></div>
      </div>
    </div>

    <!-- 复习主体 -->
    <div v-if="sessionWords.length > 0 && !showSpellingPrompt && !showSpellingTest" class="review-content">
      <!-- 单词卡片 -->
      <div class="word-card glass-card" v-if="currentWord">
        <h2 class="word-text">{{ currentWord.word }}</h2>
        <p class="word-phonetic" v-if="currentWord.phonetic">{{ currentWord.phonetic }}</p>
      </div>

      <!-- Round 1: 看英选义 -->
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

      <!-- Round 2: 听音辨义 -->
      <div v-if="currentRound === 1" class="listen-section">
        <p class="round-hint">请听发音，选择对应的中文释义</p>
        <button class="play-btn" @click="playAudio">
          <span class="play-icon">🔊</span>
          <span>播放发音</span>
        </button>
        <div class="options-grid">
          <button
            v-for="(opt, idx) in round1Options"
            :key="idx"
            class="option-btn"
            :class="{
              selected: !checked && selectedOption === opt,
              correct: checked && currentWord && opt === currentWord.meaning,
              wrong: checked && selectedOption === opt && currentWord && opt !== currentWord.meaning
            }"
            @click="selectRound1(opt)"
            :disabled="checked"
          >
            {{ opt }}
          </button>
        </div>
      </div>

      <!-- 结果提示 -->
      <div v-if="showResult" class="result-toast" :class="{ correct: resultCorrect, wrong: !resultCorrect }">
        <span class="result-icon">{{ resultCorrect ? '✅' : '❌' }}</span>
        <span>{{ resultCorrect ? '回答正确！' : '回答错误，该单词将回滚重学' }}</span>
      </div>
    </div>

    <!-- 沉浸式字典弹窗 -->
    <div v-if="showDictionary && fullCurrentWord" class="dictionary-overlay" @click.self="continueFromDictionary">
      <div class="dictionary-card glass-card">
        <h2 class="dict-word">{{ fullCurrentWord.word }}</h2>
        <p class="dict-phonetic" v-if="fullCurrentWord.phonetic">{{ fullCurrentWord.phonetic }}</p>
        <p class="dict-meaning">{{ fullCurrentWord.meaning }}</p>

        <div v-if="fullCurrentWord.sentences && fullCurrentWord.sentences.length" class="dict-section">
          <h4>例句</h4>
          <div v-for="(s, i) in fullCurrentWord.sentences" :key="i" class="detail-sentence">
            <p class="sentence-en">{{ s.en }}</p>
            <p class="sentence-cn">{{ s.cn }}</p>
          </div>
        </div>

        <div v-if="fullCurrentWord.phrases && fullCurrentWord.phrases.length" class="dict-section">
          <h4>短语搭配</h4>
          <div v-for="(p, i) in fullCurrentWord.phrases" :key="i" class="detail-phrase">
            <span>{{ p.en }}</span> — <span>{{ p.cn }}</span>
          </div>
        </div>

        <div v-if="fullCurrentWord.syno && fullCurrentWord.syno.length" class="dict-section">
          <h4>近义词</h4>
          <p class="dict-tags">{{ fullCurrentWord.syno.join('、') }}</p>
        </div>

        <div v-if="fullCurrentWord.wordFamily && fullCurrentWord.wordFamily.length" class="dict-section">
          <h4>同根词</h4>
          <p class="dict-tags">{{ fullCurrentWord.wordFamily.join('、') }}</p>
        </div>

        <button class="continue-btn" @click="continueFromDictionary">
          继续
        </button>
      </div>
    </div>

    <!-- 拼写测试询问 -->
    <div v-if="showSpellingPrompt" class="spelling-prompt-overlay">
      <div class="spelling-prompt-card glass-card">
        <span class="prompt-icon">✍️</span>
        <h2>是否进行拼写测试巩固？</h2>
        <p>通过拼写可以进一步加深对单词的记忆</p>
        <div class="prompt-actions">
          <button class="glass-btn glass-btn-outline" @click="skipSpellingTest">跳过</button>
          <button class="glass-btn glass-btn-primary" @click="startSpellingTest">开始拼写</button>
        </div>
      </div>
    </div>

    <!-- 拼写测试 -->
    <div v-if="showSpellingTest && currentWord" class="spelling-test">
      <div class="spelling-card glass-card">
        <p class="spelling-mode" v-if="isRetestMode">错词重测模式</p>
        <div class="spelling-header">
          <button class="play-btn-small" @click="playAudio">
            <span>🔊</span>
          </button>
          <p class="spelling-meaning">{{ currentWord.meaning }}</p>
        </div>
        <input
          v-model="spellInput"
          type="text"
          class="spelling-input"
          placeholder="请输入单词拼写"
          @keyup.enter="submitSpelling"
        />
        <button class="submit-btn" @click="submitSpelling" :disabled="!spellInput.trim()">
          提交
        </button>
      </div>

      <div v-if="showResult" class="result-toast" :class="{ correct: resultCorrect, wrong: !resultCorrect }">
        <span class="result-icon">{{ resultCorrect ? '✅' : '❌' }}</span>
        <span>{{ resultCorrect ? '拼写正确！' : '拼写错误，已加入错词重测列表' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.review-container {
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

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
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
}

.option-btn {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px 24px;
  font-size: 16px;
  font-weight: 500;
  color: #fff;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.option-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.option-btn.selected {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.option-btn.correct {
  border-color: rgba(74, 222, 128, 0.8);
  background: rgba(74, 222, 128, 0.2);
}

.option-btn.wrong {
  border-color: rgba(248, 113, 113, 0.8);
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

/* 听音辨义 */
.listen-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.play-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.play-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.play-icon {
  font-size: 24px;
}

.round-hint {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
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

/* 拼写询问 */
.spelling-prompt-overlay {
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

.spelling-prompt-card {
  text-align: center;
  padding: 64px 48px;
  max-width: 420px;
}

.prompt-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
}

.spelling-prompt-card h2 {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.spelling-prompt-card p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 32px;
}

.prompt-actions {
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

/* 拼写测试 */
.spelling-test {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
}

.spelling-card {
  width: 100%;
  max-width: 480px;
  padding: 40px;
  text-align: center;
}

.spelling-mode {
  font-size: 13px;
  color: #f87171;
  font-weight: 600;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.spelling-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.play-btn-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.play-btn-small:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

.spelling-meaning {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
}

.spelling-input {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  font-size: 18px;
  color: #fff;
  text-align: center;
  outline: none;
  transition: all 0.3s;
  margin-bottom: 16px;
}

.spelling-input:focus {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.12);
}

.spelling-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: rgba(34, 197, 94, 0.5);
  border: 1px solid rgba(34, 197, 94, 0.6);
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.6);
}

.submit-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
