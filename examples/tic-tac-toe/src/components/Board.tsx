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
