<div align="center">

<img src="./public/logo.webp" alt="Seerah Q&A AI Logo" width="120" />

# Seerah Q&A AI

### AI · Seerah Content Bot — Corpus-Grounded Seerah Q&A Assistant

<p>
  <img src="https://img.shields.io/badge/Status-Demo%20Ready-22c55e?style=for-the-badge" alt="Demo Ready">
  <img src="https://img.shields.io/badge/Platform-Web%20Chat-0ea5e9?style=for-the-badge" alt="Web Chat">
  <img src="https://img.shields.io/badge/Grounding-Corpus%20Only-f59e0b?style=for-the-badge" alt="Corpus Only">
  <img src="https://img.shields.io/badge/AI-Cloudflare%20Workers%20AI-f97316?style=for-the-badge" alt="Cloudflare Workers AI">
</p>

<p>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=nextdotjs" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss" alt="TailwindCSS">
</p>

> **The corpus is the source of truth; AI is the conversational interface.**

</div>

---

## 📌 Overview

A **trust-first** Web Chat prototype for the **Seerathon Developers / AI Engineers** challenge.

- Answers **only** from the approved **Shamail** and **Seerah Timeline** corpus records.
- Every factual answer displays retrieved records as **verified citations**.
- **No free-form fatwas** — ruling-style questions are refused and redirected to a qualified alim.
- **Persistent disclaimer** remains visible at all times.

---

## 🖼️ Screenshots

| Main Interface | In-Corpus Answer with Citations | Source Detail Panel |
|:---:|:---:|:---:|
| ![Main Interface](./docs/image1.png) | ![In-Corpus Answer](./docs/image2.png) | ![Source Detail](./docs/image3.png) |
| Clean dark chat UI with suggested prompts | Grounded answer + Shamail source cards | Full corpus entry in English & Urdu |

---

## ⚡ Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [pnpm](https://pnpm.io/) (recommended) or npm

### Installation

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template
copy .env.example .env.local

# 3. Fill in your credentials in .env.local
# (see Environment Variables section below)

# 4. Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Corpus API (required)
CORPUS_BASE_URL=https://api.islamicdesk.com/api/seerathon/corpus

# Cloudflare Workers AI (required for AI generation)
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_AI_BASE_URL=https://api.cloudflare.com/client/v4/accounts/your_account_id/ai/v1
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct

# Optional: OpenAI-compatible server override
LLM_API_KEY=
LLM_MODEL=
LLM_BASE_URL=
```

> ⚠️ **Never commit real API keys or tokens to Git.** Use `.env.local` which is git-ignored.

Without an LLM key the prototype still returns retrieved corpus text with valid citations.

---

## 🏗️ Architecture

```
POST /api/chat
      │
      ▼
Safety / Intent Check
      │
 ┌────┴────┐
 │         │
 ▼         ▼
Fatwa   Normal Query
Refusal      │
             ▼
     Corpus Retrieval
      ┌──────┴──────┐
      ▼             ▼
   Shamail       Timeline
      └──────┬──────┘
             ▼
      AI Generation
      (Cloudflare Workers AI)
             │
             ▼
    Citation Validation
             │
             ▼
   Final Answer + Source Cards
```

- `POST /api/chat` — classifies the user message, refuses ruling-style requests, searches both **Shamail** and **Timeline**, constructs a source-only context, and calls the configured AI model.
- The client renders the response and opens the original approved source text in a **detail panel**.

---

## 🛡️ Safety & Corpus Grounding

| Scenario | Behavior |
|:---|:---|
| ✅ In-corpus question | Answer with verified citation cards |
| ✅ Out-of-corpus question | Safe corpus-only fallback |
| ✅ Fatwa / ruling request | Refusal + redirect to qualified alim |
| ✅ Prompt injection | Classified outside the allowed corpus flow |
| ✅ Corpus/model failure | Friendly error or citation-preserving fallback |
| ✅ Persistent disclaimer | Always visible on desktop and mobile |

---

## 📦 Tech Stack

| Layer | Technology |
|:---|:---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.7 |
| UI | React 19 + shadcn/ui + TailwindCSS 4 |
| AI Layer | Cloudflare Workers AI |
| Corpus | Seerathon Corpus API (Shamail + Timeline) |
| Icons | Lucide React |

---

## 📚 Documentation

Full technical documentation is in [`docs/documentation.md`](./docs/documentation.md).

It covers:

- Official role brief alignment
- Corpus API reference
- Grounding rules
- System architecture
- Citation & source verification
- Safety & fallback behavior
- Complete QA / test report
- UI/UX design
- Security
- Future improvements
- Deployment checklist

---

## 👨‍💻 Developer

| | |
|:---|:---|
| **Name** | Syed Abdullah Zaidi |
| **Email** | syedabdullahzaidi786@gmail.com |
| **Role** | Developer / AI Engineer |
| **Challenge** | Seerathon — AI Developers Track |

---

<div align="center">

**AI - Seerah Content Bot** · Corpus first. Sources visible. Unsupported claims rejected.

<img src="./public/logo.webp" alt="Seerah Q&A AI" width="60" />

</div>
