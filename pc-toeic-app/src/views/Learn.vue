<template>
  <div class="learn-page">
    <h1>Welcome Back</h1>
    <div class="card-container">
      <div class="glass-card clickable" @click="$router.push('/quiz')">Learn: 3576</div>
      <div class="glass-card clickable" @click="$router.push('/quiz')">Review: 192</div>
    </div>

    <div class="quote-container">
      <div class="quote-en">"{{ currentQuote.en }}"</div>
      <div class="quote-zh">{{ currentQuote.zh }}</div>
      <div class="quote-author">—— {{ currentQuote.author }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const quotes = [
  { en: "The roots of education are bitter, but the fruit is sweet.", zh: "教育的根是苦涩的，但其果实是甜美的。", author: "Aristotle (亚里士多德)" },
  { en: "Success is the sum of small efforts, repeated day in and day out.", zh: "成功是日复一日微小努力的积累。", author: "Robert Collier (罗伯特·柯里尔)" },
  { en: "Don't watch the clock; do what it does. Keep going.", zh: "不要紧盯时钟；学它一样，不停地向前迈进。", author: "Sam Levenson (萨姆·莱文森)" },
  { en: "The future depends on what you do today.", zh: "未来取决于你今天做什么。", author: "Mahatma Gandhi (圣雄甘地)" },
  { en: "Learning is a treasure that will follow its owner everywhere.", zh: "学习是一笔会跟随主人到任何地方的财富。", author: "Chinese Proverb (中国谚语)" },
  { en: "Believe you can and you're halfway there.", zh: "相信自己能做到，你就成功了一半。", author: "Theodore Roosevelt (西奥多·罗斯福)" }
]

const currentQuote = ref({})

onMounted(() => {
  const randomIndex = Math.floor(Math.random() * quotes.length)
  currentQuote.value = quotes[randomIndex]
})
</script>

<style scoped>
.learn-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.card-container {
  display: flex;
  gap: 20px;
  margin-top: 30px;
}

.glass-card {
  flex: 1;
  padding: 30px;
  background: rgba(0, 0, 0, 0.3); 
  border-radius: 12px;
  font-size: 28px; 
  font-weight: 600; 
  font-family: 'Trebuchet MS', 'Helvetica Neue', Arial, sans-serif; 
  letter-spacing: 1.5px; 
  color: #ffffff; 
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6); 
  display: flex;
  align-items: center;
}

/* 卡片点击悬浮效果 */
.clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}
.clickable:hover {
  transform: translateY(-5px); 
  background: rgba(0, 0, 0, 0.4); 
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}
.clickable:active {
  transform: scale(0.98); 
}

/* 金句区域 */
.quote-container {
  margin-top: 60px; 
  padding: 30px;
  background: rgba(255, 255, 255, 0.2); 
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}
.quote-en {
  font-size: 22px;
  font-weight: 600; 
  font-style: italic; 
  color: #000000; 
  margin-bottom: 12px;
  font-family: 'Georgia', serif; 
}
.quote-zh {
  font-size: 16px;
  font-weight: 500; 
  color: #222222; 
  margin-bottom: 20px;
  letter-spacing: 1px;
}
.quote-author {
  font-size: 14px;
  font-weight: bold; 
  color: #000000; 
  text-align: right; 
  margin-right: 20px;
}
</style>