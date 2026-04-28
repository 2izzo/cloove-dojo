# Word Count

Implement a function that counts the frequency of each word in a string,
returning a map (Record / object) from word to count.

## Behavior

```
wordCount("")                          → {}
wordCount("hello")                     → { hello: 1 }
wordCount("hello hello world")         → { hello: 2, world: 1 }
wordCount("Hello, hello!")             → { hello: 2 }    // case-insensitive, punctuation stripped
wordCount("don't stop")                → { "don't": 1, stop: 1 }   // apostrophes within words preserved
wordCount("one  two   three")          → { one: 1, two: 1, three: 1 }   // multi-space ok
```

## Constraints

- A word is a maximal run of `[a-zA-Z']` characters, with at least one
  letter. Lowercased before counting. Apostrophes inside a word
  (contractions like "don't", "it's") are preserved.
- Leading/trailing apostrophes on a token are stripped (`"'hello'"`
  becomes `"hello"`).
- Whitespace, digits, and any other punctuation are word separators.
- The function never throws; empty input returns `{}`.
