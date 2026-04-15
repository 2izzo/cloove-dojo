# Architecture: Gilded Rose

## File Structure

```
gilded-rose.ts           — GildedRose class + Item class (clean implementation)
gilded-rose.test.ts      — Tests
gilded-rose-legacy.ts    — Original messy code (Ring 2 only — read but don't ship)
```

## Design Hints

- Use the Strategy pattern: each item type gets its own update strategy
- The factory function maps item name to strategy
- Each strategy implements updateQuality() and updateSellIn()
- Conjured items are a new strategy (not in legacy code)
- Keep the Item class simple — no logic in it, just data
