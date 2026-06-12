import { describe, it, expect } from 'vitest'
import { extractJsonArray, sanitizeText, shouldFilterWord, postFilterWords } from '../paper'
import type { ExtractedWord } from '@/types'

describe('extractJsonArray', () => {
  it('直接解析 JSON 数组', () => {
    const result = extractJsonArray('[{"word":"test"}]')
    expect(result).toHaveLength(1)
    expect(result[0].word).toBe('test')
  })

  it('解析包裹在对象中的 words 数组', () => {
    const result = extractJsonArray('{"words":[{"word":"hello"}]}')
    expect(result).toHaveLength(1)
    expect(result[0].word).toBe('hello')
  })

  it('解析包裹在对象中的 data 数组', () => {
    const result = extractJsonArray('{"data":[{"word":"world"}]}')
    expect(result).toHaveLength(1)
    expect(result[0].word).toBe('world')
  })

  it('从 markdown 代码块中提取数组', () => {
    const text = '```json\n[{"word":"abc"}]\n```'
    const result = extractJsonArray(text)
    expect(result).toHaveLength(1)
    expect(result[0].word).toBe('abc')
  })

  it('从 markdown 代码块中提取对象包裹的数组', () => {
    const text = '```json\n{"words":[{"word":"def"}]}\n```'
    const result = extractJsonArray(text)
    expect(result).toHaveLength(1)
    expect(result[0].word).toBe('def')
  })

  it('无法提取时抛出错误', () => {
    expect(() => extractJsonArray('not json at all')).toThrow('无法从 LLM 返回内容中提取有效 JSON 数组')
  })
})

describe('sanitizeText', () => {
  it('过滤 LaTeX 公式', () => {
    const input = 'We use ResNet with $\\alpha = 0.5$ and \\(\\beta\\)'
    expect(sanitizeText(input)).not.toContain('α')
    expect(sanitizeText(input)).not.toContain('β')
  })

  it('过滤纯数字', () => {
    const input = 'Accuracy is 95.5% and 100'
    const result = sanitizeText(input)
    expect(result).not.toContain('95.5')
    expect(result).not.toContain('100')
  })

  it('过滤单个字母', () => {
    const input = 'a b c test'
    const result = sanitizeText(input)
    expect(result).not.toMatch(/\ba\b/)
    expect(result).not.toMatch(/\bb\b/)
    expect(result).toContain('test')
  })

  it('合并多余空格', () => {
    const input = 'hello    world'
    expect(sanitizeText(input)).toBe('hello world')
  })
})

describe('shouldFilterWord', () => {
  it('过滤停用词', () => {
    expect(shouldFilterWord('the')).toBe(true)
    expect(shouldFilterWord('and')).toBe(true)
    expect(shouldFilterWord('abstract')).toBe(true)
  })

  it('过滤过短的词', () => {
    expect(shouldFilterWord('a')).toBe(true)
    expect(shouldFilterWord('ab')).toBe(true)
  })

  it('过滤纯数字', () => {
    expect(shouldFilterWord('123')).toBe(true)
  })

  it('过滤学术八股文', () => {
    expect(shouldFilterWord('in this paper')).toBe(true)
    expect(shouldFilterWord('we propose')).toBe(true)
  })

  it('保留合法学术术语', () => {
    expect(shouldFilterWord('ResNet')).toBe(false)
    expect(shouldFilterWord('Transformer')).toBe(false)
    expect(shouldFilterWord('overfitting')).toBe(false)
  })
})

describe('postFilterWords', () => {
  it('去重并过滤停用词', () => {
    const words: ExtractedWord[] = [
      { original: 'ResNet', briefMeaning: '残差网络', detailAnalysis: '', sentences: [] },
      { original: 'the', briefMeaning: '这个', detailAnalysis: '', sentences: [] },
      { original: 'ResNet', briefMeaning: '重复', detailAnalysis: '', sentences: [] },
      { original: 'Transformer', briefMeaning: ' transformer', detailAnalysis: '', sentences: [] },
    ]
    const result = postFilterWords(words)
    expect(result).toHaveLength(2)
    expect(result.map(w => w.original)).toContain('ResNet')
    expect(result.map(w => w.original)).toContain('Transformer')
  })

  it('过滤空释义', () => {
    const words: ExtractedWord[] = [
      { original: 'Test', briefMeaning: '', detailAnalysis: '', sentences: [] },
      { original: 'Valid', briefMeaning: '有效', detailAnalysis: '', sentences: [] },
    ]
    const result = postFilterWords(words)
    expect(result).toHaveLength(1)
    expect(result[0].original).toBe('Valid')
  })
})
