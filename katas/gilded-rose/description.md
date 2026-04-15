# Gilded Rose

The Gilded Rose is a small inn that buys and sells only the finest goods.
Unfortunately, the goods are constantly degrading in quality as they approach
their sell-by date.

## System Behavior

All items have a `sellIn` value (days remaining to sell) and a `quality` value.
At the end of each day, both values decrease. But there are special rules:

- **Normal items:** Quality degrades by 1 per day. After sell-by date, quality degrades twice as fast.
- **Aged Brie:** Quality increases the older it gets. After sell-by, increases twice as fast.
- **Sulfuras:** Legendary item. Never decreases in quality. Never has to be sold. Quality is always 80.
- **Backstage passes:** Quality increases as sell-by approaches:
  - More than 10 days: +1
  - 6-10 days: +2
  - 1-5 days: +3
  - After concert (sellIn < 0): quality drops to 0
- **Conjured items:** Degrade in quality twice as fast as normal items.

## Constraints

- Quality is never negative
- Quality is never more than 50 (except Sulfuras, which is always 80)
- Sulfuras never changes and never needs to be sold

## Interface

```typescript
interface Item {
  name: string;
  sellIn: number;
  quality: number;
}

class GildedRose {
  items: Item[];
  constructor(items: Item[]);
  updateQuality(): Item[];
}
```

## The Challenge

The existing code works but is a mess of nested conditionals. Your job:
1. Write characterization tests that capture ALL current behavior
2. Refactor the code to be clean and extensible
3. Add support for "Conjured" items (not in the legacy code)
