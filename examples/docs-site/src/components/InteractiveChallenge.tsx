import { signal } from '@philjs/core';

interface Choice {
  text: string;
  correct: boolean;
  explanation?: string;
}

interface InteractiveChallengeProps {
  question: string;
  choices: Choice[];
  hint?: string;
  successMessage?: string;
}

export function InteractiveChallenge({
  question,
  choices,
  hint,
  successMessage = '🎉 Correct! Great job!',
}: InteractiveChallengeProps) {
  const selectedIndex = signal<number | null>(null);
  const showExplanation = signal(false);
  const showHint = signal(false);

  const handleChoice = (index: number) => {
    selectedIndex.set(index);
    showExplanation.set(true);
  };

  const reset = () => {
    selectedIndex.set(null);
    showExplanation.set(false);
    showHint.set(false);
  };

  const isCorrect = () => {
    const idx = selectedIndex();
    return idx !== null && choices[idx]?.correct;
  };

  return (
    <div
      style={{
        background: 'var(--color-bg-alt)',
        border: '2px solid var(--color-border)',
        borderRadius: '12px',
        padding: '1.5rem',
        margin: '2rem 0',
      }}
    >
      {/* Question */}
      <div
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>🤔</span>
        <span>{question}</span>
      </div>

      {/* Hint button */}
      {hint && !showExplanation() && (
        <button
          onClick={() => showHint.set(!showHint())}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            color: 'var(--color-brand)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            marginBottom: '1rem',
            transition: 'all var(--transition-fast)',
          }}
        >
          {showHint() ? '👁️ Hide Hint' : '💡 Show Hint'}
        </button>
      )}

      {/* Hint */}
      {showHint() && hint && !showExplanation() && (
        <div
          style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid #8b5cf6',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            color: 'var(--color-text)',
          }}
        >
          <strong style={{ color: '#8b5cf6' }}>💡 Hint:</strong> {hint}
        </div>
      )}

      {/* Choices */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {choices.map((choice, index) => {
          const isSelected = selectedIndex() === index;
          const isCorrectChoice = choice.correct;
          const showStatus = showExplanation();

          let backgroundColor = 'var(--color-bg)';
          let borderColor = 'var(--color-border)';
          let textColor = 'var(--color-text)';

          if (showStatus) {
            if (isSelected && isCorrectChoice) {
              backgroundColor = 'rgba(16, 185, 129, 0.1)';
              borderColor = 'var(--color-success)';
            } else if (isSelected && !isCorrectChoice) {
              backgroundColor = 'rgba(239, 68, 68, 0.1)';
              borderColor = 'var(--color-error)';
            } else if (!isSelected && isCorrectChoice) {
              backgroundColor = 'rgba(16, 185, 129, 0.05)';
              borderColor = 'var(--color-success)';
            }
          }

          return (
            <button
              key={index}
              onClick={() => !showExplanation() && handleChoice(index)}
              disabled={showExplanation()}
              style={{
                padding: '1rem',
                background: backgroundColor,
                border: `2px solid ${borderColor}`,
                borderRadius: '8px',
                color: textColor,
                textAlign: 'left',
                cursor: showExplanation() ? 'default' : 'pointer',
                transition: 'all var(--transition-fast)',
                fontSize: '0.9375rem',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    background: isSelected && showStatus ? 'currentColor' : 'var(--color-border)',
                    color: isSelected && showStatus ? 'white' : 'var(--color-text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{choice.text}</span>
                {showStatus && isCorrectChoice && (
                  <span style={{ marginLeft: 'auto', fontSize: '1.25rem' }}>✓</span>
                )}
                {showStatus && isSelected && !isCorrectChoice && (
                  <span style={{ marginLeft: 'auto', fontSize: '1.25rem' }}>✗</span>
                )}
              </div>

              {/* Explanation */}
              {showStatus && isSelected && choice.explanation && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid currentColor',
                    fontSize: '0.875rem',
                    opacity: 0.9,
                  }}
                >
                  {choice.explanation}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Result message */}
      {showExplanation() && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: isCorrect()
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            border: `2px solid ${isCorrect() ? 'var(--color-success)' : 'var(--color-error)'}`,
            borderRadius: '8px',
            color: 'var(--color-text)',
            fontSize: '0.9375rem',
          }}
        >
          {isCorrect() ? successMessage : '❌ Not quite. Try reviewing the concept and try again!'}
        </div>
      )}

      {/* Try again button */}
      {showExplanation() && !isCorrect() && (
        <button
          onClick={reset}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 1.5rem',
            background: 'var(--color-brand)',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
