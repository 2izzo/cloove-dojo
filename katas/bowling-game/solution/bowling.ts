export class Game {
  private rolls: number[] = [];

  roll(pins: number): void {
    this.rolls.push(pins);
  }

  score(): number {
    let total = 0;
    let rollIndex = 0;

    for (let frame = 0; frame < 10; frame++) {
      if (this.isStrike(rollIndex)) {
        total += 10 + this.strikeBonus(rollIndex);
        rollIndex += 1;
      } else if (this.isSpare(rollIndex)) {
        total += 10 + this.spareBonus(rollIndex);
        rollIndex += 2;
      } else {
        total += this.frameScore(rollIndex);
        rollIndex += 2;
      }
    }

    return total;
  }

  private isStrike(rollIndex: number): boolean {
    return this.rolls[rollIndex] === 10;
  }

  private isSpare(rollIndex: number): boolean {
    return this.rolls[rollIndex] + this.rolls[rollIndex + 1] === 10;
  }

  private strikeBonus(rollIndex: number): number {
    return this.rolls[rollIndex + 1] + this.rolls[rollIndex + 2];
  }

  private spareBonus(rollIndex: number): number {
    return this.rolls[rollIndex + 2];
  }

  private frameScore(rollIndex: number): number {
    return this.rolls[rollIndex] + this.rolls[rollIndex + 1];
  }
}
