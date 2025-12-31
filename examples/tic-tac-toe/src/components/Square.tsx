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
  },
  squareHover: {
    transform: 'scale(1.05)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    background: '#f0f0f0',
  },
};
