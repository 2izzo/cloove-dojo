---
type: seed
cloove: dev
topic: jsdom-form-submit
tags: [vue, vitest, vue-test-utils, jsdom, form, submit]
applies_to: fullstack-katas
---

# Seed — In JSDOM, button.click() does NOT auto-submit the form

When you write a unit test for a form submission in `@vue/test-utils`,
clicking a `<button type="submit">` does NOT fire the form's submit
event. JSDOM doesn't replicate that browser behavior. To test a form
submit handler, trigger `submit` on the form directly.

## Wrong (silently passes the click but no submit fires)

```ts
await wrapper.find('input').setValue('buy milk');
await wrapper.find('button').trigger('click');
expect(wrapper.emitted('add')).toBeTruthy();   // FAILS — emit never fired
```

## Right

```ts
await wrapper.find('input').setValue('buy milk');
await wrapper.find('form').trigger('submit');   // form, not button; submit, not click
expect(wrapper.emitted('add')).toBeTruthy();
```

If you must click the button (e.g., the contract specifies button
interaction), trigger `submit` on the form right after the click:

```ts
await wrapper.find('button').trigger('click');
await wrapper.find('form').trigger('submit');   // explicitly fire submit
```

## Why this seed exists

Even when the impl correctly uses `<form @submit.prevent="onSubmit">` +
`emit("add", payload)`, the unit test fails because `button.click()`
does not bubble to the form's submit handler under JSDOM. This is a
test-side bug, not an impl bug — and seeds it without knowing the
gotcha will look like the impl is broken when it isn't.
