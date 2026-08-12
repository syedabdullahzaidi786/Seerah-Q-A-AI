export type CorpusType = 'shamail' | 'timeline'

export type CorpusEntry = {
  type: CorpusType
  id: string
  title: string
  text: string
  urTitle?: string
  urText?: string
  category?: string
  section?: string
  hikayat?: string
  urHikayat?: string
  raw?: unknown
}

export type Citation = Pick<CorpusEntry, 'type' | 'id' | 'title' | 'urTitle' | 'category' | 'section' | 'text' | 'urText' | 'hikayat' | 'urHikayat'>

export type ChatClassification = 'IN_CORPUS' | 'OUT_OF_CORPUS' | 'FATWA_OR_RULING' | 'AMBIGUOUS'

export type ChatResponse = {
  answer: string
  classification: ChatClassification
  citations: Citation[]
}

export type ChatRequest = { message: string }
