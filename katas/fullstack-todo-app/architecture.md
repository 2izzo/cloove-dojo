# Todo App — Architecture Guide

## Component Structure

```
src/
├── App.vue              # Root component — layout wrapper
├── components/
│   ├── TodoForm.vue     # Input + add button
│   ├── TodoList.vue     # Renders list of TodoItem components
│   ├── TodoItem.vue     # Single todo: text + checkbox + delete button
│   └── TodoFooter.vue   # Item count + clear completed button
├── types.ts             # Todo interface
└── main.ts              # App entry (provided in scaffold)
```

## Data Model

```typescript
// types.ts
export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}
```

## State Management

All state lives in `App.vue` using Vue 3 `ref`:

```typescript
const todos = ref<Todo[]>([]);
let nextId = 0;
```

Pass state down via props. Emit events up for mutations:

- `TodoForm` emits `add(text: string)`
- `TodoItem` emits `toggle(id: number)` and `delete(id: number)`
- `TodoFooter` emits `clear-completed`

## Key Patterns

- **Computed properties** for derived state:
  - `activeTodos` — filter where `completed === false`
  - `completedTodos` — filter where `completed === true`
  - `activeCount` — length of `activeTodos`
  - `hasCompleted` — boolean, controls "clear completed" visibility

- **Event handling** in App.vue:
  - `addTodo(text)` — push new Todo, increment nextId
  - `toggleTodo(id)` — flip completed boolean
  - `deleteTodo(id)` — filter out by id
  - `clearCompleted()` — filter to only active todos

## Export Pattern

Each component is a single-file component (`.vue`) with:
```vue
<script setup lang="ts">
// props, emits, logic
</script>

<template>
  <!-- semantic HTML with data-testid attributes -->
</template>

<style scoped>
/* minimal styling */
</style>
```
