import { describe, it, expect, beforeEach } from 'vitest';
import { Game } from '../bowling';

describe('Bowling Game', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  function rollMany(pins: number, times: number) {
    for (let i = 0; i < times; i++) {
      game.roll(pins);
    }
  }

  function rollSpare() {
    game.roll(5);
    game.roll(5);
  }

  function rollStrike() {
    game.roll(10);
  }

  it('scores a gutter game as 0', () => {
    rollMany(0, 20);
    expect(game.score()).toBe(0);
  });

  it('scores all ones as 20', () => {
    rollMany(1, 20);
    expect(game.score()).toBe(20);
  });

  it('scores a spare correctly', () => {
    rollSpare();
    game.roll(3);
    rollMany(0, 17);
    expect(game.score()).toBe(16);
  });

  it('scores a strike correctly', () => {
    rollStrike();
    game.roll(3);
    game.roll(4);
    rollMany(0, 16);
    expect(game.score()).toBe(24);
  });

  it('scores a perfect game as 300', () => {
    rollMany(10, 12);
    expect(game.score()).toBe(300);
  });

  it('scores all spares correctly', () => {
    for (let i = 0; i < 10; i++) {
      rollSpare();
    }
    game.roll(5);
    expect(game.score()).toBe(150);
  });

  it('handles mixed game', () => {
    rollStrike();
    game.roll(7);
    game.roll(2);
    game.roll(3);
    game.roll(7);
    game.roll(4);
    game.roll(2);
    rollMany(0, 12);
    expect(game.score()).toBe(48);
  });
});
