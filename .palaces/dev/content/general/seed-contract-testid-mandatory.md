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
matching `location:`. No selective skipping. No assuming "the shell layout
doesn't need testids." If the contract lists it, bind it.

## Discipline before finalizing

Before you emit `STATUS: DONE`, walk the contract's `elements:` list one
entry at a time. For each entry, verify your output includes a
`data-testid="<value>"` somewhere. Count them: if the contract has N
entries, your code has at least N `data-testid` attributes.

## Pattern

```html
<!-- For a header testid the contract lists, bind it -->
<header>
  <h1 data-testid="<header-testid>">{{ title }}</h1>
</header>

<!-- For a form input testid the contract lists -->
<input data-testid="<input-testid>" v-model="value" />

<!-- For a list item that uses a testid_pattern -->
<li v-for="(item, index) in items" :data-testid="`<item-testid>-${index}`">
  ...
</li>
```

## The trap

Testids on leaf components (form inputs, list items, buttons) are easy to
remember — that's where interaction happens. Testids on layout / shell
components (header titles, footer sections, app frames) are easy to skip
because they look like "structure, not state." The contract treats them
identically. Bind every entry.

## Why this seed exists

Compliance scores below 100 stably trace to one or two testids the model
omitted from shell-level components. The contract is the contract. Read
every element. Bind every testid.
