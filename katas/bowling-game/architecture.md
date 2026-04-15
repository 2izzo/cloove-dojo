# Architecture: Bowling Game

## File Structure

```
bowling.ts       — Game class implementation
bowling.test.ts  — Tests (provided in Ring 1, you write in Ring 2+)
```

## Design Hints

- Store rolls in an array, calculate score by walking frames
- Track a `rollIndex` that advances through the rolls array
- A frame is a strike if the first roll is 10
- A frame is a spare if the two rolls sum to 10
- The score for a frame includes its bonus rolls
- Don't try to calculate score roll-by-roll — calculate frame-by-frame at the end
