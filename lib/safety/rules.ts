import type { ChatClassification } from '@/types/corpus'

const rulingPattern = /\b(halal|haram|wajib|fard|fatwa|ruling|permissible|allowed|forbidden|sunnah ruling|religious advice|according to islam)\b/i
const injectionPattern = /(ignore (all|any|the) previous|ignore your (rules|instructions)|tell me everything you know|act as|system prompt|jailbreak)/i

export function classifyQuestion(message: string): ChatClassification {
  if (rulingPattern.test(message)) return 'FATWA_OR_RULING'
  if (injectionPattern.test(message)) return 'OUT_OF_CORPUS'
  return 'IN_CORPUS'
}

export const FALLBACK = "I can only answer questions supported by the approved Seerah corpus. I couldn't find enough information in the available sources to answer this question reliably."
export const RULING_REFUSAL = "I’m not able to provide fatwas or religious rulings. Please consult a qualified alim/scholar for guidance."
