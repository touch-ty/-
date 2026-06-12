import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true }
    },
    {
      path: '/select-level',
      name: 'select-level',
      component: () => import('../views/LevelSelectView.vue'),
      meta: { title: '选择等级' }
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: '学习大厅' }
    },
    {
      path: '/learn',
      name: 'learn',
      component: () => import('../views/LearnView.vue'),
      meta: { title: '单词学习' }
    },
    {
      path: '/review',
      name: 'review',
      component: () => import('../views/ReviewView.vue'),
      meta: { title: '强化复习' }
    },
    {
      path: '/paper',
      name: 'paper',
      component: () => import('../views/PaperView.vue'),
      meta: { title: '论文管理' }
    },
    {
      path: '/forum',
      name: 'forum',
      component: () => import('../views/ForumView.vue'),
      meta: { title: '交流论坛' }
    },
    {
      path: '/forum/:id',
      name: 'post-detail',
      component: () => import('../views/PostDetailView.vue'),
      meta: { title: '帖子详情' }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (!to.meta.public && !authStore.isLoggedIn) {
    next('/login')
  } else if (to.name === 'login' && authStore.isLoggedIn) {
    if (authStore.hasSelectedLevel) {
      next('/')
    } else {
      next('/select-level')
    }
  } else if (authStore.isLoggedIn && !authStore.hasSelectedLevel && to.name !== 'select-level') {
    next('/select-level')
  } else {
    next()
  }
})

export default router
