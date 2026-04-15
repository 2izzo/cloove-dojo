import { describe, it, expect } from 'vitest';
import { Item, GildedRose } from '../gilded-rose';

describe('Gilded Rose', () => {
  function updateItem(name: string, sellIn: number, quality: number): Item {
    const rose = new GildedRose([new Item(name, sellIn, quality)]);
    rose.updateQuality();
    return rose.items[0];
  }

  describe('Normal items', () => {
    it('decreases quality by 1 before sell date', () => {
      const item = updateItem('Normal Item', 10, 20);
      expect(item.quality).toBe(19);
      expect(item.sellIn).toBe(9);
    });
    it('decreases quality by 2 after sell date', () => {
      const item = updateItem('Normal Item', 0, 20);
      expect(item.quality).toBe(18);
    });
    it('quality never goes negative', () => {
      const item = updateItem('Normal Item', 5, 0);
      expect(item.quality).toBe(0);
    });
  });

  describe('Aged Brie', () => {
    it('increases in quality', () => {
      const item = updateItem('Aged Brie', 10, 20);
      expect(item.quality).toBe(21);
    });
    it('increases twice as fast after sell date', () => {
      const item = updateItem('Aged Brie', 0, 20);
      expect(item.quality).toBe(22);
    });
    it('quality never exceeds 50', () => {
      const item = updateItem('Aged Brie', 5, 50);
      expect(item.quality).toBe(50);
    });
  });

  describe('Sulfuras', () => {
    it('never changes quality', () => {
      const item = updateItem('Sulfuras, Hand of Ragnaros', 5, 80);
      expect(item.quality).toBe(80);
    });
    it('never changes sellIn', () => {
      const item = updateItem('Sulfuras, Hand of Ragnaros', 5, 80);
      expect(item.sellIn).toBe(5);
    });
  });

  describe('Backstage passes', () => {
    const name = 'Backstage passes to a TAFKAL80ETC concert';
    it('increases by 1 when more than 10 days', () => {
      const item = updateItem(name, 15, 20);
      expect(item.quality).toBe(21);
    });
    it('increases by 2 when 10 days or less', () => {
      const item = updateItem(name, 10, 20);
      expect(item.quality).toBe(22);
    });
    it('increases by 3 when 5 days or less', () => {
      const item = updateItem(name, 5, 20);
      expect(item.quality).toBe(23);
    });
    it('drops to 0 after concert', () => {
      const item = updateItem(name, 0, 20);
      expect(item.quality).toBe(0);
    });
    it('quality never exceeds 50', () => {
      const item = updateItem(name, 5, 49);
      expect(item.quality).toBe(50);
    });
  });

  describe('Conjured items', () => {
    it('decreases quality by 2 before sell date', () => {
      const item = updateItem('Conjured Mana Cake', 10, 20);
      expect(item.quality).toBe(18);
    });
    it('decreases quality by 4 after sell date', () => {
      const item = updateItem('Conjured Mana Cake', 0, 20);
      expect(item.quality).toBe(16);
    });
    it('quality never goes negative', () => {
      const item = updateItem('Conjured Mana Cake', 5, 1);
      expect(item.quality).toBe(0);
    });
  });
});
