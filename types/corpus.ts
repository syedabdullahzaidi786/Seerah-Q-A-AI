export type CorpusType = 'shamail' | 'timeline'

export type CorpusEntry = {
  type: CorpusType
  id: string
  title: string
  text: string
  category?: string
  section?: string
  hikayat?: string
  raw?: unknown
}

export type Citation = Pick<CorpusEntry, 'type' | 'id' | 'title' | 'category' | 'section' | 'text' | 'hikayat'>

export type ChatClassification = 'IN_CORPUS' | 'OUT_OF_CORPUS' | 'FATWA_OR_RULING' | 'AMBIGUOUS'

export type ChatResponse = {
  answer: string
  classification: ChatClassification
  citations: Citation[]
}

export type ChatRequest = { message: string }
