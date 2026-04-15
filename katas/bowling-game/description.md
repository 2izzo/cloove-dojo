# Bowling Game

Create a program that calculates the score of a ten-pin bowling game.

## Rules

- A game consists of 10 frames
- In each frame, the player has two rolls to knock down all 10 pins
- **Spare:** If the player knocks down all 10 pins in two rolls, the bonus for that frame is the number of pins knocked down on the next roll
- **Strike:** If the player knocks down all 10 pins on the first roll, the frame is over and the bonus is the value of the next two rolls
- **10th frame:** The player who rolls a spare or strike in the 10th frame gets to roll extra balls to complete the frame, but no more than 3 rolls total

## Interface

Implement a `Game` class with:
- `roll(pins: number): void` — called each time the player rolls a ball
- `score(): number` — called at the end of the game, returns the total score

## Examples

| Scenario | Rolls | Score |
|----------|-------|-------|
| Gutter game | 20 rolls of 0 | 0 |
| All ones | 20 rolls of 1 | 20 |
| One spare | 5, 5, 3, then 17 rolls of 0 | 16 |
| One strike | 10, 3, 4, then 16 rolls of 0 | 24 |
| Perfect game | 12 rolls of 10 | 300 |
