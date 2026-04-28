---
type: seed
cloove: dev
topic: cover-the-domain
tags: [testing, edge-cases, coverage, ring2, tdd]
applies_to: any-kata-where-tests-are-not-provided
---

# Seed — Cover the domain, not just the happy path

When you write tests in TDD mode, two or three happy-path tests are
not enough for any non-trivial algorithm. The runner credits
all-tests-passing; an impl that's subtly wrong but passes your three
weak tests scores zero on the hidden full coverage.

Every problem has a **domain shape** with predictable categories of
test case. Walk each category before declaring your test set
complete.

## The minimum coverage checklist

For ANY function under test, write at least one assertion in EACH
category that applies:

1. **Identity / trivial input** — empty string, empty array, zero,
   identity element. What does the function do when given "nothing"?
2. **Smallest non-trivial input** — single element, single character,
   one-step instance. Does the base case work?
3. **A canonical mid-sized example** — the textbook input from the
   description. The "this is what the function does" case.
4. **Boundary at each documented threshold** — exactly-at, just-below,
   just-above. (Length 50 cap → test at 49, 50, 51.)
5. **Each documented "throws on" condition** — explicitly construct
   the inputs that should throw. One assertion per throw type.
6. **An invariant or property** — symmetry, roundtrip,
   monotonicity, idempotence. If `decode(encode(x)) === x`, write
   that test.

Two or three test cases is rarely enough. Six well-chosen ones
usually catches the subtle bugs in your own implementation.

## Why six

Most off-by-one and edge-case bugs hide between categories 1, 2, 4,
5, and 6 above. Writing only category-3 happy-path tests means an
impl that's wrong in any of those other categories will still pass
your tests — and then fail at evaluation time on cases the model
didn't think to write.

When you're writing tests for an algorithm with a checksum, a
boundary, a special "X" value, a wrap-around, or a throws-on-invalid
condition: cover every documented behavior. Not just the obvious
ones.

## Why this seed exists

On algorithm-heavy katas (ISBN checksum, BFS shortest path, heap
operations), models in TDD mode tend to write 2-3 tests covering
only the happy path, then implement something that subtly fails the
real edge cases. Strong test coverage from the model is the first
line of defense — it catches the model's own bugs before the runner
does.
