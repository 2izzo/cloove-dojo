---
type: seed
cloove: dev
topic: contract-index-pattern
tags: [contract, vue, v-for, testid, fullstack]
applies_to: fullstack-katas
---

# Seed — `{index}` in a testid pattern means v-for index, not record id

When a fullstack kata's `contract.yaml` specifies a testid pattern with `{index}`:

```yaml
testid_pattern: todo-item-{index}
```

`{index}` is the **iteration index from `v-for`**, not the record's `id` field. They look identical on initial render — both `0, 1, 2, ...` — but they diverge the moment a record is deleted or reordered.

## Right

```html
<li v-for="(todo, index) in todos" :data-testid="`todo-item-${index}`">
  {{ todo.text }}
</li>
```

## Wrong

```html
<li v-for="todo in todos" :data-testid="`todo-item-${todo.id}`">
  {{ todo.text }}
</li>
```

## Why this matters

The blind-oracle e2e suite asserts on `todo-item-0`, `todo-item-1`, etc. by position. If you bind the testid to `todo.id`, the initial render passes — but the moment a test deletes the first todo, the remaining items have testids `todo-item-1`, `todo-item-2`, ... and the oracle's `getByTestId('todo-item-0')` returns nothing. Cascade failure.

## Why this seed exists

Bug 23 from the 2026-04-23 fullstack-todo-app session. The model abstracts "loop variable" to "record id" because that's how it's used in 80% of training-data Vue components. The contract is explicit; honor it literally.
