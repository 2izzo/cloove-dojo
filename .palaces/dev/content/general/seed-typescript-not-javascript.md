---
type: seed
cloove: dev
topic: typescript-not-javascript
tags: [typescript, language, tooling]
applies_to: all-katas
---

# Seed — This dojo is TypeScript. Emit `.ts`, not `.js`.

Every kata in this dojo is TypeScript. The test runner is `vitest` configured for TypeScript. Source files end in `.ts` (or `.vue` for components). `.js` files are not picked up by the test runner and will be ignored.

## What to emit

- `src/calculator.ts` — implementation
- `tests/calculator.test.ts` — only when the kata explicitly asks for tests
- For Vue components: `src/MyComponent.vue` (with `<script setup lang="ts">`)

## What NOT to emit

- `src/calculator.js` — wrong extension, runner won't find it
- `bowling.cjs` — CommonJS module, dojo is ESM-only
- Multiple variants of the same file (`bowling.js`, `bowling-clean.js`, `bowl.js`) — emit ONE file per concept

## Type annotations

Use type annotations on public functions and class members. The kata's tests rely on them for inference. Don't write `function score(rolls)` — write `function score(rolls: number[]): number`.

## Why this seed exists

Bug 29 from the 2026-04-23 ring-ladder session at Ring 3. Without the test scaffolding to ground it, the model sometimes drifts into JavaScript — partly because most "implement bowling game" examples online are JS, partly because removing TS-specific support files (no `tsconfig.json` shown to it) is read as a language signal. The `kata.yaml` has `language: typescript` but that field doesn't reach the prompt by default. Default to TS regardless.
