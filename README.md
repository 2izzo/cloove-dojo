# The Cloove Dojo

**An eval harness for AI coding agents running on local models.**

Clooves, because every magical creature can shoot tiny versions of themselves out of their hooves.

---

## What Is a Cloove?

A Cloove is an atomic, chainable agent specification — a prompt template that tells a local LLM exactly how to approach a coding task. No API tokens burned. No cloud dependency. Just a model on your machine, a spec in a file, and work that gets done.

The Dojo is where Clooves train. It's a controlled environment for measuring how well different **prompt × model × process** combinations perform on standardized coding problems. Think of it as a code bootcamp where the students are AI agents and the instructors are prompts.

## Why Local Models?

Cloud APIs are powerful but expensive. The bet here is that local models — running on consumer hardware through tools like LM Studio — can handle real engineering tasks when given the right prompts. The Dojo proves (or disproves) that bet with data, not vibes.

Every kata in this repo can be solved by a Cloove running on a local model through the [Cline CLI](https://github.com/cline/cline). No Anthropic tokens. No OpenAI tokens. Just your GPU and a well-written spec.

## How It Works

### Katas

Katas are standardized coding problems. Each one lives in its own directory with everything an agent needs to attempt it.

**Backend katas** test pure logic — write a function, pass the tests:

```
katas/leap-year/
├── kata.yaml          # Metadata, difficulty, ring config
├── description.md     # Problem statement
├── architecture.md    # Structural hints (provided at Ring 1-2)
├── tests/             # Test files (provided at Ring 1)
│   └── leap-year.test.ts
└── solution/          # Reference solution (never shown to agent)
    └── leap-year.ts
```

**Full-stack katas** test real app development — build a Vue 3 app, pass both unit and E2E tests:

```
katas/todo-app/
├── kata.yaml          # Metadata, scoring weights, ring config
├── description.md     # What to build
├── architecture.md    # Component design hints
├── contract.yaml      # Dev ↔ SDET agreement (elements, flows, assertions)
└── scaffold/          # Vite + Vue 3 + TypeScript starter (from template)
```

### Rings

Rings control how much help the agent gets. Higher rings remove more supports:

| Ring | What's Provided | What the Agent Must Do |
|------|----------------|----------------------|
| 1 | Description, architecture, tests, contract, scaffold | Implement to pass existing tests |
| 2 | Description, architecture, contract, scaffold | Write tests, then implement |
| 3 | Description, contract, scaffold | Design architecture, write tests, implement |
| 4 | Description, scaffold | Derive the contract, then everything else |

Ring 1 is training wheels. Ring 4 is "here's a sentence — ship the app."

### Prompts

Prompts are the instructors. Each prompt lives in `prompts/` and defines a strategy for how the agent should approach work:

```
prompts/sdet-v1/
├── prompt.yaml        # Metadata, model target, features
└── implement.md       # The prompt template with {{variables}}
```

A prompt can target a specific role. `sdet-v1` is a QA engineer — it reads a `contract.yaml` and writes Puppeteer E2E tests. A dev prompt reads a kata description and builds the app. They never see each other's work. They share the contract.

### The Contract

Full-stack katas introduce a contract — a YAML file that serves as the handshake between the dev Cloove (who builds) and the SDET Cloove (who tests). The contract specifies:

- **Semantic HTML requirements** — what elements must exist and where
- **`data-testid` attributes** — stable selectors the SDET can target
- **User flows** — step-by-step interactions with expected assertions
- **Routes** — what pages exist and what's on them

This mirrors real engineering practice. Devs and SDETs agree on testable interfaces before anyone writes code. The contract IS the spec.

### Scoring

Backend katas score on: tests passing, code quality (lint), number of edit cycles, and wall time.

Full-stack katas add: E2E test pass rate (30%), contract compliance (15% — did you actually put the `data-testid` attributes where you promised?).

## What's in the Box

### Backend Katas (15)

| Kata | Difficulty | Description |
|------|-----------|-------------|
| leap-year | Beginner | Leap year determination rules |
| fibonacci | Beginner | Fibonacci sequence generation |
| prime-factors | Beginner | Prime factorization |
| pangram | Beginner | Sentence contains every letter |
| isbn-verifier | Beginner | ISBN-10 validation |
| anagram | Intermediate | Find anagrams from a word list |
| clock | Intermediate | Time arithmetic with wraparound |
| word-count | Intermediate | Word frequency counting |
| luhn | Intermediate | Luhn checksum validation |
| binary-search | Intermediate | Binary search implementation |
| linked-list | Intermediate | Doubly linked list |
| diamond | Intermediate | Diamond pattern generation |
| bank-account | Hard | Thread-safe bank account |
| mars-rover | Hard | Mars rover grid navigation |
| game-of-life | Hard | Conway's Game of Life |

### Full-Stack Katas (5)

| Kata | Difficulty | Description |
|------|-----------|-------------|
| todo-app | Beginner | Classic TodoMVC — add, complete, delete |
| calculator | Beginner | Basic calculator with chained operations |
| weather-dashboard | Intermediate | API-driven dashboard with mock data |
| markdown-previewer | Intermediate | Live Markdown preview with sanitization |
| kanban-board | Advanced | Three-column board with card management |

All full-stack katas use Vue 3 Composition API with `<script setup>`, Vite, and TypeScript. The scaffold template provides a clean starting point.

### Prompts

| Prompt | Role | Target Model | Description |
|--------|------|-------------|-------------|
| sdet-v1 | SDET | Devstral | Reads contract, writes Puppeteer E2E tests |

Dev prompts (cloove-v1, etc.) live on the runner and are being open-sourced as they stabilize.

## Getting Started

### Prerequisites

- [LM Studio](https://lmstudio.ai/) or compatible local model server
- [Cline CLI](https://github.com/cline/cline) (for automated runs)
- Node.js 18+
- A model that can write code (Devstral, Qwen 3 Coder, etc.)

### Run a Backend Kata

1. Pick a kata and a ring level
2. Copy the provided files to a working directory
3. Point your Cloove prompt at the kata
4. Fire it through Cline CLI
5. Score: did the tests pass? How many cycles? How long?

### Run a Full-Stack Kata

1. Copy the scaffold template to a working directory
2. `npm install` the dependencies
3. Fire the dev Cloove — it reads the description/architecture/contract and builds the app
4. Fire the SDET Cloove — it reads the contract and writes Puppeteer tests against the running app
5. Score: unit tests + E2E tests + contract compliance + quality + efficiency

### Infrastructure (Coming Soon)

The runner, scorer, contract parser, dev server lifecycle manager, and compliance checker are being built. Right now the Dojo is the curriculum — the katas, contracts, prompts, and scoring rubrics. The automation layer that ties them together is next.

## Early Results

**Backend Ring 1 (cloove-v1 × devstral × 20 katas):** 20/20 passed. Average cycles: 1.20. This prompt-model combination solves beginner-to-hard backend problems on the first or second try, running entirely on local hardware.

Full-stack results are pending — the E2E pipeline is what we're building now.

## Philosophy

The Dojo exists because we believe the SDLC can be democratized. Not "AI writes your code for you" — that's a parlor trick. More like: atomic, well-specified agent tasks, chained together, running on models you own, producing software that real QA processes can verify.

If a Cloove can pass Ring 4 — build an app from a one-sentence description, derive its own contract, write its own tests, and have an independent SDET verify it — that's not a benchmark victory. That's a usable engineering pipeline that costs nothing to run.

The katas are the proof. The prompts are the method. The contracts are the engineering discipline that makes it real.

## License

MIT

## Author

Rizzo ([@2izzo](https://github.com/2izzo)) — built in partnership with Squibs.
