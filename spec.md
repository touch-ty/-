1. 项目概述
一款面向大学生的现代化学术英语学习平台，采用通透的毛玻璃 (Glassmorphism) UI 风格。
核心痛点解决
标准化考试词汇闯关记忆：四六级核心词汇的系统化学习与 “三轮验收” 记忆法。
动态复习与拼写巩固：基于错题与完成度的复习流，以及极其严格的拼写重构测试。
学术论文术语 AI 提取：中英文论文专业术语的自动化提取与专项学习，彻底解决看文献的词汇障碍。
技术架构
表格
层级	技术选型
前端框架	Vue 3 + Vite + TypeScript
状态管理	Pinia（WordStore, PaperStore, ForumStore, UserProgressStore）
路由管理	Vue Router
PDF / 图像解析	pdfjs-dist（强制本地解析，规避 CDN 跨域）/ 图像流提取
AI 接口	多模态大模型 API（用于论文术语提取）
UI 风格	纯 CSS Glassmorphism 拟态风格
2. 全局设计规范
2.1 视觉背景
全屏固定背景图（如山湖日落风景）+ 深色半透明遮罩 rgba(10, 10, 26, 0.5)
背景图通过 position: fixed 和 inset: 0 固定，内容区域在 z-index 上方独立滚动
2.2 全局 Glassmorphism（毛玻璃）基础组件
所有弹窗、覆盖层、模态卡片（含沉浸式字典、批次结算、论文复习大厅等）必须复用或对齐以下核心 CSS 变量 / 类：
css
.glass-panel {
  background: rgba(255, 255, 255, 0.15); /* 视层级厚度可在 0.05~0.25 间微调 */
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15); /* 增加空间感 */
}
3. 词库与数据结构规范
开源静态词库以 TypeScript 模块形式导出，存放在 src/data/ 目录下（如 cet4.ts, cet6.ts）。
3.1 单词核心实体 (Word)
typescript
运行
export interface Word {
  id: number
  word: string
  meaning: string
  phonetic?: string
  example?: string
  level: 'cet4' | 'cet6' | 'paper'
  translations?: string[]                // 详细多重释义（带词性，如 n. / v.）
  sentences?: {en: string, cn: string}[] // 双语例句
  phrases?: {en: string, cn: string}[]   // 短语搭配
  syno?: string[]                        // 近义词数组
  wordFamily?: string[]                  // 同根词数组
}
4. 核心页面交互规格
4.1 登录认证页 (LoginView.vue)
采用双步流程机制 (Two-Step Flow)：
Step 1（身份认证）：用户名 + 密码表单，纯白实色按钮高亮显示
Step 2（目标选择）：认证成功后弹出目标选择卡片（CET-4 / CET-6），用户选中后点击「开启学习」
层级信息和用户信息持久化至 LocalStorage
重定向至 / (Home)
4.2 学习大厅 (HomeView.vue)
统计面板 (Stats Grid)：并排展示 Learn（当前待学习新词数）与 Review（今日待复习词汇数）
激励金句引擎：页面底部渲染随机名人名言卡片（中英对照 + 作者），组件 onMounted 时随机切换
4.3 核心单词学习引擎 (LearnView.vue)
采用三轮验收 + 沉浸式字典闭环逻辑，一词答错直接轮次清零并回滚到队列尾部；弹窗容器严格对齐 .glass-panel 样式规范。
Round 1（初识 - 看英选义）
顶部显示英文题干，底部 4 个中文选项
答错高亮为红色（.selected-wrong）
无论对错，必弹出沉浸式字典
沉浸式字典 (Word Detail)
全屏展示单词音标、例句、短语、同根近义词
用户点击「继续」后方可进入后续轮次
Round 2（回想 - 盲测）：展示英文题干，无选项，仅提供「认识 / 不认识」按钮
Round 3（巩固 - 汉译英回想）：展示中文题干，仅提供「认识 / 不认识」按钮
批次结算 (Batch Complete Modal)：小批次全部通过三轮验收后，弹出半透明覆盖层，展示动画与结算数据
4.4 强化复习引擎 (ReviewView.vue)
针对已学习单词的艾宾浩斯复习流，包含听音辨义与拼写重构测试。
复习 Round 1（看英选义）
逻辑同学习模块
答错立即弹出 Error Card（错误详情卡片），强制重新记忆，单词归入「待重测队列」
复习 Round 2（听音辨义）：隐藏英文文本，仅提供播放按钮，用户根据发音选择中文释义
✍️ 终极拼写测试：基础复习完成后触发
系统给出发音 + 中文，用户键入完整英文单词
错词进入 wrongSpellingList，开启「错词重测模式」直至清零
4.5 论文生词提取模块 (PaperView.vue)
多模态文件解析
PDF / 文本：借助 Vite ?url 参数解决 Worker 路径问题，本地调用 pdfjs-dist 按页提取纯文本
图片：转换为 Base64，调用大模型多模态能力进行 OCR 提取
分块推理与防 Token 爆炸
对解析出的长文本执行 Chunking 切片（每 2500 字符一块），分批次请求大模型。
双重脱敏过滤网（核心防线）
本地正则与黑名单拦截：请求前后通过静态 Set 集合剔除停用词、通用词汇、纯数字、乱码等
AI Prompt 强约束：强制忽略学术八股文、数学公式，仅提取纯正学术技术概念
格式化输出与自动翻译
强制模型以严格 JSON 数组格式返回数据（极简释义、深度解析、双语例句）
无释义单词按 10 词 / 批次并发翻译补全
专属论文复习大厅
提取成功后，核心概念沉淀至专属学习队列，复用复习模块组件开启专项双轮测试（看英选义 + 听音辨义）。
4.6 交流论坛 (ForumView.vue & PostDetailView.vue)
社区功能全景
支持搜索词双向绑定过滤、分区 Tab 切换（词汇讨论、四级交流、论文互助）
格式规范
帖子发布时间：「刚刚 / X 分钟前 / X 小时前 / 日期」
浏览量：按 1.2k 等方式缩略显示
严密权限管控
管理员账号可置顶帖子（isPinned: true）
用户本人发布的帖子详情页渲染危险样式删除按钮，通过 isMyPost(post.authorId) 鉴权控制
5. 状态管理规格 (Pinia Stores)
系统所有业务流转通过 Store 驱动，组件仅作为 UI 渲染观察者。
5.1 WordStore & UserProgressStore
startLearning()：根据用户当前 Level，打乱词库并抽取 10 个单词作为待背队列
handleCorrect() / handleIncorrect()：处理三轮状态机流转
wrongSpellingList：持久化维护拼写错误词汇
switchLevel()：实时切换四六级静态词库
5.2 PaperStore（文献解析大管家）
核心职责
处理本地文档 / 图像流，对接阿里云 DashScope API (qwen3.5-omni-flash)，清洗并生成专用学术生词数组 (paperWords)。
核心方法
extractWordsFromText()：长文本切片 + JSON 约束 LLM 请求
extractWordsFromImage()：图像 Base64 视觉术语提取
addWordsToPaperLibrary()：缺失中文释义单词批量 AI 翻译
recordLearnedWord()：论文生词专项收录持久化
5.3 ForumStore
核心状态
posts[], replies[], activeCategory, searchQuery
核心方法
createPost, likePost, incrementViewCount, deletePost（内部鉴权）
6. 路由表架构
表格
URL 路径	Vue 组件映射	核心职责	鉴权要求
/login	LoginView.vue	账户登录验证、四六级词库意向选择	无
/	HomeView.vue	数据总览仪表盘、入口导航	需要 Token
/learn	LearnView.vue	初识单词、三轮滚动验收、沉浸式字典	需要 Token
/review	ReviewView.vue	艾宾浩斯复习、听音盲测、终极拼写测验	需要 Token
/paper	PaperView.vue	文件上传与解析、大模型学术词汇提取	需要 Token
/forum	ForumPage.vue	交流大厅列表、发帖检索与分区过滤	需要 Token
/forum/post/:id	ForumPostDetail.vue	帖子详情展示、盖楼回复、权限删帖	需要 Token