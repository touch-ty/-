<template>
  <div class="quiz-page">
    <div class="quiz-board">
      
      <div class="header">
        <div class="left-action" @click="goBack">
          <span class="back-arrow">〈</span>
          <span class="progress">0/10</span>
        </div>
        <div class="right-actions">
          <span class="action-btn">↺</span>
          <span class="action-btn">☆</span>
          <span class="action-btn text-btn">熟</span>
          <span class="action-btn">···</span>
        </div>
      </div>

      <div class="word-section">
        <h1 class="word-title">pizza</h1>
        <div class="phonetic-row">
          <span class="accent-tag">英 🔊</span>
          <span class="phonetic-text">/'pi:tsə/</span>
        </div>
        <p class="hint-text">先回想词义再选择，想不起来「看答案」</p>
      </div>

      <div class="options-container">
        <div 
          class="option-card" 
          v-for="(item, index) in options" 
          :key="index"
        >
          <div class="pos">{{ item.pos }}</div>
          <div class="meaning">{{ item.meaning }}</div>
        </div>
      </div>

      <div class="footer-action">
        <span class="show-answer-btn">看答案</span>
        <div class="underline"></div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const options = [
  { pos: 'n.', meaning: '披萨饼' },
  { pos: 'vi.', meaning: '嘶嘶地冒泡' },
  { pos: 'adj.', meaning: '眩晕的；快得令人眩晕的；笨的' },
  { pos: 'n.', meaning: '广场，集市；购物中心' }
]
</script>

<style scoped>
.quiz-page {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(30, 30, 30, 0.6); 
  border-radius: 20px;
}
.quiz-board {
  width: 480px;
  height: 800px;
  background: linear-gradient(180deg, #3a3d42 0%, #2b2c2f 100%);
  border-radius: 24px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  color: #ffffff;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  color: #a0a0a0;
  margin-bottom: 40px;
}
.left-action {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: color 0.2s;
}
.left-action:hover { color: #ffffff; }
.back-arrow { font-size: 20px; }
.right-actions {
  display: flex;
  gap: 15px;
  align-items: center;
  font-size: 20px;
}
.action-btn { cursor: pointer; }
.action-btn:hover { color: #ffffff; }
.text-btn { font-size: 16px; font-weight: bold; }
.word-section { margin-bottom: 40px; }
.word-title {
  font-size: 54px;
  font-weight: bold;
  margin: 0 0 10px 0;
  letter-spacing: 2px;
}
.phonetic-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 25px;
}
.accent-tag {
  background: rgba(255, 255, 255, 0.15);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #dcdcdc;
}
.phonetic-text {
  font-size: 18px;
  color: #a0a0a0;
  font-family: 'Times New Roman', Times, serif;
}
.hint-text {
  font-size: 14px;
  color: #707070;
}
.options-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex-grow: 1;
}
.option-card {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.option-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}
.pos {
  font-size: 14px;
  color: #888888;
  margin-bottom: 8px;
  font-weight: bold;
}
.meaning {
  font-size: 18px;
  color: #e0e0e0;
}
.footer-action {
  text-align: center;
  padding-bottom: 10px;
  cursor: pointer;
}
.show-answer-btn {
  font-size: 18px;
  color: #ffffff;
  letter-spacing: 2px;
}
.underline {
  width: 20px;
  height: 3px;
  background-color: #ff4d4f;
  margin: 8px auto 0;
  border-radius: 2px;
}
</style>