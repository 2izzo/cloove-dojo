export class Item {
  name: string;
  sellIn: number;
  quality: number;
  constructor(name: string, sellIn: number, quality: number) {
    this.name = name;
    this.sellIn = sellIn;
    this.quality = quality;
  }
}

interface UpdateStrategy {
  updateQuality(item: Item): void;
  updateSellIn(item: Item): void;
}

class NormalStrategy implements UpdateStrategy {
  updateQuality(item: Item): void {
    const degradeRate = item.sellIn <= 0 ? 2 : 1;
    item.quality = Math.max(0, item.quality - degradeRate);
  }
  updateSellIn(item: Item): void { item.sellIn -= 1; }
}

class AgedBrieStrategy implements UpdateStrategy {
  updateQuality(item: Item): void {
    const increaseRate = item.sellIn <= 0 ? 2 : 1;
    item.quality = Math.min(50, item.quality + increaseRate);
  }
  updateSellIn(item: Item): void { item.sellIn -= 1; }
}

class SulfurasStrategy implements UpdateStrategy {
  updateQuality(_item: Item): void {}
  updateSellIn(_item: Item): void {}
}

class BackstagePassStrategy implements UpdateStrategy {
  updateQuality(item: Item): void {
    if (item.sellIn <= 0) { item.quality = 0; return; }
    let increase = 1;
    if (item.sellIn <= 5) increase = 3;
    else if (item.sellIn <= 10) increase = 2;
    item.quality = Math.min(50, item.quality + increase);
  }
  updateSellIn(item: Item): void { item.sellIn -= 1; }
}

class ConjuredStrategy implements UpdateStrategy {
  updateQuality(item: Item): void {
    const degradeRate = item.sellIn <= 0 ? 4 : 2;
    item.quality = Math.max(0, item.quality - degradeRate);
  }
  updateSellIn(item: Item): void { item.sellIn -= 1; }
}

function getStrategy(item: Item): UpdateStrategy {
  if (item.name === 'Sulfuras, Hand of Ragnaros') return new SulfurasStrategy();
  if (item.name === 'Aged Brie') return new AgedBrieStrategy();
  if (item.name === 'Backstage passes to a TAFKAL80ETC concert') return new BackstagePassStrategy();
  if (item.name.startsWith('Conjured')) return new ConjuredStrategy();
  return new NormalStrategy();
}

export class GildedRose {
  items: Item[];
  constructor(items: Item[] = []) { this.items = items; }
  updateQuality(): Item[] {
    for (const item of this.items) {
      const strategy = getStrategy(item);
      strategy.updateSellIn(item);
      strategy.updateQuality(item);
    }
    return this.items;
  }
}
