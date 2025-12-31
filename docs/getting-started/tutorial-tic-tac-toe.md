# Tutorial: Build Tic-Tac-Toe

Build a complete tic-tac-toe game while learning core PhilJS concepts. This tutorial covers state management, event handling, conditional rendering, and more.

## What You'll Learn

- Managing game state with signals
- Handling click events
- Computing derived state with memos
- Implementing game logic
- Building reusable components
- Time travel functionality (undo moves)

## What We're Building

By the end of this tutorial, you'll have a fully functional tic-tac-toe game with:
- A 3x3 game board
- Turn indicators (X or O)
- Win detection
- Game history with time travel
- Move highlighting

## Setup

Create a new PhilJS project:

```bash
pnpm create philjs tic-tac-toe
cd tic-tac-toe
pnpm install
pnpm dev
```

## Step 1: Create the Square Component

Let's start with the basic building block - a single square.

Create `src/components/Square.tsx`:

```typescript
interface SquareProps {
  value: string | null;
  onClick: () => void;
  isWinning?: boolean;
}

export function Square({ value, onClick, isWinning }: SquareProps) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.square,
        ...(isWinning ? styles.winning : {}),
      }}
    >
      {value}
    </button>
  );
}

const styles = {
  square: {
    width: '80px',
    height: '80px',
    background: 'white',
    border: '2px solid #999',
    fontSize: '2rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  winning: {
    background: '#90EE90',
  },
};
```

**What's happening:**
- `Square` accepts the square's value (X, O, or null)
- `onClick` callback handles clicks
- `isWinning` highlights winning squares

## Step 2: Create the Board Component

Now let's create the game board using our Square component.

Create `src/components/Board.tsx`:

```typescript
import { Square } from './Square';

type SquareValue = 'X' | 'O' | null;

interface BoardProps {
  squares: SquareValue[];
  onClick: (index: number) => void;
  winningSquares: number[] | null;
}

export function Board({ squares, onClick, winningSquares }: BoardProps) {
  const renderSquare = (index: number) => {
    return (
      <Square
        value={squares[index]}
        onClick={() => onClick(index)}
        isWinning={winningSquares?.includes(index) || false}
      />
    );
  };

  return (
    <div>
      <div style={styles.row}>
        {renderSquare(0)}
        {renderSquare(1)}
        {renderSquare(2)}
      </div>
      <div style={styles.row}>
        {renderSquare(3)}
        {renderSquare(4)}
        {renderSquare(5)}
      </div>
      <div style={styles.row}>
        {renderSquare(6)}
        {renderSquare(7)}
        {renderSquare(8)}
      </div>
    </div>
  );
}

const styles = {
  row: {
    display: 'flex',
  },
};
```

**Key points:**
- Board receives the game state as props
- Each square gets its value from the `squares` array
- Clicks are handled by a callback passed down
- Winning squares are highlighted

## Step 3: Add Game Logic

Create the main Game component with full game logic.

Create `src/components/Game.tsx`:

```typescript
import { signal, memo } from '@philjs/core';
import { Board } from './Board';

type SquareValue = 'X' | 'O' | null;

interface GameState {
  squares: SquareValue[];
  xIsNext: boolean;
}

export function Game() {
  // Store all game history
  const history = signal<GameState[]>([
    {
      squares: Array(9).fill(null),
      xIsNext: true,
    },
  ]);

  // Current move index
  const currentMove = signal(0);

  // Get current game state
  const current = memo(() => history()[currentMove()]);

  // Calculate winner
  const winner = memo(() => {
    const squares = current().squares;
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6],             // Diagonals
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { player: squares[a], line: [a, b, c] };
      }
    }
    return null;
  });

  // Check if board is full (draw)
  const isDraw = memo(() => {
    return !winner() && current().squares.every(square => square !== null);
  });

  // Handle square click
  const handleClick = (index: number) => {
    // Don't allow moves if game is over or square is filled
    if (winner() || current().squares[index] || isDraw()) {
      return;
    }

    // Create new game state
    const newSquares = [...current().squares];
    newSquares[index] = current().xIsNext ? 'X' : 'O';

    // Add to history (remove future moves if we went back in time)
    const newHistory = [
      ...history().slice(0, currentMove() + 1),
      {
        squares: newSquares,
        xIsNext: !current().xIsNext,
      },
    ];

    history.set(newHistory);
    currentMove.set(newHistory.length - 1);
  };

  // Jump to a specific move
  const jumpTo = (move: number) => {
    currentMove.set(move);
  };

  // Reset game
  const resetGame = () => {
    history.set([
      {
        squares: Array(9).fill(null),
        xIsNext: true,
      },
    ]);
    currentMove.set(0);
  };

  // Game status message
  const status = memo(() => {
    if (winner()) {
      return `Winner: ${winner()!.player}`;
    }
    if (isDraw()) {
      return "Draw!";
    }
    return `Next player: ${current().xIsNext ? 'X' : 'O'}`;
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Tic-Tac-Toe</h1>

      <div style={styles.game}>
        <div style={styles.boardContainer}>
          <Board
            squares={current().squares}
            onClick={handleClick}
            winningSquares={winner()?.line || null}
          />

          <div
            style={{
              ...styles.status,
              ...(winner() ? styles.statusWinner : {}),
            }}
          >
            {status()}
          </div>

          <button onClick={resetGame} style={styles.resetButton}>
            New Game
          </button>
        </div>

        <div style={styles.history}>
          <h3>History</h3>
          <ol>
            {history().map((_, move) => {
              const description = move === 0
                ? 'Go to game start'
                : `Go to move #${move}`;

              const isCurrent = move === currentMove();

              return (
                <li key={move}>
                  <button
                    onClick={() => jumpTo(move)}
                    style={{
                      ...styles.historyButton,
                      ...(isCurrent ? styles.historyButtonCurrent : {}),
                    }}
                  >
                    {description}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '2rem',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  title: {
    color: 'white',
    fontSize: '3rem',
    marginBottom: '2rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
  },
  game: {
    display: 'flex',
    gap: '3rem',
    background: 'white',
    padding: '2rem',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  },
  boardContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  status: {
    marginTop: '1.5rem',
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    color: '#333',
  },
  statusWinner: {
    color: '#4CAF50',
  },
  resetButton: {
    marginTop: '1rem',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    transition: 'all 0.2s',
  },
  history: {
    minWidth: '200px',
  },
  historyButton: {
    padding: '0.5rem 1rem',
    marginBottom: '0.5rem',
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  historyButtonCurrent: {
    background: '#667eea',
    color: 'white',
    fontWeight: 'bold' as const,
  },
};
```

## Step 4: Wire Everything Up

Update `src/routes/index.tsx`:

```typescript
import { Game } from '../components/Game';

export default function Home() {
  return <Game />;
}
```

Run `pnpm dev` and play your game!

## Understanding the Code

### State Management with Signals

```typescript
const history = signal<GameState[]>([...]);
const currentMove = signal(0);
```

We use signals to store:
- `history`: Array of all game states (for time travel)
- `currentMove`: Index of the current move we're viewing

### Computed Values with Memos

```typescript
const current = memo(() => history()[currentMove()]);
const winner = memo(() => {
  // Calculate winner from current squares
});
```

Memos automatically recalculate when dependencies change:
- `current` updates when `history` or `currentMove` changes
- `winner` updates when `current` changes

### Immutable Updates

```typescript
const newSquares = [...current().squares];
newSquares[index] = current().xIsNext ? 'X' : 'O';
```

We create a new array instead of modifying the existing one. This is crucial for:
- Time travel to work correctly
- React properly to state changes
- Avoiding bugs

### Time Travel Implementation

```typescript
const jumpTo = (move: number) => {
  currentMove.set(move);
};
```

Time travel is simple! Just set `currentMove` to a different index. The UI automatically updates because all computed values depend on `currentMove`.

## Step 5: Add Enhancements

### Show Move Coordinates

Let's show which square was clicked in each move:

```typescript
// In Game component
interface HistoryEntry {
  squares: SquareValue[];
  xIsNext: boolean;
  lastMove?: number; // Add this
}

// Update handleClick
const newHistory = [
  ...history().slice(0, currentMove() + 1),
  {
    squares: newSquares,
    xIsNext: !current().xIsNext,
    lastMove: index, // Store the move
  },
];

// Update history rendering
const getMoveDescription = (move: number) => {
  if (move === 0) return 'Game start';

  const entry = history()[move];
  const row = Math.floor(entry.lastMove! / 3) + 1;
  const col = (entry.lastMove! % 3) + 1;

  return `Move #${move} (Row ${row}, Col ${col})`;
};

// In render:
<button onClick={() => jumpTo(move)}>
  {getMoveDescription(move)}
</button>
```

### Add Animations

Add smooth transitions when squares are clicked:

```typescript
// Update Square styles
const styles = {
  square: {
    // ... existing styles ...
    transform: 'scale(1)',
    transition: 'all 0.2s',
  },
  // Add hover effect
  squareHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  },
};

// Update Square component
export function Square({ value, onClick, isWinning }: SquareProps) {
  const isHovered = signal(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !value && isHovered.set(true)}
      onMouseLeave={() => isHovered.set(false)}
      style={{
        ...styles.square,
        ...(isWinning ? styles.winning : {}),
        ...(isHovered() ? styles.squareHover : {}),
      }}
    >
      {value}
    </button>
  );
}
```

### Add Sound Effects

```typescript
const playSound = (type: 'move' | 'win') => {
  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.play();
};

// In handleClick:
playSound('move');

// When winner is detected:
if (winner()) {
  playSound('win');
}
```

## Complete Source Code

Here's the complete, production-ready code:

**src/components/Square.tsx:**
```typescript
import { signal } from '@philjs/core';

interface SquareProps {
  value: string | null;
  onClick: () => void;
  isWinning?: boolean;
}

export function Square({ value, onClick, isWinning }: SquareProps) {
  const isHovered = signal(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => !value && isHovered.set(true)}
      onMouseLeave={() => isHovered.set(false)}
      style={{
        ...styles.square,
        ...(isWinning ? styles.winning : {}),
        ...(isHovered() && !value ? styles.squareHover : {}),
      }}
      disabled={!!value}
    >
      {value}
    </button>
  );
}

const styles = {
  square: {
    width: '80px',
    height: '80px',
    background: 'white',
    border: '2px solid #999',
    fontSize: '2rem',
    fontWeight: 'bold' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    transform: 'scale(1)',
  },
  winning: {
    background: '#90EE90',
    animation: 'pulse 0.5s ease-in-out infinite',
  },
  squareHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    background: '#f0f0f0',
  },
};
```

**src/components/Board.tsx:**
```typescript
import { Square } from './Square';

type SquareValue = 'X' | 'O' | null;

interface BoardProps {
  squares: SquareValue[];
  onClick: (index: number) => void;
  winningSquares: number[] | null;
}

export function Board({ squares, onClick, winningSquares }: BoardProps) {
  return (
    <div style={styles.board}>
      {Array(3).fill(null).map((_, row) => (
        <div key={row} style={styles.row}>
          {Array(3).fill(null).map((_, col) => {
            const index = row * 3 + col;
            return (
              <Square
                key={index}
                value={squares[index]}
                onClick={() => onClick(index)}
                isWinning={winningSquares?.includes(index) || false}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

const styles = {
  board: {
    display: 'inline-block',
  },
  row: {
    display: 'flex',
  },
};
```

**src/components/Game.tsx:**
```typescript
import { signal, memo } from '@philjs/core';
import { Board } from './Board';

type SquareValue = 'X' | 'O' | null;

interface GameState {
  squares: SquareValue[];
  xIsNext: boolean;
  lastMove?: number;
}

export function Game() {
  const history = signal<GameState[]>([
    { squares: Array(9).fill(null), xIsNext: true },
  ]);
  const currentMove = signal(0);

  const current = memo(() => history()[currentMove()]);

  const winner = memo(() => {
    const squares = current().squares;
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { player: squares[a], line: [a, b, c] };
      }
    }
    return null;
  });

  const isDraw = memo(() => {
    return !winner() && current().squares.every(square => square !== null);
  });

  const handleClick = (index: number) => {
    if (winner() || current().squares[index] || isDraw()) {
      return;
    }

    const newSquares = [...current().squares];
    newSquares[index] = current().xIsNext ? 'X' : 'O';

    const newHistory = [
      ...history().slice(0, currentMove() + 1),
      {
        squares: newSquares,
        xIsNext: !current().xIsNext,
        lastMove: index,
      },
    ];

    history.set(newHistory);
    currentMove.set(newHistory.length - 1);
  };

  const jumpTo = (move: number) => currentMove.set(move);

  const resetGame = () => {
    history.set([{ squares: Array(9).fill(null), xIsNext: true }]);
    currentMove.set(0);
  };

  const status = memo(() => {
    if (winner()) return `Winner: ${winner()!.player}`;
    if (isDraw()) return "Draw!";
    return `Next player: ${current().xIsNext ? 'X' : 'O'}`;
  });

  const getMoveDescription = (move: number) => {
    if (move === 0) return 'Game start';
    const entry = history()[move];
    const row = Math.floor(entry.lastMove! / 3) + 1;
    const col = (entry.lastMove! % 3) + 1;
    return `Move #${move} (Row ${row}, Col ${col})`;
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Tic-Tac-Toe</h1>
      <div style={styles.game}>
        <div style={styles.boardContainer}>
          <Board
            squares={current().squares}
            onClick={handleClick}
            winningSquares={winner()?.line || null}
          />
          <div style={{
            ...styles.status,
            ...(winner() ? styles.statusWinner : {}),
          }}>
            {status()}
          </div>
          <button onClick={resetGame} style={styles.resetButton}>
            New Game
          </button>
        </div>
        <div style={styles.history}>
          <h3>History</h3>
          <ol>
            {history().map((_, move) => {
              const isCurrent = move === currentMove();
              return (
                <li key={move}>
                  <button
                    onClick={() => jumpTo(move)}
                    style={{
                      ...styles.historyButton,
                      ...(isCurrent ? styles.historyButtonCurrent : {}),
                    }}
                  >
                    {getMoveDescription(move)}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '2rem',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  title: {
    color: 'white',
    fontSize: '3rem',
    marginBottom: '2rem',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
  },
  game: {
    display: 'flex',
    gap: '3rem',
    background: 'white',
    padding: '2rem',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  },
  boardContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  status: {
    marginTop: '1.5rem',
    fontSize: '1.5rem',
    fontWeight: 'bold' as const,
    color: '#333',
  },
  statusWinner: {
    color: '#4CAF50',
  },
  resetButton: {
    marginTop: '1rem',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold' as const,
    transition: 'all 0.2s',
  },
  history: {
    minWidth: '200px',
  },
  historyButton: {
    padding: '0.5rem 1rem',
    marginBottom: '0.5rem',
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'all 0.2s',
  },
  historyButtonCurrent: {
    background: '#667eea',
    color: 'white',
    fontWeight: 'bold' as const,
  },
};
```

## What You Learned

✅ **Component composition** - Building complex UIs from simple components
✅ **State management** - Using signals to manage game state
✅ **Derived state** - Computing values with memos
✅ **Event handling** - Responding to user clicks
✅ **Conditional rendering** - Showing different UI based on state
✅ **Immutability** - Creating new state instead of mutating
✅ **Time travel** - Implementing undo/redo functionality

## Challenges

Try extending the game:

1. **Sort moves**: Add buttons to sort history ascending/descending
2. **Highlight current square**: Show which square was just played
3. **Rewrite Board**: Use loops instead of hardcoded squares
4. **AI opponent**: Implement a computer player
5. **Larger board**: Make it work with 4x4 or 5x5
6. **Network play**: Allow two players on different devices

## Next Steps

- **[Build a Todo App](./tutorial-todo-app.md)** - Learn data persistence and filtering
- **[Learn about Effects](../learn/effects.md)** - Handle side effects like API calls
- **[Explore Routing](../routing/basics.md)** - Add multiple pages to your apps

---

**Next:** [Tutorial: Todo App →](./tutorial-todo-app.md)
