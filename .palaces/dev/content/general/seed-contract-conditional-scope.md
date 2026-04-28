---
type: seed
cloove: dev
topic: contract-conditional-scope
tags: [contract, vue, conditional, fullstack]
applies_to: fullstack-katas
---

# Seed — `assert: conditional` applies to ONE element, not its parents

A `contract.yaml` element marked `assert: conditional` is allowed to appear or disappear based on app state. **That's a property of that element only.** Do not extend conditional rendering to its parent or siblings unless those are also marked conditional.

## Example

```yaml
elements:
  - selector: '[data-testid=todo-list-footer]'
    assert: required
  - selector: '[data-testid=clear-completed]'
    assert: conditional   # only this one can vanish
```

The footer must always render. The "clear completed" button inside it can hide when there are no completed todos. Hiding the entire footer because the button is conditional fails the contract.

## Right

```html
<footer data-testid="todo-list-footer">
  <span>{{ activeCount }} items left</span>
  <button v-if="completedCount > 0" data-testid="clear-completed">Clear completed</button>
</footer>
```

## Wrong

```html
<footer v-if="completedCount > 0" data-testid="todo-list-footer">
  ...
</footer>
```

## Why this seed exists

Bug 26 from the 2026-04-23 session. The model sees one conditional flag and over-generalizes — "the button is conditional, so its container must be too." That's the wrong abstraction. Read each element independently. `assert: conditional` is local.
