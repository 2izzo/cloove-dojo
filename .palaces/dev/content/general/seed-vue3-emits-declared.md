---
type: seed
cloove: dev
topic: vue3-emits-declared
tags: [vue, vue3, emits, defineEmits, fullstack]
applies_to: fullstack-katas
---

# Seed — Declare emits with defineEmits, fire with emit()

When a Vue 3 child component needs the parent to react to an action
(form submit, button click), declare the event with `defineEmits` and
fire it with `emit('event-name', payload)`. Without `defineEmits`,
`@vue/test-utils`'s `wrapper.emitted('event-name')` returns `undefined`
and unit tests like `expect(wrapper.emitted('add')).toBeTruthy()` fail.

## Pattern (script setup)

```vue
<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{
  (e: "add", text: string): void;
}>();

const newTodo = ref("");

function onSubmit() {
  if (!newTodo.value.trim()) return;
  emit("add", newTodo.value);
  newTodo.value = "";
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input data-testid="todo-input" v-model="newTodo" />
    <button data-testid="todo-submit" type="submit">Add</button>
  </form>
</template>
```

Don't substitute prop callbacks (`props.onAdd(...)`) for emits — the
contract reads emits, not callbacks.
