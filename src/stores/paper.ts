import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ExtractedWord, PaperRecord, Sentence, Word, SessionWord } from '@/types'
import OpenAI from 'openai'

let pdfjs: any
let pdfjsWorker: string

async function initPdfJs() {
  if (!pdfjs) {
    pdfjs = await import('pdfjs-dist')
    pdfjsWorker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
  }
  return pdfjs
}

let openaiInstance: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    const apiKey = import.meta.env.VITE_DASHSCOPE_API_KEY || (typeof process !== 'undefined' ? process.env.DASHSCOPE_API_KEY : undefined)
    if (!apiKey) {
      throw new Error('缺少 API Key：请在项目根目录 .env 文件中添加 VITE_DASHSCOPE_API_KEY=你的密钥')
    }
    openaiInstance = new OpenAI({
      apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      dangerouslyAllowBrowser: true,
    })
  }
  return openaiInstance
}

/**
 * 从 LLM 返回的文本中容错提取 JSON 数组
 */
export function extractJsonArray(text: string): any[] {
  const trimmed = text.trim()
  // 1. 直接解析
  try {
    const parsed = JSON.parse(trimmed)
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.words)) return parsed.words
    if (parsed && Array.isArray(parsed.data)) return parsed.data
  } catch (_) { /* ignore */ }

  // 2. 尝试截取第一个 JSON 数组 [ ... ]
  const firstBracket = trimmed.indexOf('[')
  const lastBracket = trimmed.lastIndexOf(']')
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try {
      const arr = JSON.parse(trimmed.substring(firstBracket, lastBracket + 1))
      if (Array.isArray(arr)) return arr
    } catch (_) { /* ignore */ }
  }

  // 3. 尝试截取第一个 JSON 对象 { ... }
  const firstBrace = trimmed.indexOf('{')
  const lastBrace = trimmed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      const obj = JSON.parse(trimmed.substring(firstBrace, lastBrace + 1))
      if (obj && Array.isArray(obj.words)) return obj.words
      if (obj && Array.isArray(obj.data)) return obj.data
    } catch (_) { /* ignore */ }
  }

  throw new Error('无法从 LLM 返回内容中提取有效 JSON 数组')
}

// ==================== 双重脱敏过滤网 ====================

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  'need', 'dare', 'ought', 'used', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
  'their', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'all',
  'each', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'then', 'thus', 'hence',
  'however', 'therefore', 'moreover', 'nevertheless', 'otherwise', 'accordingly', 'consequently',
  'abstract', 'introduction', 'related', 'work', 'method', 'methods', 'experiment', 'experiments',
  'results', 'discussion', 'conclusion', 'conclusions', 'references', 'acknowledgements',
  'appendix', 'figure', 'figures', 'table', 'tables', 'section', 'et', 'al', 'eg', 'ie',
  'eq', 'equation', 'fig', 'tab', 'page', 'pages', 'vol', 'volume', 'no', 'number',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
  'saturday', 'sunday',
])

const COMMON_ACADEMIC_PHRASES = new Set([
  'in this paper', 'we propose', 'we present', 'we introduce', 'we demonstrate',
  'we show', 'we believe', 'we argue', 'it is shown', 'it is proved', 'as shown in',
  'in order to', 'due to', 'thanks to', 'based on', 'according to', 'in addition',
  'on the other hand', 'for example', 'for instance', 'in conclusion', 'in summary',
  'to the best of our knowledge', 'state of the art', 'sota', 'et al.', 'et al',
])

export function sanitizeText(text: string): string {
  let cleaned = text
  cleaned = cleaned.replace(/\$[^$]+\$/g, ' ') // 数学公式 $...$
  cleaned = cleaned.replace(/\\\([^\)]+\\\)/g, ' ') // \( ... \)
  cleaned = cleaned.replace(/\\\[[^\]]+\\\]/g, ' ') // \[ ... \]
  cleaned = cleaned.replace(/\b\d+\.?\d*\b/g, ' ') // 纯数字
  // 保留更多合法字符，避免误删学术术语中的符号
  cleaned = cleaned.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s.,;:!?()'"\-_/\[\]@#%&*+=<>~|]/g, ' ')
  cleaned = cleaned.replace(/\b[a-zA-Z]\b/g, ' ') // 单个字母
  cleaned = cleaned.replace(/\s+/g, ' ')
  return cleaned.trim()
}

export function shouldFilterWord(word: string): boolean {
  const w = word.toLowerCase().trim()
  if (!w || w.length <= 2) return true
  if (STOP_WORDS.has(w)) return true
  if (/^\d+$/.test(w)) return true
  if (/^[a-z]\d+$/i.test(w)) return true // 如 a1, b2
  if (COMMON_ACADEMIC_PHRASES.has(w)) return true
  return false
}

export function postFilterWords(words: ExtractedWord[]): ExtractedWord[] {
  const seen = new Set<string>()
  const filtered: ExtractedWord[] = []
  for (const item of words) {
    const key = item.original.toLowerCase().trim()
    if (seen.has(key)) continue
    if (shouldFilterWord(item.original)) continue
    if (!item.briefMeaning || item.briefMeaning.length < 2) continue
    seen.add(key)
    filtered.push(item)
  }
  return filtered
}

// ==================== Store ====================

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed === null ? fallback : parsed
  } catch {
    return fallback
  }
}

export const usePaperStore = defineStore('paper', () => {
  const papers = ref<PaperRecord[]>(safeParse('papers', []))
  const loading = ref(false)
  const learnedPaperWords = ref<ExtractedWord[]>(safeParse('learnedPaperWords', []))
  const extractedWords = ref<ExtractedWord[]>([])
  const showResults = ref(false)

  // === 独立的论文词库（与四六级词库完全隔离） ===
  const paperWordBank = ref<Word[]>(safeParse('paperWordBank', []))
  const paperLearningWords = ref<SessionWord[]>(safeParse('paperLearningWords', []))
  const paperMasteredIds = ref<Set<string>>(new Set(safeParse<string[]>('paperMasteredIds', [])))
  const paperLearnedIds = ref<Set<string>>(new Set(safeParse<string[]>('paperLearnedIds', [])))

  function persistPaperBank() {
    localStorage.setItem('paperWordBank', JSON.stringify(paperWordBank.value))
    localStorage.setItem('paperLearningWords', JSON.stringify(paperLearningWords.value))
    localStorage.setItem('paperMasteredIds', JSON.stringify([...paperMasteredIds.value]))
    localStorage.setItem('paperLearnedIds', JSON.stringify([...paperLearnedIds.value]))
  }

  function persist() {
    localStorage.setItem('papers', JSON.stringify(papers.value))
    localStorage.setItem('learnedPaperWords', JSON.stringify(learnedPaperWords.value))
  }

  const paperLearnCount = computed(() => {
    return paperWordBank.value.filter(w => {
      const id = String(w.id)
      return !paperLearnedIds.value.has(id) && !paperMasteredIds.value.has(id)
    }).length
  })

  const paperReviewCount = computed(() => {
    return paperLearningWords.value.filter(w => {
      if (!w.lastReviewed) return false
      const daysSince = (Date.now() - w.lastReviewed) / (1000 * 60 * 60 * 24)
      return daysSince >= 0 && w.correctCount >= 1
    }).length
  })

  const paperMasteredCount = computed(() => paperMasteredIds.value.size)
  const paperTotalCount = computed(() => paperWordBank.value.length)

  function importToPaperBank(words: Word[]) {
    for (const w of words) {
      if (!paperWordBank.value.find(aw => aw.word.toLowerCase() === w.word.toLowerCase())) {
        paperWordBank.value.push(w)
      }
    }
    persistPaperBank()
  }

  function startPaperLearning(count: number = 10): SessionWord[] {
    // 从词库中过滤掉已掌握的，得到所有未掌握的
    const available = paperWordBank.value.filter(w => {
      return !paperMasteredIds.value.has(String(w.id))
    })
    const selected = available
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(w => ({
        ...w,
        round: 0,
        correctCount: 0,
        lastReviewed: undefined
      })) as SessionWord[]
    // 把新选的加入 paperLearningWords（避免重复）
    const existingIds = new Set(paperLearningWords.value.map(w => String(w.id)))
    const newWords = selected.filter(w => !existingIds.has(String(w.id)))
    if (newWords.length > 0) {
      paperLearningWords.value.push(...newWords.map(w => ({
        ...w,
        round: 0,
        correctCount: 0,
        lastReviewed: undefined
      })) as SessionWord[])
      persistPaperBank()
    }
    return selected
  }

  function startPaperReview(count: number = 10): SessionWord[] {
    const available = paperLearningWords.value.filter(w => {
      if (!w.lastReviewed) return false
      const daysSince = (Date.now() - w.lastReviewed) / (1000 * 60 * 60 * 24)
      return daysSince >= 0 && w.correctCount >= 1
    })
    const selected = available
      .sort(() => Math.random() - 0.5)
      .slice(0, count)
      .map(w => ({
        ...w,
        round: 0,
        correctCount: 0
      })) as SessionWord[]
    return selected
  }

  function handlePaperCorrect(wordId: number) {
    const idx = paperLearningWords.value.findIndex(w => w.id === wordId)
    if (idx === -1) return
    const w = paperLearningWords.value[idx]
    w.correctCount++
    w.lastReviewed = Date.now()
    // paper 模式一轮即毕业，correctCount >= 1 就标记为已掌握
    paperMasteredIds.value.add(String(wordId))
    paperLearnedIds.value.add(String(wordId))
    w.round = w.correctCount
    persistPaperBank()
  }

  function handlePaperIncorrect(wordId: number) {
    const idx = paperLearningWords.value.findIndex(w => w.id === wordId)
    if (idx === -1) return
    const w = paperLearningWords.value[idx]
    w.correctCount = 0
    w.round = 0
    // 答错后从已掌握/已学中移除，可重新进入学习
    paperMasteredIds.value.delete(String(wordId))
    paperLearnedIds.value.delete(String(wordId))
    const word = paperLearningWords.value.splice(idx, 1)[0]
    paperLearningWords.value.push(word)
    persistPaperBank()
  }

  async function extractWords(file: File, onPartialResult?: (words: ExtractedWord[]) => void): Promise<ExtractedWord[]> {
    loading.value = true
    extractedWords.value = []
    showResults.value = false
    try {
      const text = await extractTextFromFile(file)
      const words = await extractWordsFromText(text, onPartialResult)
      extractedWords.value = words
      showResults.value = true
      return words
    } finally {
      loading.value = false
    }
  }

  async function extractTextFromFile(file: File): Promise<string> {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isImage = file.type.startsWith('image/')
    if (isPdf) {
      const pdfjsLib = await initPdfJs()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      let fullText = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n'
      }
      console.log('[PDF提取] 原始文本长度:', fullText.length)
      return fullText
    }
    if (isImage) {
      return await extractTextFromImageWithLLM(file)
    }
    throw new Error(`暂不支持该文件格式（${file.type || file.name}），请上传 PDF 或图片文件`)
  }

  async function extractTextFromImageWithLLM(imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Image = reader.result as string
        try {
          const response = await getOpenAI().chat.completions.create({
            model: 'deepseek-v4-flash',
            messages: [
              { role: 'system', content: '你是一个专业的图像文本识别助手，能够准确提取图片中的所有文本。' },
              {
                role: 'user',
                content: [
                  { type: 'image_url', image_url: { url: base64Image } },
                  { type: 'text', text: '请识别图片中的所有文本内容，并将其提取出来。' },
                ],
              },
            ],
          })
          const content = response.choices[0]?.message?.content
          if (content) resolve(content)
          else reject('LLM 未返回文本内容')
        } catch (error) {
          console.error('调用 DashScope API 进行图像 OCR 失败：', error)
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(imageFile)
    })
  }

  async function extractWordsFromText(text: string, onPartialResult?: (words: ExtractedWord[]) => void): Promise<ExtractedWord[]> {
    const sanitized = sanitizeText(text)
    console.log('[术语提取] sanitize后文本长度:', sanitized.length)
    if (!sanitized || sanitized.length < 50) {
      console.warn('提取文本过短或为空，跳过术语提取')
      return []
    }
    const chunkSize = 2500
    const chunks: string[] = []
    for (let i = 0; i < sanitized.length; i += chunkSize) {
      chunks.push(sanitized.substring(i, i + chunkSize))
    }

    let allExtractedWords: ExtractedWord[] = []

    for (const chunk of chunks) {
      const prompt = `你是一个资深的计算机安全与人工智能学术研究员。你的任务是从学术论文片段中提取【纯粹的硬核学术/技术概念】。

请务必严格按照以下 JSON 对象格式返回结果，顶层字段为 "words"，值为对象数组：
{
  "words": [
    {
      "word": "提取出的英文术语或短语",
      "phonetic": "音标（无则留空）",
      "meaning": "【极简翻译】必须是纯中文！如果遇到 Imagenette、ResNet 等无通用中文的专有名词，必须加上通用后缀（如：Imagenette数据集、ResNet模型），绝对不能输出纯英文！此字段仅限名词，不能解释！",
      "explanation": "【详细解析】该概念在领域的学术定义与作用。用于弹窗展示！",
      "sentences": [{"en": "包含该概念的英文原句", "cn": "中文翻译"}]
    }
  ]
}

【绝对核心提取要求（违惩）】：
1. 【宁缺毋滥】：当前片段如果没有硬核算法/安全词汇，请返回空数组 []！
2. 【严禁提取黑名单】：
   - 绝对不准提取数学符号、公式、变量名或带有特殊符号的内容：如 ∇θ, θ_cp, S_po, ℓ2-norm, // Δ // ∞ ≤ ε。
   - 绝对不准提取代码片段、函数名：如 svm.LinearSVC。
   - 绝对不准提取学术八股文及编号：如 Algorithm 1, Table 2, Figure, Section, Appendix, Reference。
   - 绝对不准提取机构名/法律名/人名：如 GDPR, EU, 大学名。
3. 【只提取纯正概念】：提取的词汇必须是由标准英文字母、数字和连字符组成的正式学术词汇（如 data poisoning, Support Vector Machine, ResNet-18）。

请提取以下学术文本中的核心技术术语：

${chunk}`

      try {
        const response = await getOpenAI().chat.completions.create({
          model: 'deepseek-v4-flash',
          messages: [
            { role: 'system', content: '你是一个资深的计算机安全与人工智能学术研究员，擅长从学术论文中提取核心技术概念，并以严格 JSON 格式返回。' },
            { role: 'user', content: prompt },
          ],
        })

        const content = response.choices[0]?.message?.content
        if (content) {
          try {
            const arr = extractJsonArray(content)
            const mapped: ExtractedWord[] = arr.map((w: any) => ({
              original: String(w.word || w.original || w.term || '')
                .replace(/[\u4e00-\u9fa5]/g, '') // 过滤掉 LLM 可能混入的中文字符
                .trim(),
              briefMeaning: String(w.meaning || w.briefMeaning || w.translation || '').trim(),
              detailAnalysis: String(w.explanation || w.detailAnalysis || w.analysis || '').trim(),
              phonetic: w.phonetic ? String(w.phonetic).trim() : undefined,
              explanation: w.explanation ? String(w.explanation).trim() : undefined,
              sentences: Array.isArray(w.sentences)
                ? w.sentences.map((s: any) => ({
                    en: String(s.en || s.english || '').trim(),
                    cn: String(s.cn || s.chinese || s.translation || '').trim(),
                  })).filter((s: Sentence) => s.en && s.cn)
                : [],
              context: w.context ? String(w.context).trim() : undefined,
            }))
            allExtractedWords = allExtractedWords.concat(mapped)
            // 每处理完一个 chunk 立即增量更新到 store，切换页面不丢失
            if (mapped.length > 0) {
              extractedWords.value.push(...mapped)
              showResults.value = true
              onPartialResult?.(mapped)
            }
          } catch (jsonError) {
            console.error('解析 LLM 返回的 JSON 失败：', jsonError, '原始内容：', content)
          }
        }
      } catch (error) {
        console.error('调用 DashScope API 失败：', error)
      }
    }

    return postFilterWords(allExtractedWords)
  }

  /**
   * 对缺失中文释义（或释义为空/过短）的单词批量 AI 翻译补全，每批 10 词
   */
  async function addWordsToPaperLibrary(words: ExtractedWord[]): Promise<ExtractedWord[]> {
    const needTranslate = words.filter(w => !w.briefMeaning || w.briefMeaning.length < 2)
    if (needTranslate.length === 0) return words

    const batchSize = 10
    const results: ExtractedWord[] = [...words]

    for (let i = 0; i < needTranslate.length; i += batchSize) {
      const batch = needTranslate.slice(i, i + batchSize)
      const terms = batch.map(w => w.original).join('\n')

      const prompt = `请为以下学术术语提供极简中文释义（10字以内）和深度中文解析（30~80字），并以严格 JSON 数组返回。
每个对象包含：original（原文术语）、briefMeaning（极简释义）、detailAnalysis（深度解析）。

术语列表：
${terms}

JSON 格式示例：
[
  {
    "original": "Backpropagation",
    "briefMeaning": "反向传播算法",
    "detailAnalysis": "神经网络中用于计算梯度的核心算法，通过链式法则从输出层向输入层逐层传播误差。"
  }
]`

      try {
        const response = await getOpenAI().chat.completions.create({
          model: 'deepseek-v4-flash',
          messages: [
            { role: 'system', content: '你是专业的学术翻译助手，擅长为英文术语提供精准、简洁的中文释义。' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
        })

        const content = response.choices[0]?.message?.content
        if (content) {
          try {
            const parsed = JSON.parse(content)
            const arr: any[] = Array.isArray(parsed) ? parsed : parsed.words || parsed.data || []
            for (const item of arr) {
              const target = results.find(w => w.original.toLowerCase() === String(item.original || '').toLowerCase().trim())
              if (target) {
                target.briefMeaning = String(item.briefMeaning || item.brief_meaning || item.meaning || target.briefMeaning).trim()
                target.detailAnalysis = String(item.detailAnalysis || item.detail_analysis || item.detail || target.detailAnalysis).trim()
              }
            }
          } catch (e) {
            console.error('批量翻译 JSON 解析失败：', e, content)
          }
        }
      } catch (error) {
        console.error('批量翻译调用失败：', error)
      }
    }

    return results
  }

  function convertToWord(extracted: ExtractedWord, idBase: number): Word {
    return {
      id: idBase,
      word: extracted.original,
      meaning: extracted.briefMeaning,
      phonetic: extracted.phonetic,
      level: 'paper',
      explanation: extracted.detailAnalysis || extracted.explanation,
      translations: [extracted.briefMeaning, extracted.detailAnalysis],
      sentences: extracted.sentences.length > 0 ? extracted.sentences : (extracted.context ? [{ en: extracted.context, cn: '' }] : []),
      phrases: [],
      syno: [],
      wordFamily: [],
    }
  }

  function formatOptionText(original: string, translation: string): string {
    if (!translation) return ''
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    if (regex.test(translation)) {
      return translation.replace(regex, '[同名专有名词]')
    }
    return translation
  }

  function addPaper(filename: string, words: ExtractedWord[]) {
    papers.value.push({
      id: 'p' + Date.now(),
      filename,
      uploadTime: Date.now(),
      words,
    })
    persist()
  }

  function recordLearnedWord(word: ExtractedWord) {
    if (!learnedPaperWords.value.find(w => w.original.toLowerCase() === word.original.toLowerCase())) {
      learnedPaperWords.value.push(word)
      persist()
    }
  }

  return {
    papers,
    loading,
    learnedPaperWords,
    extractedWords,
    showResults,
    // 论文独立词库
    paperWordBank,
    paperLearningWords,
    paperMasteredIds,
    paperLearnedIds,
    paperLearnCount,
    paperReviewCount,
    paperMasteredCount,
    paperTotalCount,
    importToPaperBank,
    startPaperLearning,
    startPaperReview,
    handlePaperCorrect,
    handlePaperIncorrect,
    extractWords,
    extractWordsFromText,
    addWordsToPaperLibrary,
    convertToWord,
    formatOptionText,
    addPaper,
    recordLearnedWord,
  }
})
