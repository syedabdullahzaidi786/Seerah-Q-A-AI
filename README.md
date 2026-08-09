# Seerah Q&A AI

A trust-first Web Chat prototype for the Seerathon Developers / AI Engineers challenge. It answers only from approved Shamail and Seerah Timeline corpus records and displays the retrieved records as citations.

## Setup

Install dependencies with `pnpm install`, copy `.env.example` to `.env.local`, then run `pnpm dev`.

`CORPUS_BASE_URL` points at the host exposing `/api/seerathon/corpus`. Optional `LLM_API_KEY`, `LLM_MODEL`, and `LLM_BASE_URL` enable an OpenAI-compatible server-side model call. Without an LLM key, the prototype still returns retrieved corpus text with valid citations.

## Architecture

`POST /api/chat` classifies the bounded user message, refuses ruling-style requests, searches both Shamail and Timeline, constructs a source-only context, and optionally calls the configured model. The client renders the response and opens the original approved source text in a detail panel.

## Corpus grounding

The assistant is intentionally restricted to the approved Shamail + Timeline corpus and does not act as a general-purpose Islamic chatbot. Courses are not searched or used as answer sources. If retrieval fails or returns no records, the app does not fabricate an answer or citation.

## Safety and demo checklist

- Corpus question: answer includes retrieved source cards.
- Weather, JavaScript, or other unrelated question: safe corpus-only fallback.
- Halal, haram, fatwa, or permissibility question: refusal and qualified alim redirect.
- Prompt injection: classified outside the allowed corpus flow.
- Missing corpus/model: friendly error or citation-preserving fallback.
- Persistent disclaimer remains below the composer on desktop and mobile.
"# Seerah-Q-A-AI" 
