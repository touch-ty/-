export interface Sentence {
  en: string
  cn: string
}

export interface Phrase {
  en: string
  cn: string
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
  syno?: string[]
  wordFamily?: string[]
  etymology?: string
  collocations?: string[]
  synonyms?: string[]
  explanation?: string
}

export type WordLevel = 'cet4' | 'cet6' | 'paper'

export interface LearningWord extends Word {
  level: WordLevel
  learned: boolean
  lastReviewed?: number
}

export interface ExtractedWord {
  original: string
  briefMeaning: string
  detailAnalysis: string
  sentences: Sentence[]
  context?: string
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
  round: number
  correctCount: number
  lastReviewed?: number
}
