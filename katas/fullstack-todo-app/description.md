# Todo Application

Build a single-page todo application using Vue 3 with TypeScript.

## Requirements

Users should be able to:

1. **Add a todo** — Type text into an input field and submit (button click or
   Enter key) to add a new todo item to the list.

2. **View todos** — See all todo items in an ordered list. Each item shows its
   text content and a way to mark it complete.

3. **Complete a todo** — Click a checkbox to toggle a todo between active and
   completed states. Completed todos should be visually distinct (e.g.,
   strikethrough text, different styling).

4. **Delete a todo** — Remove a specific todo from the list entirely.

5. **Clear completed** — Remove all completed todos from the list with a single
   action.

6. **Item count** — Display the number of remaining (active) todos.

## Behavior Details

- The input field should clear after successfully adding a todo.
- Empty submissions (blank or whitespace-only) should be ignored.
- New todos are added to the end of the list.
- New todos start in the active (not completed) state.
- The item count updates immediately when todos are added, completed, or deleted.
- "Clear completed" button should only be visible when completed todos exist.

## Technical Constraints

- Use Vue 3 Composition API with `<script setup>` syntax
- Use TypeScript
- Use semantic HTML (header, main, footer, nav, form, ul/li, etc.)
- All interactive/testable elements must have `data-testid` attributes
  as specified in the contract
- No external state management library — use `ref`/`reactive` from Vue
- No routing required — single page
