<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForumStore } from '../stores/forum'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const forumStore = useForumStore()
const authStore = useAuthStore()

const showPostModal = ref(false)
const newPostTitle = ref('')
const newPostContent = ref('')
const newPostCategory = ref('vocab')

function createPost() {
  if (!newPostTitle.value.trim() || !newPostContent.value.trim()) return
  forumStore.createPost(
    newPostTitle.value,
    newPostContent.value,
    newPostCategory.value,
    authStore.user?.username || '匿名',
    authStore.user?.id
  )
  showPostModal.value = false
  newPostTitle.value = ''
  newPostContent.value = ''
}

function canDelete(author: string) {
  return authStore.user?.username === author
}
</script>

<template>
  <div class="forum-container">
    <header class="forum-header">
      <div>
        <h1 class="page-title">Community Forum</h1>
        <p class="page-subtitle">分享学习经验，交流备考心得</p>
      </div>
      <button class="new-post-btn" @click="showPostModal = true">
        <span>+</span>
        <span>发布新帖</span>
      </button>
    </header>

    <div class="search-bar glass-card">
      <span class="search-icon">🔍</span>
      <input
        v-model="forumStore.searchQuery"
        type="text"
        class="search-input"
        placeholder="搜索话题..."
      />
    </div>

    <div class="category-tabs">
      <button
        v-for="cat in forumStore.categoryList"
        :key="cat.id"
        class="category-tab"
        :class="{ active: forumStore.currentCategory === cat.id }"
        @click="forumStore.currentCategory = cat.id"
      >
        <span>{{ cat.icon }}</span>
        <span>{{ cat.name }}</span>
      </button>
    </div>

    <div class="posts-list">
      <div v-for="post in forumStore.filteredPosts" :key="post.id" class="post-card glass-card">
        <div class="post-pinned" v-if="post.pinned">📌</div>
        <div class="post-author">
          <img :src="post.authorAvatar" alt="avatar" class="author-avatar" />
          <div class="author-info">
            <span class="author-name">{{ post.author }}</span>
            <span class="post-date">{{ forumStore.formatTime(post.createdAt) }}</span>
          </div>
        </div>

        <h3 class="post-title" @click="router.push(`/forum/${post.id}`)">{{ post.title }}</h3>
        <p class="post-content">{{ post.content }}</p>

        <div class="post-tags">
          <span v-for="tag in post.tags" :key="tag" class="post-tag">{{ tag }}</span>
        </div>

        <div class="post-footer">
          <div class="post-stats">
            <button class="stat-btn" @click="forumStore.likePost(post.id)">
              <span>❤️</span>
              <span>{{ post.likes }}</span>
            </button>
            <button class="stat-btn" @click="router.push(`/forum/${post.id}`)">
              <span>💬</span>
              <span>{{ post.replies }}</span>
            </button>
            <span class="stat-btn">
              <span>👁️</span>
              <span>{{ forumStore.formatViews(post.views) }}</span>
            </span>
          </div>
          <button
            v-if="canDelete(post.author)"
            class="delete-btn"
            @click="forumStore.deletePost(post.id, authStore.user?.id)"
          >
            🗑️ 删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="forumStore.filteredPosts.length === 0" class="empty-state glass-card">
      <p>暂无相关帖子</p>
    </div>

    <div v-if="showPostModal" class="modal-overlay" @click.self="showPostModal = false">
      <div class="modal glass-card">
        <h2 class="modal-title">发布新帖</h2>
        <div class="form-group">
          <label class="form-label">标题</label>
          <input v-model="newPostTitle" type="text" class="glass-input" placeholder="请输入标题" />
        </div>
        <div class="form-group">
          <label class="form-label">分类</label>
          <select v-model="newPostCategory" class="glass-input">
            <option v-for="cat in forumStore.categoryList.slice(1)" :key="cat.id" :value="cat.id">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">内容</label>
          <textarea v-model="newPostContent" class="glass-input" rows="6" placeholder="分享你的学习心得..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="glass-btn glass-btn-outline" @click="showPostModal = false">取消</button>
          <button class="glass-btn glass-btn-primary" @click="createPost" :disabled="!newPostTitle.trim() || !newPostContent.trim()">
            发布
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.forum-container {
  width: 100%;
}

.forum-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 4px;
}

.new-post-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
  cursor: pointer;
}

.new-post-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.search-icon {
  font-size: 16px;
  opacity: 0.5;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 14px;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.category-tab:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.category-tab.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
  color: #fff;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  padding: 24px;
  position: relative;
  transition: var(--transition-fast);
}

.post-card:hover {
  background: rgba(255, 255, 255, 0.06);
}

.post-pinned {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 16px;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.post-date {
  font-size: 12px;
  color: var(--text-muted);
}

.post-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  cursor: pointer;
}

.post-title:hover {
  color: var(--accent-hover);
}

.post-content {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.post-tag {
  font-size: 12px;
  padding: 4px 10px;
  background: var(--accent-bg);
  color: var(--accent-hover);
  border-radius: 4px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.stat-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.stat-btn:hover {
  color: var(--text-primary);
}

.delete-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 71, 87, 0.2);
  border: 1px solid rgba(255, 71, 87, 0.3);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 14px;
  color: rgba(255, 71, 87, 0.9);
  cursor: pointer;
  transition: all 0.3s;
}

.delete-btn:hover {
  background: rgba(255, 71, 87, 0.4);
  transform: scale(1.1);
  color: #fff;
}

.empty-state {
  padding: 64px;
  text-align: center;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

textarea.glass-input {
  resize: vertical;
  font-family: inherit;
}

select.glass-input {
  cursor: pointer;
}

.page-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-number:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.page-number.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-color: transparent;
  color: #fff;
  font-weight: 600;
}
</style>
