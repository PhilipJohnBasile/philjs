/**
 * Button Component Story
 *
 * Example of a basic component story
 */

import type { Meta, StoryObj } from '../src/index.js';
import { signal } from 'philjs-core';

// Example Button component
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  children: any;
}

function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'medium',
    disabled = false,
    onClick,
    children,
  } = props;

  const baseStyles = {
    padding: size === 'small' ? '4px 8px' : size === 'large' ? '12px 24px' : '8px 16px',
    fontSize: size === 'small' ? '12px' : size === 'large' ? '18px' : '14px',
    border: 'none',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    fontWeight: 'bold',
    transition: 'all 0.2s',
  };

  const variantStyles = {
    primary: { backgroundColor: '#1976d2', color: 'white' },
    secondary: { backgroundColor: '#757575', color: 'white' },
    danger: { backgroundColor: '#d32f2f', color: 'white' },
  };

  return (
    <button
      style={{ ...baseStyles, ...variantStyles[variant] }}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
      description: 'Button variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    onClick: {
      action: 'clicked',
      description: 'Click handler',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
  },
};

export const Small: Story = {
  args: {
    size: 'small',
    children: 'Small Button',
  },
};

export const Large: Story = {
  args: {
    size: 'large',
    children: 'Large Button',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
  ),
};
