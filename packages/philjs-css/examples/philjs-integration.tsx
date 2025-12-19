/**
 * PhilJS Integration Examples
 *
 * This file demonstrates how to use PhilJS CSS with PhilJS components
 */

import { css, createTheme, variants, createAtomicSystem } from '../src';

// ===================================
// 1. Setup Theme
// ===================================

const theme = createTheme({
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    text: '#111827',
    textLight: '#6b7280',
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px'
  },
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px'
  }
});

// ===================================
// 2. Button Component with Variants
// ===================================

const buttonStyles = variants({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    fontSize: theme.fontSize.base,
    fontWeight: 500,
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    userSelect: 'none',

    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${theme.colors.primary}20`
    },

    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  },

  variants: {
    variant: {
      solid: {},
      outline: {
        backgroundColor: 'transparent',
        border: '2px solid currentColor'
      },
      ghost: {
        backgroundColor: 'transparent',
        '&:hover': { backgroundColor: theme.colors.surface }
      }
    },

    color: {
      primary: {
        backgroundColor: theme.colors.primary,
        color: 'white',
        '&:hover': { backgroundColor: '#2563eb' }
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        color: 'white',
        '&:hover': { backgroundColor: '#059669' }
      },
      danger: {
        backgroundColor: theme.colors.danger,
        color: 'white',
        '&:hover': { backgroundColor: '#dc2626' }
      }
    },

    size: {
      sm: {
        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
        fontSize: theme.fontSize.sm
      },
      md: {
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        fontSize: theme.fontSize.base
      },
      lg: {
        padding: `${theme.spacing.md} ${theme.spacing.lg}`,
        fontSize: theme.fontSize.lg
      }
    }
  },

  defaultVariants: {
    variant: 'solid',
    color: 'primary',
    size: 'md'
  }
});

export const Button = ({
  variant = 'solid',
  color = 'primary',
  size = 'md',
  children,
  ...props
}) => (
  <button class={buttonStyles({ variant, color, size })} {...props}>
    {children}
  </button>
);

// ===================================
// 3. Card Component
// ===================================

const cardStyles = css({
  backgroundColor: theme.colors.background,
  borderRadius: '8px',
  padding: theme.spacing.lg,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  transition: 'all 200ms ease',

  '&:hover': {
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)'
  }
});

const cardHeaderStyles = css({
  fontSize: theme.fontSize.lg,
  fontWeight: 600,
  color: theme.colors.text,
  marginBottom: theme.spacing.md
});

const cardBodyStyles = css({
  color: theme.colors.textLight,
  lineHeight: 1.6
});

export const Card = ({ title, children, ...props }) => (
  <div class={cardStyles.className} {...props}>
    {title && <div class={cardHeaderStyles.className}>{title}</div>}
    <div class={cardBodyStyles.className}>{children}</div>
  </div>
);

// ===================================
// 4. Input Component
// ===================================

const inputStyles = css({
  width: '100%',
  padding: theme.spacing.sm,
  fontSize: theme.fontSize.base,
  color: theme.colors.text,
  backgroundColor: theme.colors.background,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '4px',
  outline: 'none',
  transition: 'all 150ms ease',

  '&:focus': {
    borderColor: theme.colors.primary,
    boxShadow: `0 0 0 3px ${theme.colors.primary}20`
  },

  '&:disabled': {
    backgroundColor: theme.colors.surface,
    cursor: 'not-allowed'
  },

  '&::placeholder': {
    color: theme.colors.textLight
  }
});

const labelStyles = css({
  display: 'block',
  fontSize: theme.fontSize.sm,
  fontWeight: 500,
  color: theme.colors.text,
  marginBottom: theme.spacing.xs
});

export const Input = ({ label, ...props }) => (
  <div>
    {label && <label class={labelStyles.className}>{label}</label>}
    <input class={inputStyles.className} {...props} />
  </div>
);

// ===================================
// 5. Alert Component
// ===================================

const alertStyles = variants({
  base: {
    padding: theme.spacing.md,
    borderRadius: '6px',
    fontSize: theme.fontSize.sm,
    display: 'flex',
    gap: theme.spacing.sm,
    alignItems: 'flex-start'
  },

  variants: {
    status: {
      info: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        borderLeft: `4px solid ${theme.colors.primary}`
      },
      success: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        borderLeft: `4px solid ${theme.colors.success}`
      },
      warning: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        borderLeft: `4px solid ${theme.colors.warning}`
      },
      error: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        borderLeft: `4px solid ${theme.colors.danger}`
      }
    }
  },

  defaultVariants: {
    status: 'info'
  }
});

export const Alert = ({ status = 'info', children, ...props }) => (
  <div class={alertStyles({ status })} {...props}>
    {children}
  </div>
);

// ===================================
// 6. Complete App Example
// ===================================

const appContainerStyles = css({
  maxWidth: '1200px',
  margin: '0 auto',
  padding: theme.spacing.xl
});

const headerStyles = css({
  marginBottom: theme.spacing['2xl']
});

const titleStyles = css({
  fontSize: theme.fontSize['2xl'],
  fontWeight: 700,
  color: theme.colors.text,
  marginBottom: theme.spacing.sm
});

const subtitleStyles = css({
  fontSize: theme.fontSize.lg,
  color: theme.colors.textLight
});

const gridStyles = css({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: theme.spacing.lg,
  marginBottom: theme.spacing.xl
});

const formStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing.md,
  backgroundColor: theme.colors.surface,
  padding: theme.spacing.xl,
  borderRadius: '8px'
});

export const App = () => (
  <div class={appContainerStyles.className}>
    <header class={headerStyles.className}>
      <h1 class={titleStyles.className}>PhilJS CSS Demo</h1>
      <p class={subtitleStyles.className}>
        Type-safe CSS with zero runtime overhead
      </p>
    </header>

    <Alert status="info">
      Welcome to PhilJS CSS! This demo showcases type-safe styling.
    </Alert>

    <div class={gridStyles.className}>
      <Card title="Feature 1">
        Build-time CSS extraction means zero runtime overhead and optimal performance.
      </Card>

      <Card title="Feature 2">
        Full TypeScript type safety ensures your styles are correct at compile time.
      </Card>

      <Card title="Feature 3">
        Variant system makes it easy to create flexible, reusable components.
      </Card>
    </div>

    <div class={formStyles.className}>
      <Input label="Email" type="email" placeholder="Enter your email" />
      <Input label="Password" type="password" placeholder="Enter your password" />

      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
        <Button color="primary" size="lg">
          Sign In
        </Button>
        <Button variant="outline" color="secondary">
          Sign Up
        </Button>
        <Button variant="ghost">
          Cancel
        </Button>
      </div>
    </div>

    <div style={{ marginTop: theme.spacing.xl }}>
      <Alert status="success">
        Your account has been created successfully!
      </Alert>
    </div>
  </div>
);

// ===================================
// 7. Using Atomic Utilities
// ===================================

const atoms = createAtomicSystem({
  spacing: theme.spacing,
  colors: theme.colors,
  fontSize: theme.fontSize
});

export const AtomicExample = () => (
  <div class={`${atoms.flex} ${atoms.flexCol} ${atoms.gap4} ${atoms.p8}`}>
    <div class={`${atoms.bgWhite} ${atoms.p6} ${atoms.rounded8}`}>
      <h2 class={`${atoms.text2xl} ${atoms.fontBold} ${atoms.mb4}`}>
        Using Atomic Utilities
      </h2>
      <p class={`${atoms.textBase} ${atoms.textGray700}`}>
        Atomic utilities provide a Tailwind-like experience with full type safety.
      </p>
    </div>

    <div class={`${atoms.grid} ${atoms.gap6}`}>
      <div class={`${atoms.bgPrimary} ${atoms.textWhite} ${atoms.p4} ${atoms.rounded4}`}>
        Primary Card
      </div>
      <div class={`${atoms.bgSecondary} ${atoms.textWhite} ${atoms.p4} ${atoms.rounded4}`}>
        Secondary Card
      </div>
    </div>
  </div>
);

// ===================================
// 8. Responsive Design
// ===================================

const responsiveContainerStyles = css({
  padding: theme.spacing.md,

  '@media (min-width: 768px)': {
    padding: theme.spacing.lg,
    maxWidth: '768px',
    margin: '0 auto'
  },

  '@media (min-width: 1024px)': {
    padding: theme.spacing.xl,
    maxWidth: '1024px'
  }
});

const responsiveGridStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: theme.spacing.md,

  '@media (min-width: 640px)': {
    gridTemplateColumns: 'repeat(2, 1fr)'
  },

  '@media (min-width: 1024px)': {
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: theme.spacing.lg
  }
});

export const ResponsiveLayout = () => (
  <div class={responsiveContainerStyles.className}>
    <div class={responsiveGridStyles.className}>
      <Card title="Card 1">Responsive grid layout</Card>
      <Card title="Card 2">Adapts to screen size</Card>
      <Card title="Card 3">Mobile-first approach</Card>
    </div>
  </div>
);

// ===================================
// Export all for use
// ===================================

export { theme, buttonStyles, cardStyles, inputStyles, alertStyles };
