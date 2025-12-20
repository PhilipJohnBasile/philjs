/**
 * Counter Island Story
 *
 * Example of an interactive island component story
 */

import type { Meta, StoryObj } from '../src/index.js';
import { signal } from 'philjs-core';
import { withSignals, withLayout } from '../src/decorators/index.js';
import { within, userEvent, expect } from '@storybook/test';

// Example Counter Island component
interface CounterProps {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

function Counter(props: CounterProps) {
  const { initialValue = 0, min = -Infinity, max = Infinity, step = 1 } = props;

  const count$ = signal(initialValue);

  const increment = () => {
    const newValue = count$() + step;
    if (newValue <= max) {
      count$.set(newValue);
    }
  };

  const decrement = () => {
    const newValue = count$() - step;
    if (newValue >= min) {
      count$.set(newValue);
    }
  };

  const reset = () => {
    count$.set(initialValue);
  };

  const buttonStyle = {
    padding: '8px 16px',
    fontSize: '16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '24px',
        border: '2px solid #1976d2',
        borderRadius: '8px',
        maxWidth: '300px',
        margin: '0 auto',
      }}
    >
      <h2 style={{ margin: 0 }}>Counter Island</h2>

      <div
        style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#1976d2',
          minWidth: '100px',
          textAlign: 'center',
        }}
      >
        {count$()}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={decrement}
          disabled={count$() <= min}
          style={{
            ...buttonStyle,
            backgroundColor: count$() <= min ? '#ccc' : '#f44336',
            color: 'white',
            opacity: count$() <= min ? 0.5 : 1,
          }}
          aria-label="Decrement"
        >
          -
        </button>

        <button
          onClick={reset}
          style={{
            ...buttonStyle,
            backgroundColor: '#757575',
            color: 'white',
          }}
          aria-label="Reset"
        >
          Reset
        </button>

        <button
          onClick={increment}
          disabled={count$() >= max}
          style={{
            ...buttonStyle,
            backgroundColor: count$() >= max ? '#ccc' : '#4caf50',
            color: 'white',
            opacity: count$() >= max ? 0.5 : 1,
          }}
          aria-label="Increment"
        >
          +
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#666' }}>
        Range: {min} to {max} | Step: {step}
      </div>
    </div>
  );
}

const meta: Meta<typeof Counter> = {
  title: 'Islands/Counter',
  component: Counter,
  tags: ['autodocs'],
  decorators: [withSignals, withLayout],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    initialValue: {
      control: 'number',
      description: 'Initial counter value',
    },
    min: {
      control: 'number',
      description: 'Minimum value',
    },
    max: {
      control: 'number',
      description: 'Maximum value',
    },
    step: {
      control: 'number',
      description: 'Increment/decrement step',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Counter>;

export const Default: Story = {
  args: {
    initialValue: 0,
    step: 1,
  },
};

export const StartingAtTen: Story = {
  args: {
    initialValue: 10,
    step: 1,
  },
};

export const WithMinMax: Story = {
  args: {
    initialValue: 5,
    min: 0,
    max: 10,
    step: 1,
  },
};

export const LargeStep: Story = {
  args: {
    initialValue: 0,
    step: 5,
  },
};

export const NegativeRange: Story = {
  args: {
    initialValue: -5,
    min: -10,
    max: 0,
    step: 1,
  },
};

export const InteractiveTest: Story = {
  args: {
    initialValue: 0,
    min: 0,
    max: 10,
    step: 1,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Get buttons
    const incrementButton = canvas.getByLabelText('Increment');
    const decrementButton = canvas.getByLabelText('Decrement');
    const resetButton = canvas.getByLabelText('Reset');

    // Initial value should be 0
    await expect(canvas.getByText('0')).toBeInTheDocument();

    // Increment to 5
    await userEvent.click(incrementButton);
    await userEvent.click(incrementButton);
    await userEvent.click(incrementButton);
    await userEvent.click(incrementButton);
    await userEvent.click(incrementButton);
    await expect(canvas.getByText('5')).toBeInTheDocument();

    // Decrement to 3
    await userEvent.click(decrementButton);
    await userEvent.click(decrementButton);
    await expect(canvas.getByText('3')).toBeInTheDocument();

    // Reset to 0
    await userEvent.click(resetButton);
    await expect(canvas.getByText('0')).toBeInTheDocument();
  },
};

export const BoundaryTest: Story = {
  args: {
    initialValue: 9,
    min: 0,
    max: 10,
    step: 1,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const incrementButton = canvas.getByLabelText('Increment');

    // Should be at 9
    await expect(canvas.getByText('9')).toBeInTheDocument();

    // Increment to max (10)
    await userEvent.click(incrementButton);
    await expect(canvas.getByText('10')).toBeInTheDocument();

    // Increment button should be disabled at max
    await expect(incrementButton).toBeDisabled();
  },
};
