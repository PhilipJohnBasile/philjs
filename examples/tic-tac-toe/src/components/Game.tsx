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
