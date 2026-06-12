<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForumStore } from '../stores/forum'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const forumStore = useForumStore()
const authStore = useAuthStore()

const postId = route.params.id as string
const post = computed(() => forumStore.posts.find(p => p.id === postId))
const postComments = computed(() => forumStore.comments[postId] || [])

const newComment = ref('')

function submitComment() {
  if (!newComment.value.trim() || !authStore.user) return
  forumStore.addComment(postId, newComment.value, authStore.user.username)
  newComment.value = ''
}

function goBack() {
  router.push('/forum')
}

function handleDelete() {
  const success = forumStore.deletePost(postId, authStore.user?.id)
  if (success) {
    router.push('/forum')
  }
}

const isMyPost = computed(() => {
  return post.value?.authorId === authStore.user?.id
})

onMounted(() => {
  forumStore.incrementViewCount(postId)
})
</script>

<template>
  <div class="post-detail-container">
    <button class="back-btn glass-btn glass-btn-outline" @click="goBack">
      ← 返回论坛
    </button>

    <div v-if="post" class="post-detail glass-card">
      <div class="post-header">
        <img :src="post.authorAvatar" alt="avatar" class="author-avatar-large" />
        <div class="post-meta">
          <h3 class="author-name-large">{{ post.author }}</h3>
          <p class="post-date">{{ forumStore.formatTime(post.createdAt) }}</p>
        </div>
        <button
          v-if="isMyPost"
          class="action-btn delete-btn"
          @click="handleDelete"
        >
          🗑️ 删除
        </button>
      </div>

      <h1 class="post-title-large">{{ post.title }}</h1>
      <p class="post-content-full">{{ post.content }}</p>

      <div class="post-tags">
        <span v-for="tag in post.tags" :key="tag" class="post-tag">{{ tag }}</span>
      </div>

      <div class="post-actions">
        <button class="action-btn" @click="forumStore.likePost(post.id)">
          <span>❤️</span>
          <span>{{ post.likes }}</span>
        </button>
        <span class="action-btn">
          <span>👁️</span>
          <span>{{ forumStore.formatViews(post.views) }}</span>
        </span>
      </div>
    </div>

    <div class="comments-section">
      <h2 class="section-title">💬 评论 ({{ postComments.length }})</h2>

      <div class="comment-form glass-card">
        <textarea
          v-model="newComment"
          class="glass-input"
          rows="3"
          placeholder="写下你的评论..."
        ></textarea>
        <button class="glass-btn glass-btn-primary" @click="submitComment" :disabled="!newComment.trim()">
          发表评论
        </button>
      </div>

      <div class="comments-list">
        <div v-for="comment in postComments" :key="comment.id" class="comment-card glass-card">
          <div class="comment-header">
            <img :src="comment.authorAvatar" alt="avatar" class="comment-avatar" />
            <div>
              <span class="comment-author">{{ comment.author }}</span>
              <span class="comment-date">{{ forumStore.formatTime(comment.createdAt) }}</span>
            </div>
          </div>
          <p class="comment-content">{{ comment.content }}</p>
          <div class="comment-footer">
            <button class="like-btn">
              <span>❤️</span>
              <span>{{ comment.likes }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.post-detail-container {
  width: 100%;
}

.back-btn {
  margin-bottom: 20px;
}

.post-detail {
  padding: 32px;
  margin-bottom: 32px;
  position: relative;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.author-avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.author-name-large {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.post-date {
  font-size: 13px;
  color: var(--text-muted);
}

.post-title-large {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16px;
  line-height: 1.4;
}

.post-content-full {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 20px;
}

.post-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.post-tag {
  font-size: 13px;
  padding: 4px 12px;
  background: var(--accent-light);
  color: var(--accent-color);
  border-radius: 4px;
}

.post-actions {
  display: flex;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 15px;
  cursor: pointer;
  transition: var(--transition-fast);
}

.action-btn:hover {
  color: var(--text-primary);
}

.action-btn.delete-btn {
  margin-left: auto;
  background: rgba(255, 71, 87, 0.2);
  border: 1px solid rgba(255, 71, 87, 0.3);
  color: rgba(255, 71, 87, 0.9);
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.3s;
}

.action-btn.delete-btn:hover {
  background: rgba(255, 71, 87, 0.4);
  border-color: rgba(255, 71, 87, 0.5);
  color: #fff;
}

.comments-section {
  margin-top: 32px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
}

.comment-form {
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-form button {
  align-self: flex-end;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  padding: 20px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-right: 8px;
}

.comment-date {
  font-size: 12px;
  color: var(--text-muted);
}

.comment-content {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
}

.comment-footer {
  display: flex;
  justify-content: flex-end;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
}

.like-btn:hover {
  color: var(--danger-color);
}

textarea.glass-input {
  resize: vertical;
  font-family: inherit;
}
</style>
