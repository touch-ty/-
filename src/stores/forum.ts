import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'

export interface Post {
  id: string
  title: string
  content: string
  author: string
  authorId: string
  authorAvatar: string
  category: string
  createdAt: string
  likes: number
  replies: number
  views: number
  pinned: boolean
  tags: string[]
}

export interface Comment {
  id: string
  postId: string
  author: string
  authorAvatar: string
  content: string
  createdAt: string
  likes: number
}

const categories = [
  { id: 'all', name: '全部话题', icon: '🔥' },
  { id: 'vocab', name: '词汇讨论', icon: '📚' },
  { id: 'cet4', name: '四级交流', icon: '📝' },
  { id: 'cet6', name: '六级交流', icon: '📖' },
  { id: 'research', name: '科研讨论', icon: '🔬' },
  { id: 'exam', name: '考试经验', icon: '🎯' },
  { id: 'daily', name: '日常英语', icon: '💬' }
]

function formatTime(timestamp: string | number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function formatViews(views: number): string {
  if (views >= 10000) return (views / 10000).toFixed(1) + 'w'
  if (views >= 1000) return (views / 1000).toFixed(1) + 'k'
  return String(views)
}

const mockPosts: Post[] = [
  {
    id: '1',
    title: '四级听力Section A技巧分享',
    content: '听力第一部分是新闻，建议提前看选项，抓住关键词。平时多听BBC和VOA，培养语感。记住：听到什么选什么不一定对，要结合语境理解。',
    author: 'WordMaster',
    authorId: 'u1',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=WordMaster',
    category: 'cet4',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    likes: 78,
    replies: 23,
    views: 1456,
    pinned: true,
    tags: ['四级听力', 'SectionA']
  },
  {
    id: '2',
    title: '六级听力讲座讲话技巧',
    content: '六级听力第三部分讲座讲话篇幅较长，建议提前看选项，预测内容，边听边记笔记。重点抓开头和结尾，以及转折词后面的内容。',
    author: 'Researcher',
    authorId: 'u2',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Researcher',
    category: 'cet6',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likes: 72,
    replies: 20,
    views: 3412,
    pinned: true,
    tags: ['六级听力', '讲座']
  },
  {
    id: '3',
    title: '如何高效记忆学术词汇？',
    content: '学术词汇记忆需要结合语境，建议通过阅读论文来学习，而不是死记硬背。可以用词根词缀法辅助记忆，同时配合艾宾浩斯遗忘曲线进行复习。',
    author: 'HighScorer',
    authorId: 'u3',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HighScorer',
    category: 'vocab',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes: 45,
    replies: 12,
    views: 892,
    pinned: false,
    tags: ['词汇记忆', '学习方法']
  },
  {
    id: '4',
    title: '论文写作中常用的连接词总结',
    content: '整理了一些论文写作中常用的连接词：表示因果的 therefore, consequently, as a result；表示对比的 however, in contrast, conversely；表示补充的 furthermore, moreover, in addition。',
    author: 'PhDCandidate',
    authorId: 'u4',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PhDCandidate',
    category: 'research',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    likes: 56,
    replies: 8,
    views: 2334,
    pinned: false,
    tags: ['论文写作', '连接词']
  },
  {
    id: '5',
    title: '四六级翻译常见中国文化词汇',
    content: '整理了近年四六级翻译中常考的中国文化词汇：丝绸之路 the Silk Road；京剧 Peking Opera；功夫 Kung Fu；茶文化 tea culture；中医药 traditional Chinese medicine。',
    author: 'CultureVulture',
    authorId: 'u5',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CultureVulture',
    category: 'exam',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    likes: 92,
    replies: 34,
    views: 5678,
    pinned: false,
    tags: ['翻译', '中国文化']
  },
  {
    id: '6',
    title: '日常生活中提高口语的小技巧',
    content: '每天对着镜子练习10分钟；看美剧时跟读台词；找语伴进行语言交换；用英语描述你看到的任何事物。最重要的是克服开口的恐惧！',
    author: 'DailyLearner',
    authorId: 'u6',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DailyLearner',
    category: 'daily',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    likes: 63,
    replies: 15,
    views: 3401,
    pinned: false,
    tags: ['口语', '日常英语']
  },
  {
    id: '7',
    title: '四级阅读理解提速方法',
    content: '阅读理解时间紧，建议先读题干再回原文定位。细节题找关键词，主旨题看首尾段。不要逐字翻译，抓大意即可。平时训练时严格计时，每篇控制在8分钟以内。',
    author: 'SpeedReader',
    authorId: 'u7',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SpeedReader',
    category: 'cet4',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    likes: 34,
    replies: 9,
    views: 1203,
    pinned: false,
    tags: ['四级阅读', '提速']
  },
  {
    id: '8',
    title: '六级写作高分句型模板',
    content: '整理了六级写作常用高分句型：It is universally acknowledged that...；There is no denying that...；From what has been discussed above, we may safely draw the conclusion that... 适当使用从句和倒装句能加分不少。',
    author: 'EssayPro',
    authorId: 'u8',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EssayPro',
    category: 'cet6',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    likes: 88,
    replies: 27,
    views: 4102,
    pinned: false,
    tags: ['六级写作', '句型模板']
  },
  {
    id: '9',
    title: '词根词缀记忆法实战：-spect 家族',
    content: 'spect 表示"看"：inspect（检查，往里看）、prospect（前景，向前看）、retrospect（回顾，向后看）、spectator（观众）。掌握一个词根可以串起十几个单词，效率极高。',
    author: 'RootHunter',
    authorId: 'u9',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RootHunter',
    category: 'vocab',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    likes: 67,
    replies: 18,
    views: 2156,
    pinned: false,
    tags: ['词根词缀', 'spect']
  },
  {
    id: '10',
    title: '研究生英语论文摘要写作要点',
    content: '摘要应包含研究目的、方法、结果和结论四部分。时态上，目的和结论用一般现在时，方法和结果用一般过去时。字数控制在200-300词，避免使用缩写和图表。',
    author: 'GradWriter',
    authorId: 'u10',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GradWriter',
    category: 'research',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    likes: 41,
    replies: 6,
    views: 1789,
    pinned: false,
    tags: ['论文摘要', '写作要点']
  },
  {
    id: '11',
    title: '四六级考前一周冲刺计划',
    content: '最后一周不建议刷新题，重点复习错题和真题。每天一套听力保持耳感，背诵高频词汇和作文模板。调整作息，保证考试时间段精神饱满。',
    author: 'LastMinute',
    authorId: 'u11',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LastMinute',
    category: 'exam',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    likes: 105,
    replies: 42,
    views: 8901,
    pinned: false,
    tags: ['考前冲刺', '备考计划']
  },
  {
    id: '12',
    title: '看美剧学英语的正确姿势',
    content: '推荐从生活类美剧入手，如 Friends、Modern Family。第一遍开中英字幕，第二遍只看英文字幕，第三遍盲听。遇到地道表达暂停记笔记，第二天复习。',
    author: 'BingeWatcher',
    authorId: 'u12',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BingeWatcher',
    category: 'daily',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    likes: 53,
    replies: 14,
    views: 2678,
    pinned: false,
    tags: ['美剧', '听力']
  },
  {
    id: '13',
    title: '四级高频词汇 TOP500 整理',
    content: '根据近十年真题统计，整理了出现频率最高的500个词汇。建议每天背50个，10天一轮。重点记忆一词多义和熟词生义，如 charge、address、rough 等。',
    author: 'VocabKing',
    authorId: 'u13',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=VocabKing',
    category: 'vocab',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    likes: 120,
    replies: 38,
    views: 10234,
    pinned: false,
    tags: ['高频词汇', '四级']
  },
  {
    id: '14',
    title: '科研英语邮件常用表达',
    content: '给导师发邮件常用表达：I am writing to inquire about...；I would be grateful if you could...；Please find attached...；I look forward to hearing from you. 注意语气礼貌且简洁。',
    author: 'EmailMaster',
    authorId: 'u14',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=EmailMaster',
    category: 'research',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    likes: 37,
    replies: 5,
    views: 1567,
    pinned: false,
    tags: ['科研邮件', '英语写作']
  }
]

const mockComments: Record<string, Comment[]> = {
  '1': [
    { id: 'c1', postId: '1', author: 'Newbie', authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Newbie', content: '谢谢分享！很有用', createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), likes: 5 },
    { id: 'c2', postId: '1', author: 'StudyBuddy', authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StudyBuddy', content: '请问有什么推荐的VOA资源吗？', createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), likes: 3 }
  ],
  '2': [
    { id: 'c3', postId: '2', author: 'ExamTaker', authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ExamTaker', content: '讲座部分确实是最难的', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), likes: 4 }
  ]
}

export const useForumStore = defineStore('forum', () => {
  const posts = ref<Post[]>([...mockPosts])
  const comments = ref<Record<string, Comment[]>>({ ...mockComments })
  const currentCategory = ref('all')
  const searchQuery = ref('')

  const categoryList = computed(() => categories)

  const filteredPosts = computed(() => {
    let result = posts.value
    if (currentCategory.value !== 'all') {
      result = result.filter(p => p.category === currentCategory.value)
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
    }
    return [...result].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  })

  function createPost(title: string, content: string, category: string, author: string, authorId: string = 'u' + Date.now()) {
    const newPost: Post = {
      id: 'p' + Date.now(),
      title,
      content,
      author,
      authorId,
      authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`,
      category,
      createdAt: new Date().toISOString(),
      likes: 0,
      replies: 0,
      views: 0,
      pinned: false,
      tags: []
    }
    posts.value.unshift(newPost)
    return newPost.id
  }

  function deletePost(postId: string, currentUserId?: string) {
    const post = posts.value.find(p => p.id === postId)
    if (!post) return false
    // 权限管控：仅作者本人或管理员可删除
    if (currentUserId && post.authorId !== currentUserId) return false
    const idx = posts.value.findIndex(p => p.id === postId)
    if (idx !== -1) {
      posts.value.splice(idx, 1)
      return true
    }
    return false
  }

  function likePost(postId: string) {
    const post = posts.value.find(p => p.id === postId)
    if (post) post.likes++
  }

  function incrementViewCount(postId: string) {
    const post = posts.value.find(p => p.id === postId)
    if (post) post.views++
  }

  function addComment(postId: string, content: string, author: string) {
    if (!comments.value[postId]) comments.value[postId] = []
    comments.value[postId].push({
      id: 'c' + Date.now(),
      postId,
      author,
      authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`,
      content,
      createdAt: new Date().toISOString(),
      likes: 0
    })
    const post = posts.value.find(p => p.id === postId)
    if (post) post.replies++
  }

  return {
    posts, comments, currentCategory, searchQuery,
    categoryList, filteredPosts,
    createPost, deletePost, likePost, incrementViewCount, addComment,
    formatTime, formatViews
  }
})
