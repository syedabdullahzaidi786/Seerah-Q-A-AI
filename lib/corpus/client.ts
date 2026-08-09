import type { CorpusEntry, CorpusType } from '@/types/corpus'

// ─────────────────────────────────────────────────────────────────────────────
// Typed error — lets callers distinguish "API down" from "no results"
// ─────────────────────────────────────────────────────────────────────────────
export class CorpusApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message)
    this.name = 'CorpusApiError'
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Base URL — configurable via env, hardcoded default as safe fallback
// ─────────────────────────────────────────────────────────────────────────────
function getBase(): string {
  return (
    process.env.CORPUS_BASE_URL?.replace(/\/$/, '') ??
    'https://api.islamicdesk.com/api/seerathon/corpus'
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON shape helpers — handles paginated {data:{items:[]}} and plain arrays
// ─────────────────────────────────────────────────────────────────────────────
function listFrom(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  const v = value as Record<string, unknown> | null | undefined
  if (Array.isArray(v?.data)) return v!.data as unknown[]
  const data = v?.data as Record<string, unknown> | undefined
  if (Array.isArray(data?.items)) return data!.items as unknown[]
  return (
    (v?.items as unknown[]) ??
    (v?.results as unknown[]) ??
    (v?.entries as unknown[]) ??
    []
  )
}

function localized(value: unknown): string {
  if (typeof value === 'string') return value
  const v = value as Record<string, unknown> | null | undefined
  return (
    (v?.en as string) ||
    (v?.ur as string) ||
    (v?.romanUrdu as string) ||
    ''
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalize a raw Corpus API record into a CorpusEntry
//
// Shamail schema (confirmed live):
//   { id, source:"shamail", category:{id,name:{en,ur}}, keywords:[],
//     en:{ title, hadeesTarjama, hadeesHawala, type, points:[] }, ur:{...} }
//
// Timeline schema (confirmed live):
//   { id, source:"seerah_timeline",
//     en:{ title, section, content:[{title, sequence, content_text}] }, ur:{...} }
// ─────────────────────────────────────────────────────────────────────────────
function normalize(raw: unknown, type: CorpusType): CorpusEntry | null {
  const r = raw as Record<string, unknown>
  const id: unknown = r?.id ?? r?.uuid ?? r?._id
  if (id == null) return null

  // Prefer English locale content; fall back to Urdu
  const locale = (r?.en ?? r?.ur ?? {}) as Record<string, unknown>

  // Timeline: join all content_text items
  const timelineText = Array.isArray(locale?.content)
    ? (locale.content as Array<Record<string, unknown>>)
        .map((item) =>
          [item?.title, item?.content_text].filter(Boolean).join(': '),
        )
        .join('\n\n')
    : ''

  // Shamail: hadeesTarjama + bulleted points
  const shamailText = [
    locale?.hadeesTarjama,
    ...(Array.isArray(locale?.points) ? (locale.points as unknown[]) : []),
  ]
    .filter(Boolean)
    .join('\n\n')

  const text =
    (r?.text as string) ||
    (r?.content as string) ||
    timelineText ||
    shamailText ||
    localized(r?.description) ||
    (r?.body as string) ||
    (r?.narrative as string)

  if (!text) return null

  // hikayat sourced from hadeesHawala (hadith reference footnote)
  const hikayat = localized(locale?.hadeesHawala) || undefined

  return {
    type,
    id: String(id),
    title:
      localized(locale?.title) ||
      localized(r?.title) ||
      `${type === 'shamail' ? 'Shamail' : 'Timeline'} entry ${id}`,
    text: String(text),
    category:
      localized((r?.category as Record<string, unknown>)?.name) ||
      (r?.category_name as string),
    section: (locale?.section as string) || (r?.section as string),
    hikayat,
    raw: r,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Query expansion — produces SINGLE-WORD API-compatible search terms.
//
// The Corpus API `q` param is a keyword filter; multi-word phrases return 0
// results. The original user question is never passed as a `q` value.
//
// Supports: English · Urdu · Roman Urdu · Arabic
// ─────────────────────────────────────────────────────────────────────────────
export function expandQueries(query: string): string[] {
  const lower = query.toLowerCase()
  const terms: string[] = []

  // ── Physical description / appearance ─────────────────────────────────────
  // English: description, appearance, look, physical, height, face, hair…
  // Urdu: حلیہ (huliya), اوصاف (awsaf)
  // Roman Urdu: huliya, jism, rang, qad
  if (
    /description|appearance|look|physical|height|face|hair|complexion|body|figure|stature|حلیہ|اوصاف|huliya|jism|rang\b|qad\b/.test(
      lower,
    )
  ) {
    terms.push('physical', 'appearance', 'characteristics')
  }

  // ── Moral qualities / character ────────────────────────────────────────────
  // English: qualities, character, moral, traits, virtue, attributes
  // Urdu: صفات (sifaat), اخلاق (akhlaq)
  // Roman Urdu: sifaat, akhlaq, kirdaar
  if (
    /qualit|character|moral|akhlaq|trait|virtue|attribute|صفات|اخلاق|sifaat|kirdaar/.test(
      lower,
    )
  ) {
    terms.push('moral', 'qualities', 'character')
  }

  // ── Birth / early life / childhood ─────────────────────────────────────────
  // Urdu: ولادت (wiladat)
  // Roman Urdu: wiladat, paidaish
  if (/birth|born|childhood|wiladat|ولادت|paidaish/.test(lower)) {
    terms.push('birth', 'childhood', 'wiladat')
  }

  // ── Prophethood / revelation / mission ────────────────────────────────────
  // Urdu: وحی (wahi), نبوت (nubuwwat)
  // Roman Urdu: wahi, nubuwwat, risalat
  if (
    /prophet|prophethood|revelation|wahi|نبوت|وحی|nubuwwat|risalat|mission/.test(
      lower,
    )
  ) {
    terms.push('prophet', 'prophethood')
  }

  // ── Hijra / migration ─────────────────────────────────────────────────────
  // Urdu: ہجرت (hijrat), مدینہ (madinah)
  // Roman Urdu: hijrat, hijra, madina
  if (/hijra|migration|madina|مدینہ|ہجرت|hijrat/.test(lower)) {
    terms.push('hijra', 'migration')
  }

  // ── Battles / military expeditions ───────────────────────────────────────
  // Urdu: غزوہ (ghazwa), جنگ (jang)
  // Roman Urdu: ghazwa, jang, badr, uhud
  if (/battle|ghazwa|war|badr|uhud|غزوہ|جنگ|jang\b/.test(lower)) {
    terms.push('battle', 'ghazwa')
  }

  // ── Companions / Sahaba ────────────────────────────────────────────────────
  // Urdu: صحابہ (sahaba)
  // Roman Urdu: sahaba, sahabi, ashab
  if (/companion|sahaba|صحابہ|sahabi|ashab/.test(lower)) {
    terms.push('companion', 'sahaba')
  }

  // ── Daily life / habits / practices ──────────────────────────────────────
  // Roman Urdu: adat, aadat, waza, rawish
  if (/daily|habit|practice|lifestyle|routine|عادت|adat|aadat|waza/.test(lower)) {
    terms.push('daily', 'habits')
  }

  // ── Generic fallback: extract meaningful individual words ─────────────────
  // Words ≥ 4 chars, no digits, not in the stop-word list
  const STOPWORDS = new Set([
    'what', 'were', 'that', 'this', 'from', 'with', 'have', 'been', 'about',
    'which', 'their', 'them', 'they', 'then', 'when', 'where', 'does', 'will',
    'into', 'more', 'some', 'than', 'also', 'only', 'each', 'very', 'many',
    'much', 'most', 'such', 'both', 'made', 'make', 'like', 'time', 'know',
    'just', 'over', 'back', 'after', 'before', 'during', 'while', 'recorded',
    'said', 'says', 'tell', 'show', 'give', 'find', 'list', 'describe', 'kaisa',
    'kaise', 'kahan', 'kiyaa', 'karta', 'karty', 'hain', 'tha', 'thi', 'the',
    'nabi', 'nabi', 'please', 'could', 'would', 'should', 'shall', 'might',
  ])
  const wordTokens = query
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !/\d/.test(w))

  terms.push(...wordTokens)

  // Deduplicate; cap at 5 terms to avoid excessive API calls
  return [...new Set(terms)].slice(0, 5)
}

// ─────────────────────────────────────────────────────────────────────────────
// Relevance score — transparent, deterministic, debuggable
//
// Scoring weights:
//   +4  exact phrase match in haystack
//   +3  title match
//   +2  category match
//   +1  per keyword match (expanded terms)
// ─────────────────────────────────────────────────────────────────────────────
function score(entry: CorpusEntry, query: string): number {
  const rawKeywords = Array.isArray(
    (entry.raw as { keywords?: unknown[] } | undefined)?.keywords,
  )
    ? ((entry.raw as { keywords: unknown[] }).keywords as string[]).join(' ')
    : ''

  const titleHaystack = entry.title.toLowerCase()
  const categoryHaystack = (entry.category ?? '').toLowerCase()
  const fullHaystack =
    `${entry.title} ${entry.category ?? ''} ${entry.text} ${rawKeywords}`.toLowerCase()
  const queryLower = query.toLowerCase()

  let s = 0
  // Exact phrase bonus
  if (fullHaystack.includes(queryLower)) s += 4
  // Title match bonus
  if (titleHaystack.includes(queryLower)) s += 3
  // Category match bonus
  if (categoryHaystack.includes(queryLower)) s += 2
  // Per-term keyword matches
  s += expandQueries(query).reduce(
    (total, term) => total + (fullHaystack.includes(term.toLowerCase()) ? 1 : 0),
    0,
  )
  return s
}

// ─────────────────────────────────────────────────────────────────────────────
// searchCorpus — main entry point
//
// Throws CorpusApiError  → caller returns 503 "service unavailable"
// Returns []             → caller returns OUT_OF_CORPUS (API fine, no matches)
// ─────────────────────────────────────────────────────────────────────────────
export async function searchCorpus(query: string): Promise<CorpusEntry[]> {
  const base = getBase()
  const terms = expandQueries(query)

  console.log('[corpus] Expanded queries', { query, terms })

  // One [type, url] pair per (corpus-type × search-term) combination
  const endpoints: Array<[CorpusType, string]> = terms.flatMap((term) => [
    ['shamail', `${base}/shamail?limit=120&q=${encodeURIComponent(term)}`],
    ['timeline', `${base}/timeline?limit=50&q=${encodeURIComponent(term)}`],
  ])

  const settled = await Promise.allSettled(
    endpoints.map(async ([type, url]) => {
      const res = await fetch(url, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) {
        throw new CorpusApiError(
          `Corpus ${type} unavailable (HTTP ${res.status})`,
          res.status,
        )
      }
      const data: unknown = await res.json()
      const items = listFrom(data)
        .map((item) => normalize(item, type))
        .filter((e): e is CorpusEntry => e !== null)
      return { type, items }
    }),
  )

  const successes = settled.filter(
    (
      r,
    ): r is PromiseFulfilledResult<{ type: CorpusType; items: CorpusEntry[] }> =>
      r.status === 'fulfilled',
  )
  const failures = settled.filter((r) => r.status === 'rejected')

  // All requests failed → API is down
  if (successes.length === 0) {
    const sample = (failures[0] as PromiseRejectedResult).reason
    throw new CorpusApiError(
      `All corpus requests failed: ${sample instanceof Error ? sample.message : String(sample)}`,
    )
  }

  // Partial failures — log but continue with what we have
  if (failures.length > 0) {
    console.warn('[corpus] Some requests failed (partial results used)', {
      failed: failures.length,
      succeeded: successes.length,
    })
  }

  // Deduplicate by composite key type:id
  const unique = new Map<string, CorpusEntry>()
  for (const { items } of successes.map((r) => r.value)) {
    for (const entry of items) {
      unique.set(`${entry.type}:${entry.id}`, entry)
    }
  }

  // Rank: Shamail type boost (physical/character entries are primary) + relevance score
  const ranked = [...unique.values()].sort((a, b) => {
    const typeBoost =
      (b.type === 'shamail' ? 2 : 0) - (a.type === 'shamail' ? 2 : 0)
    return typeBoost || score(b, query) - score(a, query)
  })

  console.log('[corpus] Retrieval complete', {
    query,
    terms,
    total: ranked.length,
    shamail: ranked.filter((e) => e.type === 'shamail').length,
    timeline: ranked.filter((e) => e.type === 'timeline').length,
    topIds: ranked.slice(0, 8).map((e) => e.id),
    topTitles: ranked.slice(0, 8).map((e) => e.title),
  })

  return ranked.slice(0, 8)
}
