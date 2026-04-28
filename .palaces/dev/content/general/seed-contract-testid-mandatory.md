---
type: seed
cloove: dev
topic: contract-testid-mandatory
tags: [contract, testid, vue, fullstack, compliance]
applies_to: fullstack-katas
---

# Seed — Bind every contract testid

Every entry in the contract's `elements:` block has a `testid:` value. The
compliance check looks up `data-testid="<that-testid>"` in the rendered DOM
for each one. Miss any single testid and your compliance score drops.

## The rule

For every `- testid: foo` in the contract, your output must contain
`data-testid="foo"` on a DOM node of the matching `element:` type, in the
matching `location:`. No selective skipping.

## Common miss

The h1 inside `<header>` is the testid most often forgotten — the model
writes `<h1>App</h1>` because that "looks Vue-natural," but the contract
asks for `<h1 data-testid="app-title">App</h1>`. Always re-read the
contract's elements list and bind each testid.

## Pattern

```html
<header>
  <h1 data-testid="app-title">My Todo App</h1>
</header>
<main>
  <form>
    <input data-testid="todo-input" v-model="newTodo" />
    <button data-testid="todo-submit" type="submit">Add</button>
  </form>
</main>
```

If the contract lists 5 testids, your output has 5 `data-testid` attributes.
