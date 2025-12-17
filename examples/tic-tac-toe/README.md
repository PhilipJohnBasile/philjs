# PhilJS Tic-Tac-Toe Example

A complete tic-tac-toe game demonstrating PhilJS core concepts including state management with signals, computed values with memos, and time-travel functionality.

## Features

- **Interactive Game Board**: 3x3 grid with X and O players
- **Turn Indicators**: Shows which player's turn it is
- **Win Detection**: Automatically detects wins across rows, columns, and diagonals
- **Visual Feedback**: Highlights winning squares
- **Game History**: Complete move-by-move history with coordinates
- **Time Travel**: Jump back to any previous move
- **Draw Detection**: Detects when the game ends in a draw
- **Hover Effects**: Interactive visual feedback on squares
- **Reset Functionality**: Start a new game at any time

## What You'll Learn

This example demonstrates:

- **State Management with Signals**: Managing complex game state
- **Computed Values with Memos**: Deriving winner and status from game state
- **Event Handling**: Responding to user clicks
- **Conditional Rendering**: Showing different UI based on game state
- **Immutable Updates**: Proper state updates for time travel
- **Component Composition**: Building complex UIs from simple components

## Getting Started

### Prerequisites

Make sure you're in the monorepo root and have dependencies installed:

```bash
pnpm install
```

### Running the Example

From the monorepo root:

```bash
cd examples/tic-tac-toe
pnpm dev
```

Then open http://localhost:5173 in your browser.

### Building for Production

```bash
pnpm build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
pnpm preview
```

## Project Structure

```
tic-tac-toe/
├── src/
│   ├── components/
│   │   ├── Square.tsx      # Individual square component
│   │   ├── Board.tsx       # 3x3 game board
│   │   └── Game.tsx        # Main game logic and state
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── package.json
```

## Code Walkthrough

### Square Component

The Square component represents a single cell in the game board:

- Displays X, O, or nothing
- Handles click events
- Shows hover effects
- Highlights if part of winning combination

### Board Component

The Board component renders the 3x3 grid:

- Loops through rows and columns
- Passes click handlers to squares
- Manages square highlighting

### Game Component

The Game component contains the main logic:

- **State Management**: Uses signals for history and current move
- **Winner Detection**: Checks all winning combinations
- **Time Travel**: Maintains complete game history
- **Move Tracking**: Records coordinates of each move

## Key PhilJS Concepts

### Signals for State

```typescript
const history = signal<GameState[]>([...]);
const currentMove = signal(0);
```

Signals hold mutable state and notify dependents when updated.

### Memos for Derived State

```typescript
const current = memo(() => history()[currentMove()]);
const winner = memo(() => {
  // Calculate winner from current squares
});
```

Memos automatically recalculate when their dependencies change.

### Immutable Updates

```typescript
const newSquares = [...current().squares];
newSquares[index] = current().xIsNext ? 'X' : 'O';
```

Creating new arrays instead of mutating enables proper time travel.

## Tutorial

For a detailed step-by-step tutorial on building this example, see:
[Tutorial: Build Tic-Tac-Toe](../../docs/getting-started/tutorial-tic-tac-toe.md)

## Challenges

Try extending the game:

1. **Sort Moves**: Add buttons to sort history ascending/descending
2. **Highlight Current Square**: Show which square was just played
3. **Larger Board**: Make it work with 4x4 or 5x5
4. **AI Opponent**: Implement a computer player
5. **Network Play**: Allow two players on different devices
6. **Sound Effects**: Add audio feedback for moves and wins

## License

Part of the PhilJS project.
