
## 1. 项目概述

**TOEIC Master** 是一款面向大学生与科研工作者的英语词汇学习 Web 应用，核心定位是：
- **四六级备考**：提供 CET-4 / CET-6 高频词库，支持三轮滚动学习（初识 → 回想 → 汉译英巩固）。
- **论文术语提取**：上传 PDF / Word / 图片，通过 LLM（阿里云 DashScope）提取学术术语，建立独立词库并学习。
- **社区论坛**：内置论坛模块，支持帖子发布、评论、点赞、分类筛选与搜索。

设计风格为 **深色玻璃拟态（Glassmorphism）**，以半透明卡片、高斯模糊、Unsplash 随机背景为视觉主基调。

---

## 2. 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Vue 3 | ^3.5.34 | Composition API + `<script setup>` |
| 语言 | TypeScript | ~6.0.2 | 严格类型检查，启用 `noUnusedLocals` / `noUnusedParameters` |
| 构建 | Vite | ^8.0.12 | `@vitejs/plugin-vue` 插件，路径别名 `@` → `src` |
| 路由 | Vue Router | ^4.6.4 | `createWebHistory` 模式 |
| 状态 | Pinia | ^3.0.4 | 采用 Setup Store 风格（`ref` + `computed`） |
| UI | 原生 CSS | — | 无 UI 框架，全部手写玻璃拟态样式 |
| PDF 解析 | pdfjs-dist | ^5.7.284 | 动态导入 worker，提取 PDF 纯文本 |
| AI API | OpenAI SDK | ^4.0.0 | 实际调用阿里云 DashScope（baseURL 指向兼容端点） |
| 字体 | Google Fonts | — | Inter + Noto Sans SC |

---

## 3. 整体架构

### 3.1 目录结构

```
words/
├── .env                          # API Key 配置（VITE_DASHSCOPE_API_KEY）
├── vite.config.ts                # Vite 配置（@/src 别名）
├── tsconfig.app.json             # TS 严格模式
├── src/
│   ├── main.ts                   # 应用入口：createApp → Pinia → Router → mount
│   ├── App.vue                   # 根组件：背景层 + Sidebar + RouterView
│   ├── style.css                 # 全局 CSS 变量与工具类
│   ├── types/index.ts            # 核心类型定义
│   ├── router/index.ts           # 路由表与全局守卫
│   ├── components/
│   │   └── Sidebar.vue           # 左侧导航栏（180px 宽，玻璃模糊）
│   ├── views/
│   │   ├── LoginView.vue         # 登录页（居中 glass-card）
│   │   ├── LevelSelectView.vue   # 四六级选择（无边栏，居中双卡片）
│   │   ├── HomeView.vue          # 学习大厅（统计卡片 + 每日名言）
│   │   ├── LearnView.vue         # 单词学习/复习（核心学习引擎）
│   │   ├── ReviewView.vue        # 强化复习（拼写测试 + 错题本）
│   │   ├── PaperView.vue         # 论文上传、术语提取、独立词库管理
│   │   ├── ForumView.vue         # 论坛列表（搜索/分类/发帖/删除）
│   │   └── PostDetailView.vue    # 帖子详情与评论
│   ├── stores/
│   │   ├── auth.ts               # 用户认证（mock 登录 + localStorage）
│   │   ├── words.ts              # 四六级词库状态（三轮学习 + 复习）
│   │   ├── paper.ts              # 论文词库状态（独立隔离 + 一轮毕业）
│   │   └── forum.ts              # 论坛状态（mock 数据 + 内存操作）
│   └── data/
│       ├── cet4.ts               # CET-4 词库（静态数组导入）
│       └── cet6.ts               # CET-6 词库（静态数组导入）
```

### 3.2 全局布局

`App.vue` 负责整体布局：
- **背景层**（`.bg-layer`）：`fixed` 定位，5 张 Unsplash 高清图随机切换（每次刷新 `Math.random()`），叠加 `rgba(10,10,26,0.5)` 暗色遮罩。
- **侧边栏**（`Sidebar.vue`）：宽 180px，仅在 `route.name !== 'login' && route.name !== 'select-level'` 时显示。包含 TOEIC Master logo、导航项（大厅 / 论文 / 论坛）、退出按钮。
- **主内容区**（`main.main-content`）：`flex: 1`，若无边栏则添加 `.full-width` 类。

---

## 4. 核心类型定义

### 4.1 单词相关

```typescript
export interface Sentence {
  en: string   // 英文例句
  cn: string   // 中文翻译
}

export interface Phrase {
  en: string   // 英文短语
  cn: string   // 中文释义
}

export interface Word {
  id: number
  word: string
  meaning: string
  phonetic?: string
  example?: string
  level: 'easy' | 'medium' | 'hard' | 'cet4' | 'cet6' | 'paper'
  translations?: string[]
  sentences?: Sentence[]
  phrases?: Phrase[]
  syno?: string[]          // 近义词
  wordFamily?: string[]    // 同根词
  etymology?: string
  collocations?: string[]
  synonyms?: string[]
  explanation?: string     // 详细学术解析
}

export type WordLevel = 'cet4' | 'cet6' | 'paper'

export interface ExtractedWord {
  original: string         // 英文术语
  briefMeaning: string     // 极简中文释义（强制中文，专有名词加后缀如"ResNet模型"）
  detailAnalysis: string   // 深度学术解析
  sentences: Sentence[]
  context?: string         // 原文上下文
  phonetic?: string
  explanation?: string
}

export interface PaperRecord {
  id: string
  filename: string
  uploadTime: number
  words: ExtractedWord[]
}

export interface SessionWord extends Word {
  round: number            // 当前轮次（0=初识, 1=回想, 2=巩固）
  correctCount: number     // 累计答对次数
  lastReviewed?: number    // 最后复习时间戳
}
```

---

## 5. 路由系统

```typescript
const routes = [
  { path: '/login',         name: 'login',        component: LoginView,        meta: { public: true } },
  { path: '/select-level',  name: 'select-level', component: LevelSelectView,  meta: { title: '选择等级' } },
  { path: '/',              name: 'home',         component: HomeView,         meta: { title: '学习大厅' } },
  { path: '/learn',         name: 'learn',        component: LearnView,        meta: { title: '单词学习' } },
  { path: '/review',        name: 'review',       component: ReviewView,       meta: { title: '强化复习' } },
  { path: '/paper',         name: 'paper',        component: PaperView,        meta: { title: '论文管理' } },
  { path: '/forum',         name: 'forum',        component: ForumView,        meta: { title: '交流论坛' } },
  { path: '/forum/:id',     name: 'post-detail',  component: PostDetailView,   meta: { title: '帖子详情' } },
]
```

### 5.1 全局导航守卫

- 未登录用户访问非 `public` 路由 → 强制跳转 `/login`
- 已登录用户访问 `/login` → 若已选等级则跳 `/`，否则跳 `/select-level`
- 已登录但未选等级用户访问非 `select-level` → 强制跳转 `/select-level`

---

## 6. 状态管理（Pinia Stores）

### 6.1 Auth Store (`stores/auth.ts`)

| 状态 | 类型 | 说明 |
|------|------|------|
| `user` | `User \| null` | 当前用户（mock， DiceBear 头像） |
| `token` | `string` | JWT mock token |
| `selectedLevel` | `'cet4' \| 'cet6' \| ''` | 用户选择的词库等级 |
| `isLoggedIn` | `computed` | `!!token` |
| `hasSelectedLevel` | `computed` | `!!selectedLevel` |

**行为**：
- `login(username, password)`：密码长度 `< 3` 即失败；成功后将 `{user, token, selectedLevel}` 序列化存入 `localStorage`
- `setSelectedLevel(level)`：更新等级并同步 `localStorage`
- `logout()`：清空状态并移除 `localStorage`

### 6.2 Words Store (`stores/words.ts`) — 四六级词库

| 状态 | 类型 | 说明 |
|------|------|------|
| `allWords` | `Word[]` | 当前等级全部单词（cet4.ts 或 cet6.ts 导入） |
| `learningWords` | `SessionWord[]` | 已进入学习流程的单词 |
| `masteredWordIds` | `Set<string>` | 已掌握单词 ID（correctCount >= 3） |
| `learnedWordIds` | `Set<string>` | 已学过单词 ID |
| `wrongSpellingList` | `SessionWord[]` | 拼写错误单词本（localStorage 持久化） |

**计算属性**：
- `learnCount`：未学且未掌握的单词数量
- `reviewCount`：lastReviewed >= 1 天且 correctCount >= 3 的单词数量
- `masteredCount`：`masteredWordIds.size`
- `totalCount`：`allWords.length`

**核心方法**：
- `loadWords(level)`：加载对应等级静态词库（会保留已有的 `level === 'paper'` 单词，但业务上已不再混用）
- `switchLevel(level)`：切换等级，清空学习状态
- `startLearning(count=10)`：从未掌握单词中随机选 `count` 个，转为 `SessionWord` 加入 `learningWords`
- `startReview(count=10)`：从 `learningWords` 中筛选 lastReviewed >= 1 天且 correctCount >= 3 的单词
- `handleCorrect(wordId)`：correctCount++，lastReviewed=now；若 >=3 则加入 mastered/learned
- `handleIncorrect(wordId)`：correctCount=0，round=0，将该单词移至 `learningWords` 末尾（滚动重学）

### 6.3 Paper Store (`stores/paper.ts`) — 论文独立词库

**设计原则**：与四六级词库完全隔离，独立 localStorage key。

| 状态 | 类型 | localStorage Key | 说明 |
|------|------|------------------|------|
| `paperWordBank` | `Word[]` | `paperWordBank` | 论文提取后转换的全部单词 |
| `paperLearningWords` | `SessionWord[]` | `paperLearningWords` | 已进入学习流程的论文单词 |
| `paperMasteredIds` | `Set<string>` | `paperMasteredIds` | 已掌握 ID |
| `paperLearnedIds` | `Set<string>` | `paperLearnedIds` | 已学过 ID |
| `extractedWords` | `ExtractedWord[]` | — | 当前提取会话的原始结果 |
| `showResults` | `boolean` | — | 是否展示提取结果列表 |
| `loading` | `boolean` | — | 是否正在解析/提取 |
| `papers` | `PaperRecord[]` | `papers` | 历史上传记录 |
| `learnedPaperWords` | `ExtractedWord[]` | `learnedPaperWords` | 已学历史记录 |

**计算属性**：
- `paperLearnCount`：未学且未掌握的论文单词数量
- `paperReviewCount`：lastReviewed >= 0 天且 correctCount >= 1 的单词数量（论文复习门槛低于四六级）
- `paperMasteredCount` / `paperTotalCount`

**核心方法**：
- `importToPaperBank(words: Word[])`：去重后追加到 `paperWordBank`
- `startPaperLearning(count=10)`：从未掌握单词中随机选取，追加到 `paperLearningWords`
- `startPaperReview(count=10)`：筛选 correctCount >= 1 的单词（一轮即毕业）
- `handlePaperCorrect(wordId)`：**一轮毕业制**。correctCount++，lastReviewed=now，直接加入 mastered/learned
- `handlePaperIncorrect(wordId)`：correctCount=0，round=0，从 mastered/learned 中移除，移至队列末尾
- `extractWords(file, onPartialResult?)`：完整的论文处理流水线（见第 8 节）
- `convertToWord(extracted, idBase)`：将 `ExtractedWord` 转为 `Word`（level='paper'）

### 6.4 Forum Store (`stores/forum.ts`)

**数据存储**：全部 mock 数据在内存中，无 localStorage 持久化。

| 状态 | 类型 | 说明 |
|------|------|------|
| `posts` | `Post[]` | 帖子列表（14 条 mock + 用户新增） |
| `comments` | `Record<string, Comment[]>` | 帖子 ID → 评论数组 |
| `currentCategory` | `string` | 当前分类筛选（默认 `all`） |
| `searchQuery` | `string` | 搜索关键词 |

**核心方法**：
- `createPost(title, content, category, author, authorId)`：生成新帖子并 `unshift`
- `deletePost(postId, currentUserId)`：**权限管控**：仅作者本人可删除（`authorId === currentUserId`）
- `likePost(postId)`：likes++
- `incrementViewCount(postId)`：views++
- `addComment(postId, content, author)`：追加评论，同步更新帖子 replies 数
- `filteredPosts`：按分类 + 搜索词筛选，置顶帖优先，其余按时间倒序

---

## 7. 功能模块详解

### 7.1 登录与等级选择

**LoginView.vue**
- 居中 `glass-card`，标题 "Welcome Back" / 副标题 "让学习回归纯粹"
- 用户名 + 密码输入（密码可切换可见性）
- 登录成功后跳转 `/select-level`

**LevelSelectView.vue**
- **无侧边栏**（`App.vue` 中 `hideSidebarRoutes` 包含 `select-level`）
- 居中卡片，标题 "选择目标"，副标题个性化问候："你好 {username}，今天准备攻克哪个堡垒？"
- 两个并排选项卡片：
  - CET-4：彩色 2x2 方块 SVG 图标
  - CET-6：橙红渐变三角形 SVG 图标
- 选中态：背景加深 + 边框高亮
- 底部按钮："开始学习 →"，hover 箭头右移，未选时 `opacity: 0.35` 禁用

### 7.2 学习大厅（HomeView.vue）

- 顶部标题 "Welcome Back"
- 两行统计卡片（`stats-row`，grid 1fr 1fr）：
  - **Learn**：`wordsStore.learnCount`，点击跳转 `/learn`
  - **Review**：`wordsStore.reviewCount`，点击跳转 `/review`
- 底部名言卡片：10 条英汉双语名言，随机展示

### 7.3 单词学习引擎（LearnView.vue）

**路由参数**：
- `?source=paper`：使用论文词库（`paperStore`）
- `?mode=review`：进入复习模式

**会话隔离机制**：
- `sessionWords`：当前批次正在学习的单词快照
- `sessionTotalCount`：
  - 学习模式 = 全局未掌握总数（`wordsStore.totalCount` 或 `paperStore.paperTotalCount`）
  - 复习模式 = 当前批次单词数（`sessionWords.length`）
- `sessionMasteredCount`：
  - 复习模式 = `sessionReviewCorrect`（独立计数，答对++，答错不变）
  - 学习模式 = 当前批次中已全局掌握的单词数量
- `sessionAllWordsPool`：全部单词的 `{id, meaning}` 池，用于生成干扰项

**学习流程（四六级模式）**：
1. **Round 0（初识）**：看英文单词，从 4 个中文释义中选正确项。
   - 选择后立即弹出**沉浸式字典弹窗**（无论对错），展示：音标、释义、详细解析、例句、短语、近义词、同根词。
   - 点击"继续"后：若答对 → `handleCorrect`；若答错 → `handleIncorrect`（correctCount=0，移至末尾）。
2. **Round 1（回想）**：展示单词，问"你还记得这个单词的意思吗？"，二元选择（认识 / 不认识）。
3. **Round 2（汉译英巩固）**：展示中文释义，问"你能想起对应的英文单词吗？"，二元选择。

**学习流程（论文模式）**：
- 仅 **Round 0（初识）**，一轮即毕业。
- 答对后立即 `handlePaperCorrect`（标记为已掌握），弹窗后点击"继续"直接下一词。

**进度条**：
- 顶部显示 "已掌握 {sessionMasteredCount} / {sessionTotalCount}"
- 右侧"退出学习"按钮，点击返回对应主页（`/` 或 `/paper`），**不刷新页面**。

**批次结算**：
- 完成当前批次后弹出 `showBatchComplete` 弹窗，可选"返回大厅/论文"或"继续下一批"。

### 7.4 强化复习（ReviewView.vue）

- 独立页面，从 `wordsStore` 中加载复习单词（非论文模式）。
- 支持**拼写测试**：答错后进入拼写纠错环节。
- `fullCurrentWord` computed：从 `allWords` 中查找完整信息，确保弹窗展示完整数据。

### 7.5 论文管理（PaperView.vue）

**上传区域**：
- 支持拖拽或点击上传，文件类型：`application/pdf`, `.doc`, `.docx`, `image/*`
- 上传按钮：`upload-btn-primary`，半透明背景，非全宽
- 上传中显示 spinner + "正在解析文件并提取学术术语..."

**文件处理流水线**（`paperStore.extractWords`）：
1. **PDF**：`pdfjs-dist` 逐页提取文本 → `sanitizeText`（过滤公式、数字、单字母等）
2. **图片**：通过 OpenAI SDK 调用多模态模型（`deepseek-v4-flash`）进行 OCR 识别
3. **文本分块**：按 2500 字符切分，逐块调用 LLM 提取术语
4. **LLM Prompt**：要求返回严格 JSON，字段包括 `word`, `phonetic`, `meaning`, `explanation`, `sentences`
5. **容错解析**：`extractJsonArray` 函数支持直接解析、数组截取、对象包裹三种 fallback
6. **增量回调**：每处理完一个 chunk，立即 `push` 到 `extractedWords` 并调用 `onPartialResult`
7. **去重过滤**：`postFilterWords` 基于停用词、长度、黑名单进行二次过滤
8. **实时导入**：回调中将 `ExtractedWord[]` 通过 `convertToWord` 转为 `Word[]`，调用 `importToPaperBank`

**提取结果展示**：
- 卡片列表展示原始术语、极简释义、详细解析、双语例句、上下文
- 点击卡片弹出详情弹窗（音标、释义、解析、例句、上下文）
- 顶部"开始学习"按钮

**统计卡片**：
- Learn：`paperLearnCount`，点击进入学习（`/learn?source=paper`）
- Review：`paperReviewCount`，点击进入复习（`/learn?source=paper&mode=review`）

### 7.6 论坛（ForumView.vue & PostDetailView.vue）

**论坛列表**：
- 顶部：标题 + "发布新帖"按钮
- 搜索栏：`forumStore.searchQuery` 实时过滤
- 分类标签栏：全部话题 / 词汇讨论 / 四级交流 / 六级交流 / 科研讨论 / 考试经验 / 日常英语
- 帖子卡片：作者头像、昵称、时间、标题（可点击进入详情）、内容摘要、标签、点赞/评论/浏览数
- **删除权限**：仅帖子作者本人可见删除按钮，调用 `deletePost` 时校验 `authorId`

**帖子详情**：
- 返回按钮、作者信息、标题、全文、标签、点赞/浏览数
- 评论列表 + 评论输入框

---

## 8. AI 集成细节

### 8.1 配置

```env
VITE_DASHSCOPE_API_KEY=sk-...
```

运行时通过 `import.meta.env.VITE_DASHSCOPE_API_KEY` 读取。

### 8.2 初始化

```typescript
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  dangerouslyAllowBrowser: true,
})
```

### 8.3 术语提取 Prompt 要点

- 角色设定：资深计算机安全与人工智能学术研究员
- 输出格式：严格 JSON，`{ words: [{ word, phonetic, meaning, explanation, sentences }] }`
- 过滤要求：
  - 禁止提取数学符号、公式、变量名
  - 禁止提取代码片段、函数名
  - 禁止提取学术八股文（Algorithm 1, Table 2, Figure, Section）
  - 禁止提取机构名/法律名/人名（GDPR, EU）
  - 仅提取标准英文字母、数字、连字符组成的正式学术词汇
- `meaning` 字段强制中文，专有名词加后缀（如 "ResNet模型"）

### 8.4 图像 OCR

- 模型：`deepseek-v4-flash`
- 输入：`image_url`（base64 DataURL）
- Prompt："请识别图片中的所有文本内容，并将其提取出来。"

---

## 9. 持久化策略

| 数据 | Key | 格式 | 说明 |
|------|-----|------|------|
| 用户认证 | `auth` | JSON `{user, token, selectedLevel}` | 登录态与等级选择 |
| 四六级学习状态 | `wrongSpellingList` | `number[]`（仅 ID） | 拼写错误单词 ID 列表 |
| 论文词库 | `paperWordBank` | `Word[]` | 论文提取的全部单词 |
| 论文学习状态 | `paperLearningWords` | `SessionWord[]` | 论文学习流程中的单词 |
| 论文已掌握 | `paperMasteredIds` | `string[]` | 论文已掌握 ID 数组 |
| 论文已学习 | `paperLearnedIds` | `string[]` | 论文已学习 ID 数组 |
| 论文历史 | `papers` | `PaperRecord[]` | 上传记录 |
| 已学论文词 | `learnedPaperWords` | `ExtractedWord[]` | 已学历史 |

**注意**：四六级的 `allWords`、`learningWords`、`masteredWordIds` 等**不持久化**，每次刷新后根据 `selectedLevel` 重新加载静态词库。

---

## 10. UI/UX 设计规范

### 10.1 色彩体系（CSS 变量）

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.03);
  --glass-bg-hover: rgba(255, 255, 255, 0.06);
  --glass-bg-active: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-light: rgba(255, 255, 255, 0.15);
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.5);
  --accent-color: #6366f1;
  --accent-hover: #818cf8;
  --success-color: #22c55e;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
}
```

### 10.2 玻璃卡片（`.glass-card`）

- `background: var(--glass-bg)`
- `backdrop-filter: blur(20px)`
- `border: 1px solid var(--glass-border)`
- `border-radius: var(--radius-md)`（16px）

### 10.3 按钮规范

| 类名 | 背景 | 文字 | 用途 |
|------|------|------|------|
| `.glass-btn` | `rgba(255,255,255,0.9)` | `#1a1a2e` | 主操作（白底） |
| `.glass-btn-primary` | `#6366f1` | `#fff` | 强调操作 |
| `.glass-btn-outline` | `transparent` | `var(--text-primary)` | 次要/返回 |

### 10.4 动画

- `.animate-fade-in`：`fadeIn` 关键帧，`opacity: 0→1` + `translateY(8px→0)`，0.4s ease
- 选项按钮 hover：`transform: translateY(-1px)` + 背景色渐变
- 进度条填充：`width` transition 0.5s ease
- 错误选项 shake：左右晃动 0.5s

### 10.5 背景图

5 张 Unsplash 高清风景图，每次页面刷新通过 `Math.random()` 随机选取一张，使用 `background-size: cover` 居中铺满。

---

## 11. 关键业务规则汇总

| 场景 | 四六级模式 | 论文模式 |
|------|-----------|----------|
| 词库隔离 | `wordsStore.allWords`（含 cet4/cet6 静态数据） | `paperStore.paperWordBank`（完全独立 localStorage） |
| 学习轮次 | 三轮（0→1→2） | 一轮（仅 Round 0） |
| 毕业条件 | `correctCount >= 3` | `correctCount >= 1` |
| 复习门槛 | `daysSince >= 1 && correctCount >= 3` | `daysSince >= 0 && correctCount >= 1` |
| 答错处理 | correctCount=0，移至队列末尾 | correctCount=0，从 mastered/learned 移除，移至末尾 |
| 进度条基数 | 全局未掌握总数 | 全局未掌握总数 |
| 复习进度 | 批次单词数 | 批次单词数 |

---

## 12. 已知限制与注意事项

1. **Mock 认证**：无真实后端，登录状态仅靠前端 mock 与 localStorage 维持。
2. **论坛数据不持久**：帖子与评论仅在内存中，刷新页面后恢复为 14 条 mock 数据。
3. **四六级学习状态不持久**：刷新后需重新选择等级并从头学习（论文词库独立持久化）。
4. **PDF 扫描版不支持**：`pdfjs-dist` 仅能提取文本层 PDF，扫描版/图片版 PDF 需先 OCR。
5. **API Key 安全**：`.env` 中的 Key 会随前端代码暴露到浏览器，生产环境需使用代理服务器。
6. **图片 OCR 依赖 LLM**：非专业 OCR 引擎，对复杂排版或手写体识别效果有限。
7. **TypeScript 严格模式**：启用 `noUnusedLocals` 和 `noUnusedParameters`，构建失败需确保无未使用变量。
