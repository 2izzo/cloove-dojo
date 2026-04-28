# Palindrome Check

Implement a function that returns `true` if the input string is a
palindrome — reads the same forwards and backwards — after normalization,
and `false` otherwise.

## Behavior

```
isPalindrome("")                          → true   // empty is trivially a palindrome
isPalindrome("a")                         → true
isPalindrome("aba")                       → true
isPalindrome("racecar")                   → true
isPalindrome("hello")                     → false
isPalindrome("A man, a plan, a canal: Panama") → true   // ignores case + non-letters
isPalindrome("Was it a car or a cat I saw?") → true
isPalindrome("No 'x' in Nixon")           → true
```

## Constraints

- **Normalization**: case-insensitive, ignore all non-alphanumeric
  characters (punctuation, spaces). Consider only `[a-zA-Z0-9]`.
- The empty string is a palindrome.
- The function never throws.
