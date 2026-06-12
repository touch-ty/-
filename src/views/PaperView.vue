<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePaperStore } from '../stores/paper'
import type { ExtractedWord } from '@/types'

const paperStore = usePaperStore()
const router = useRouter()

const showModal = ref(false)
const selectedWord = ref<ExtractedWord | null>(null)

function openWordModal(item: ExtractedWord) {
  selectedWord.value = item
  showModal.value = true
}

function closeWordModal() {
  showModal.value = false
  selectedWord.value = null
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  paperStore.extractWords(file, (partial) => {
    // 实时导入到论文独立词库（不再混入四六级词库）
    const paperWords = partial.map((w, i) => paperStore.convertToWord(w, Date.now() + i))
    paperStore.importToPaperBank(paperWords)
  }).catch(err => {
    const msg = err?.message || '未知错误'
    if (msg.includes('API Key') || msg.includes('api key') || msg.includes('OPENAI_API_KEY')) {
      alert('API Key 未配置：请在 words 目录下创建 .env 文件，添加 VITE_DASHSCOPE_API_KEY=你的密钥，然后重启服务')
    } else {
      alert('提取失败：' + msg)
    }
  })
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  paperStore.extractWords(file, (partial) => {
    // 实时导入到论文独立词库（不再混入四六级词库）
    const paperWords = partial.map((w, i) => paperStore.convertToWord(w, Date.now() + i))
    paperStore.importToPaperBank(paperWords)
  }).catch(err => {
    const msg = err?.message || '未知错误'
    if (msg.includes('API Key') || msg.includes('api key') || msg.includes('OPENAI_API_KEY')) {
      alert('API Key 未配置：请在 words 目录下创建 .env 文件，添加 VITE_DASHSCOPE_API_KEY=你的密钥，然后重启服务')
    } else {
      alert('提取失败：' + msg)
    }
  })
}

function startLearning() {
  if (paperStore.paperLearnCount === 0) {
    alert('当前没有待学习的单词，请先上传论文提取术语')
    return
  }
  router.push({ path: '/learn', query: { source: 'paper' } })
}

function startReview() {
  if (paperStore.paperReviewCount === 0) {
    alert('当前没有待复习的单词')
    return
  }
  router.push({ path: '/learn', query: { source: 'paper', mode: 'review' } })
}
</script>

<template>
  <div class="paper-container">
    <h1 class="page-title">Paper Management</h1>

    <div class="stats-row">
      <div class="stat-card" @click="startLearning">
        <div class="stat-label">Learn</div>
        <div class="stat-value">{{ paperStore.paperLearnCount }}</div>
      </div>
      <div class="stat-card" @click="startReview">
        <div class="stat-label">Review</div>
        <div class="stat-value">{{ paperStore.paperReviewCount }}</div>
      </div>
    </div>

    <div
      class="upload-area"
      @dragover.prevent
      @drop="handleDrop"
    >
      <input
        type="file"
        accept=".pdf,.doc,.docx,image/*"
        @change="handleFileUpload"
        id="paper-upload"
        class="hidden-input"
      />
      <label v-if="!paperStore.loading" for="paper-upload" class="upload-inner">
        <span class="upload-btn-primary">上传论文</span>
        <p class="upload-hint">或者拖放一个文件，</p>
        <p class="upload-subhint">支持PDF, Word 或 图片格式</p>
      </label>
      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p class="loading-text">正在解析文件并提取学术术语...</p>
      </div>
    </div>

    <div v-if="paperStore.showResults && paperStore.extractedWords.length" class="extracted-section">
      <div class="section-header">
        <h2>提取结果</h2>
        <button class="add-btn" @click="startLearning">开始学习</button>
      </div>
      <div class="words-list">
        <div v-for="(item, idx) in paperStore.extractedWords" :key="idx" class="word-card" @click="openWordModal(item)">
          <div class="word-main">
            <span class="word-original">{{ item.original }}</span>
            <span class="word-brief">{{ item.briefMeaning || '暂无释义' }}</span>
          </div>
          <div v-if="item.detailAnalysis" class="word-detail">{{ item.detailAnalysis }}</div>
          <div v-if="item.sentences && item.sentences.length" class="word-sentences">
            <div v-for="(s, si) in item.sentences.slice(0, 2)" :key="si" class="sentence-pair">
              <div class="en">{{ s.en }}</div>
              <div class="cn">{{ s.cn }}</div>
            </div>
          </div>
          <div v-if="item.context" class="word-context">上下文：{{ item.context }}</div>
        </div>
      </div>
    </div>

    <div v-if="paperStore.showResults && !paperStore.extractedWords.length && !paperStore.loading" class="empty-result">
      <p>未提取到学术术语，可能原因：</p>
      <ul>
        <li>文件内容为空或无法识别（扫描版 PDF 暂不支持）</li>
        <li>文件格式不受支持（请上传 PDF 或图片）</li>
        <li>文本中未包含硬核学术/技术概念</li>
      </ul>
    </div>

    <!-- 单词详情弹窗 -->
    <div v-if="showModal && selectedWord" class="word-modal-overlay" @click.self="closeWordModal">
      <div class="word-modal-card">
        <h2 class="modal-word">{{ selectedWord.original }}</h2>
        <p v-if="selectedWord.phonetic" class="modal-phonetic">{{ selectedWord.phonetic }}</p>
        <p class="modal-meaning">{{ selectedWord.briefMeaning || '暂无释义' }}</p>
        <div v-if="selectedWord.explanation || selectedWord.detailAnalysis" class="modal-section">
          <h4>详细解析</h4>
          <p>{{ selectedWord.explanation || selectedWord.detailAnalysis }}</p>
        </div>
        <div v-if="selectedWord.sentences && selectedWord.sentences.length" class="modal-section">
          <h4>双语例句</h4>
          <div v-for="(s, i) in selectedWord.sentences" :key="i" class="modal-sentence">
            <p class="modal-en">{{ s.en }}</p>
            <p class="modal-cn">{{ s.cn }}</p>
          </div>
        </div>
        <div v-if="selectedWord.context" class="modal-section">
          <h4>上下文</h4>
          <p>{{ selectedWord.context }}</p>
        </div>
        <button class="modal-close-btn" @click="closeWordModal">关闭</button>
      </div>
    </div>

  </div>
</template>

<style scoped>
.paper-container {
  width: 100%;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 24px;
}
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}
.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 32px 40px;
  transition: all 0.3s;
}
.stat-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}
.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}
.upload-area {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 48px;
  text-align: center;
  margin-bottom: 32px;
  transition: all 0.3s;
}
.upload-area:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}
.hidden-input {
  display: none;
}
.upload-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.upload-btn-primary {
  display: inline-block;
  padding: 14px 48px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 4px;
  text-align: center;
}
.upload-btn-primary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}
.upload-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}
.upload-subhint {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  margin: 0;
}
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  color: var(--text-secondary);
  font-size: 14px;
}
.extracted-section {
  margin-bottom: 32px;
}
.empty-result {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 32px 40px;
  color: var(--text-secondary);
  font-size: 14px;
}
.empty-result p {
  font-weight: 600;
  margin-bottom: 12px;
  color: #fff;
}
.empty-result ul {
  margin: 0;
  padding-left: 20px;
}
.empty-result li {
  margin-bottom: 6px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}
.add-btn {
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.9);
  color: #1a1a2e;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: var(--transition-fast);
}
.add-btn:hover {
  background: #fff;
  transform: translateY(-1px);
}
.words-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.word-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 20px 24px;
}
.word-main {
  display: flex;
  gap: 12px;
  align-items: baseline;
  margin-bottom: 4px;
}
.word-original {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}
.word-brief {
  font-size: 13px;
  color: var(--text-secondary);
}
.word-detail {
  font-size: 12px;
  color: rgba(255,255,255,0.6);
  margin-top: 4px;
  line-height: 1.5;
}
.word-sentences {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.sentence-pair {
  margin-bottom: 6px;
}
.sentence-pair .en {
  font-size: 12px;
  color: rgba(255,255,255,0.7);
}
.sentence-pair .cn {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.word-context {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 6px;
  font-style: italic;
}
.glass-panel {
  background: rgba(255,255,255,0.15);
  border-radius: 24px;
  box-shadow: 0 4px 30px rgba(0,0,0,0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.18);
}
.word-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.word-modal-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  padding: 32px;
  max-width: 560px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  color: #fff;
}
.modal-word {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}
.modal-phonetic {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.modal-meaning {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.modal-section {
  margin-bottom: 16px;
}
.modal-section h4 {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255,255,255,0.7);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.modal-section p {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255,255,255,0.85);
}
.modal-sentence {
  margin-bottom: 10px;
  padding: 10px 12px;
  background: rgba(255,255,255,0.06);
  border-radius: 10px;
}
.modal-en {
  font-size: 13px;
  color: rgba(255,255,255,0.9);
  margin-bottom: 4px;
}
.modal-cn {
  font-size: 12px;
  color: var(--text-secondary);
}
.modal-close-btn {
  margin-top: 8px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}
.modal-close-btn:hover {
  background: rgba(255,255,255,0.2);
}
</style>
