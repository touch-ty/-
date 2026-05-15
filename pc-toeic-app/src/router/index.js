import { createRouter, createWebHistory } from 'vue-router'
import Learn from '../views/Learn.vue'
import Paper from '../views/Paper.vue'
import Forum from '../views/Forum.vue'
import Quiz from '../views/Quiz.vue'

const routes = [
  { path: '/', component: Learn },
  { path: '/paper', component: Paper },
  { path: '/forum', component: Forum },
  { path: '/quiz', component: Quiz }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router