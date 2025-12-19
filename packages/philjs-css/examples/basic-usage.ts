/**
 * Basic Usage Examples for PhilJS CSS
 */

import { css, compose, cx, keyframes } from '../src';

// ===================================
// 1. Basic CSS Styles
// ===================================

const button = css({
  padding: '10px 20px',
  backgroundColor: '#3b82f6',
  color: 'white',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: 500,

  '&:hover': {
    backgroundColor: '#2563eb'
  },

  '&:active': {
    transform: 'scale(0.98)'
  },

  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
});

// ===================================
// 2. Composing Styles
// ===================================

const baseButton = css({
  padding: '10px 20px',
  borderRadius: '4px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 500
});

const primaryButton = css({
  backgroundColor: '#3b82f6',
  color: 'white',
  '&:hover': { backgroundColor: '#2563eb' }
});

const secondaryButton = css({
  backgroundColor: '#10b981',
  color: 'white',
  '&:hover': { backgroundColor: '#059669' }
});

const dangerButton = css({
  backgroundColor: '#ef4444',
  color: 'white',
  '&:hover': { backgroundColor: '#dc2626' }
});

// Compose styles together
const myPrimaryButton = compose(baseButton, primaryButton);
const mySecondaryButton = compose(baseButton, secondaryButton);

// ===================================
// 3. Conditional Classes
// ===================================

function ButtonComponent(props: {
  variant: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}) {
  const className = cx(
    baseButton.className,
    props.variant === 'primary' && primaryButton.className,
    props.variant === 'secondary' && secondaryButton.className,
    props.variant === 'danger' && dangerButton.className,
    props.disabled && 'button-disabled',
    props.loading && 'button-loading'
  );

  return className;
}

// ===================================
// 4. Animations
// ===================================

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'translateY(10px)' },
  to: { opacity: 1, transform: 'translateY(0)' }
});

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' }
});

const pulse = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.05)' },
  '100%': { transform: 'scale(1)' }
});

const animatedCard = css({
  animation: `${fadeIn} 300ms ease-out`,

  '&:hover': {
    animation: `${pulse} 1s ease-in-out infinite`
  }
});

const spinner = css({
  width: '20px',
  height: '20px',
  border: '2px solid #e5e7eb',
  borderTopColor: '#3b82f6',
  borderRadius: '50%',
  animation: `${spin} 1s linear infinite`
});

// ===================================
// 5. Complex Layouts
// ===================================

const container = css({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px'
});

const flexRow = css({
  display: 'flex',
  flexDirection: 'row',
  gap: '16px'
});

const flexCol = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
});

const grid = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '24px'
});

const card = css({
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',

  '&:hover': {
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)'
  }
});

// ===================================
// 6. Form Styles
// ===================================

const input = css({
  width: '100%',
  padding: '10px 12px',
  fontSize: '16px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  outline: 'none',

  '&:focus': {
    borderColor: '#3b82f6',
    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
  },

  '&:disabled': {
    backgroundColor: '#f3f4f6',
    cursor: 'not-allowed'
  },

  '&::placeholder': {
    color: '#9ca3af'
  }
});

const label = css({
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  marginBottom: '6px',
  color: '#374151'
});

const formGroup = css({
  marginBottom: '16px'
});

// ===================================
// 7. Responsive Design
// ===================================

const responsiveContainer = css({
  width: '100%',
  padding: '16px',

  '@media (min-width: 768px)': {
    width: '768px',
    margin: '0 auto',
    padding: '24px'
  },

  '@media (min-width: 1024px)': {
    width: '1024px',
    padding: '32px'
  }
});

const responsiveGrid = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '16px',

  '@media (min-width: 640px)': {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },

  '@media (min-width: 1024px)': {
    gridTemplateColumns: 'repeat(3, 1fr)'
  }
});

// ===================================
// 8. Typography
// ===================================

const heading1 = css({
  fontSize: '36px',
  fontWeight: 700,
  lineHeight: 1.2,
  marginBottom: '24px',
  color: '#111827'
});

const heading2 = css({
  fontSize: '30px',
  fontWeight: 600,
  lineHeight: 1.3,
  marginBottom: '20px',
  color: '#1f2937'
});

const body = css({
  fontSize: '16px',
  lineHeight: 1.6,
  color: '#374151'
});

const small = css({
  fontSize: '14px',
  color: '#6b7280'
});

// ===================================
// Export for use in components
// ===================================

export const styles = {
  button,
  baseButton,
  primaryButton,
  secondaryButton,
  dangerButton,
  animatedCard,
  spinner,
  container,
  flexRow,
  flexCol,
  grid,
  card,
  input,
  label,
  formGroup,
  responsiveContainer,
  responsiveGrid,
  heading1,
  heading2,
  body,
  small
};
