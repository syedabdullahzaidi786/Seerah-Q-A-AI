'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Bot, ChevronRight, CircleAlert, Copy, Check, Loader2, Send, ShieldCheck, X } from 'lucide-react'
import type { ChatResponse, Citation } from '@/types/corpus'

const suggestions = ['What does the Shamail corpus say about the Prophet ﷺ?', 'What descriptions of the Prophet ﷺ are recorded?', 'Show me information from the Seerah timeline.']

type Message = { role: 'user' | 'assistant'; content: string; citations?: Citation[]; classification?: string; createdAt?: Date }

function getReference(source: Pick<Citation, 'hikayat' | 'urHikayat'>): string {
  const ref = source.hikayat?.trim() || source.urHikayat?.trim()
  return ref && ref.length > 0 ? ref : 'Unknown'
}

// ──────────────────────────────────────────────────────────
// Loading Splash Screen
// ──────────────────────────────────────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 2400)
    const t2 = setTimeout(onDone, 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6 text-center">
        {/* Logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-primary/20 blur-xl scale-110" />
          <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-2xl ring-4 ring-primary/10">
            <img src="/logo.webp" alt="Seerah AI Logo" className="size-full object-cover" />
          </div>
        </div>

        {/* Urdu Welcome Message */}
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl" dir="rtl">
            خوش آمدید
          </h1>
        </div>

        {/* Loading dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Source Card
// ──────────────────────────────────────────────────────────
function SourceCard({ source, onClick }: { source: Citation; onClick: () => void }) {
  const ref = getReference(source)
  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-xl border border-border/50 bg-card/60 p-4 text-left transition-all hover:border-primary/50 hover:bg-card hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      aria-label={`View ${source.title}`}
    >
      {/* Top accent bar */}
      <span className="absolute top-0 left-0 h-0.5 w-0 bg-gradient-to-r from-primary to-primary/40 transition-all duration-300 group-hover:w-full" />

      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <BookOpen size={16} />
        </span>
        <div className="min-w-0 flex-1">
          {/* Type · Entry · Category */}
          <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 truncate mb-0.5">
            {source.type} · Entry #{source.id}{source.category ? ` · ${source.category}` : ''}
          </span>
          {/* Title */}
          <span className="block text-sm font-semibold text-foreground leading-snug mb-2">
            {source.title}
          </span>
          {/* Reference */}
          <span className="flex items-start gap-1.5">
            <span className="mt-px text-[10px] font-bold uppercase tracking-widest text-primary/70 shrink-0">Ref:</span>
            <span className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2" dir="auto">{ref}</span>
          </span>
        </div>
        <ChevronRight className="mt-1 shrink-0 text-muted-foreground opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-primary" size={16} />
      </div>
    </button>
  )
}

// ──────────────────────────────────────────────────────────
// Message Bubble
// ──────────────────────────────────────────────────────────
function MessageBubble({ message, onSelectSource }: { message: Message; onSelectSource: (s: Citation) => void }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <article className={message.role === 'user' ? 'ml-auto max-w-[88%] w-full' : 'max-w-[94%] w-full'}>
      <div className="flex flex-col gap-1">
        <div
          className={message.role === 'user'
            ? 'rounded-2xl rounded-br-sm bg-primary px-5 py-3.5 text-sm leading-relaxed text-primary-foreground ml-auto shadow-md'
            : 'group relative rounded-2xl rounded-bl-sm border border-border/70 bg-card/80 backdrop-blur-md px-5 py-4 text-sm leading-relaxed shadow-sm pr-11'}
          dir="auto"
        >
          {message.role === 'assistant' && (
            <button
              onClick={handleCopy}
              className="absolute right-2 top-2 p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              aria-label="Copy message"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        {message.createdAt && (
          <span className={`text-[10px] text-muted-foreground px-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      {message.citations?.length ? (
        <div className="mt-3 grid gap-2">
          {message.citations.map((source) => (
            <SourceCard key={`${source.type}-${source.id}`} source={source} onClick={() => onSelectSource(source)} />
          ))}
        </div>
      ) : null}
    </article>
  )
}

// ──────────────────────────────────────────────────────────
// Main Chat Component
// ──────────────────────────────────────────────────────────
export function SeerahChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Citation | null>(null)
  const [error, setError] = useState('')
  const [showSplash, setShowSplash] = useState(true)

  async function submit(value = input) {
    const message = value.trim()
    if (!message || loading) return
    setMessages((current) => [...current, { role: 'user', content: message, createdAt: new Date() }])
    setInput(''); setLoading(true); setError('')
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setMessages((current) => [...current, { role: 'assistant', content: data.answer, citations: data.citations, classification: data.classification, createdAt: new Date() }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedRef = selected ? getReference(selected) : ''

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}

      <header className="fixed inset-x-0 top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><Bot size={20} /></div>
            <div>
              <h1 className="font-serif text-lg font-semibold tracking-tight">Seerah Q&A AI</h1>
              <p className="text-xs text-muted-foreground">AI - Seerah Content Bot</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="text-primary" size={14} />
            <span className="hidden sm:inline">Corpus grounded</span>
            <span className="sm:hidden">Grounded</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-36 pt-24 sm:px-6">
        {/* Background watermark */}
        <div className="fixed inset-0 z-[-1] flex items-center justify-center pointer-events-none opacity-5 dark:opacity-[0.02]">
          <img src="/logo.webp" alt="" className="w-[70vw] max-w-lg object-contain grayscale" />
        </div>

        <section className="flex flex-1 flex-col justify-center py-10 sm:py-16">
          {!messages.length ? (
            <div className="mx-auto w-full max-w-2xl relative">
              <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent blur-2xl rounded-full scale-150" />
              <div className="mb-12 text-center">
                <div className="mx-auto mb-6 flex size-20 items-center justify-center overflow-hidden rounded-[2rem] border border-border bg-card shadow-lg ring-4 ring-primary/5">
                  <img src="/logo.webp" alt="Seerah Logo" className="size-full object-cover" />
                </div>
                <h2 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Ask about the Seerah</h2>
                <p className="mx-auto mt-4 max-w-lg text-pretty leading-relaxed text-muted-foreground">Explore answers drawn only from the approved Shamail and Seerah Timeline corpus, with a source for every factual response.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} onClick={() => submit(suggestion)} className="group flex flex-col justify-between rounded-2xl border border-border/60 bg-card/50 p-5 text-left text-sm leading-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:bg-card hover:shadow-md">
                    <span className="text-foreground/90">{suggestion}</span>
                    <ChevronRight className="mt-4 text-primary opacity-70 transition-transform group-hover:translate-x-1 group-hover:opacity-100" size={18} />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
              {messages.map((message, index) => (
                <MessageBubble key={index} message={message} onSelectSource={setSelected} />
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin" size={16} /> Searching approved sources…
                </div>
              )}
            </div>
          )}
        </section>

        {error && (
          <div className="mx-auto mb-3 flex w-full max-w-2xl items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <CircleAlert size={16} />{error}
          </div>
        )}

        {/* Prompt bar */}
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border/50 bg-background/80 px-4 pb-6 pt-4 backdrop-blur-xl sm:pb-8">
          <div className="mx-auto max-w-2xl">
            <form
              onSubmit={(event) => { event.preventDefault(); submit() }}
              className="flex items-end gap-2 rounded-2xl border border-border/80 bg-card/90 p-2 shadow-xl shadow-black/5 ring-1 ring-primary/5 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all"
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); submit() } }}
                placeholder="Ask a question about the Seerah…"
                rows={1}
                className="min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground"
                aria-label="Ask a question about the Seerah"
              />
              <button
                disabled={!input.trim() || loading}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                aria-label="Send question"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
              </button>
            </form>
            <p className="mt-3 text-center text-[11px] font-medium leading-4 text-muted-foreground/80">
              AI-generated responses are limited to the approved Seerah corpus. This assistant does not provide fatwas or religious rulings.
            </p>
          </div>
        </div>

        {/* Source Detail Modal */}
        {selected && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center"
            onClick={() => setSelected(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl border border-border/60 bg-card shadow-2xl ring-1 ring-white/5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header — gradient */}
              <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-transparent px-5 pt-5 pb-4">
                {/* Decorative circle */}
                <div className="absolute -top-6 -right-6 size-32 rounded-full bg-primary/10 blur-2xl" />

                {/* Close button */}
                <button
                  onClick={() => setSelected(null)}
                  className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>

                {/* Icon + type badge */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary ring-1 ring-primary/20">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                      {selected.type}
                    </span>
                    {selected.category && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {selected.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-serif text-xl font-bold leading-snug text-foreground">{selected.title}</h3>
                {selected.urTitle && (
                  <h3 className="mt-1 font-serif text-base font-medium text-muted-foreground" dir="rtl">{selected.urTitle}</h3>
                )}

                {/* Entry ID */}
                <p className="mt-1.5 text-[11px] text-muted-foreground/70">Entry #{selected.id}</p>

                {/* Reference pill */}
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                  <span className="mt-0.5 shrink-0 text-[10px] font-extrabold uppercase tracking-widest text-primary">Ref</span>
                  <span className="text-[12px] leading-relaxed text-muted-foreground" dir="auto">{selectedRef}</span>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 grid gap-0">
                {/* English Content */}
                <div className="rounded-xl bg-muted/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="size-1.5 rounded-full bg-primary" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">English</p>
                  </div>
                  <p className="whitespace-pre-wrap text-[13.5px] leading-7 text-foreground/90" dir="auto">{selected.text}</p>
                </div>

                {/* Urdu Content */}
                {selected.urText && (
                  <div className="mt-3 rounded-xl bg-muted/20 border border-border/50 p-4">
                    <div className="flex items-center justify-end gap-2 mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground" dir="rtl">اردو</p>
                      <span className="size-1.5 rounded-full bg-primary/70" />
                    </div>
                    <p className="whitespace-pre-wrap text-[13.5px] leading-8 text-foreground/85" dir="rtl">{selected.urText}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
