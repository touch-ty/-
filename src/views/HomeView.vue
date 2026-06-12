<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWordsStore } from '../stores/words'

const router = useRouter()
const wordsStore = useWordsStore()

const quotes = [
  { text: 'The future depends on what you do today.', translation: '未来取决于你今天做什么。', author: 'Mahatma Gandhi (圣雄甘地)' },
  { text: 'Knowledge is power.', translation: '知识就是力量。', author: 'Francis Bacon (弗朗西斯·培根)' },
  { text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', translation: '像明天就要死去一样活着，像永远活着一样学习。', author: 'Mahatma Gandhi (圣雄甘地)' },
  { text: 'The only true wisdom is in knowing you know nothing.', translation: '唯一真正的智慧是知道自己一无所知。', author: 'Socrates (苏格拉底)' },
  { text: 'Education is the most powerful weapon which you can use to change the world.', translation: '教育是你用来改变世界的最强大的武器。', author: 'Nelson Mandela (纳尔逊·曼德拉)' },
  { text: 'A journey of a thousand miles begins with a single step.', translation: '千里之行，始于足下。', author: 'Lao Tzu (老子)' },
  { text: 'The beautiful thing about learning is that no one can take it away from you.', translation: '学习的美妙之处在于没有人能从你身上夺走它。', author: 'B.B. King (B.B.金)' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', translation: '只要不停下来，走得多慢都没关系。', author: 'Confucius (孔子)' },
  { text: 'Genius is one percent inspiration and ninety-nine percent perspiration.', translation: '天才是百分之一的灵感加百分之九十九的汗水。', author: 'Thomas Edison (托马斯·爱迪生)' },
  { text: 'The more that you read, the more things you will know.', translation: '你读得越多，你知道的东西就越多。', author: 'Dr. Seuss (苏斯博士)' }
]

const currentQuote = ref(quotes[1])

function changeQuote() {
  let next = quotes[Math.floor(Math.random() * quotes.length)]
  while (next.text === currentQuote.value.text && quotes.length > 1) {
    next = quotes[Math.floor(Math.random() * quotes.length)]
  }
  currentQuote.value = next
}

onMounted(() => {
  changeQuote()
})
</script>

<template>
  <div class="home-container">
    <header class="home-header">
      <h1 class="page-title">Welcome Back</h1>
    </header>

    <div class="stats-row">
      <div class="stat-card glass-card clickable" @click="router.push('/learn')">
        <p class="stat-label">Learn</p>
        <p class="stat-value">{{ wordsStore.learnCount }}</p>
      </div>
      <div class="stat-card glass-card clickable" @click="router.push('/review')">
        <p class="stat-label">Review</p>
        <p class="stat-value">{{ wordsStore.reviewCount }}</p>
      </div>
    </div>

    <div class="quote-card glass-card">
      <p class="quote-text">"{{ currentQuote.text }}"</p>
      <p class="quote-translation">{{ currentQuote.translation }}</p>
      <p class="quote-author">—— {{ currentQuote.author }}</p>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  width: 100%;
}

.home-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 32px 40px;
  transition: all 0.3s;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

.stat-card.clickable {
  cursor: pointer;
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

.quote-card {
  padding: 48px;
  text-align: center;
}

.quote-text {
  font-size: 18px;
  font-weight: 500;
  color: var(--text-primary);
  font-style: italic;
  margin-bottom: 16px;
  line-height: 1.6;
}

.quote-translation {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.quote-author {
  font-size: 13px;
  color: var(--text-muted);
  text-align: right;
}
</style>
