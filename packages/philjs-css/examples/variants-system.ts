/**
 * Variants System Examples for PhilJS CSS
 */

import { variants, slotVariants, booleanVariant, stateVariants } from '../src';
import { theme } from './theme-system';

// ===================================
// 1. Button Variants
// ===================================

export const button = variants({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.medium,
    lineHeight: theme.lineHeight.none,
    borderRadius: theme.borderRadius.md,
    border: 'none',
    cursor: 'pointer',
    transition: `all ${theme.transitions.base}`,
    userSelect: 'none',

    '&:focus': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${theme.colors.primary}20`
    },

    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      pointerEvents: 'none'
    }
  },

  variants: {
    // Size variants
    size: {
      xs: {
        padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
        fontSize: theme.fontSize.xs
      },
      sm: {
        padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
        fontSize: theme.fontSize.sm
      },
      md: {
        padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
        fontSize: theme.fontSize.base
      },
      lg: {
        padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
        fontSize: theme.fontSize.lg
      },
      xl: {
        padding: `${theme.spacing[4]} ${theme.spacing[8]}`,
        fontSize: theme.fontSize.xl
      }
    },

    // Color variants
    color: {
      primary: {
        backgroundColor: theme.colors.primary,
        color: theme.colors.white,
        '&:hover': { backgroundColor: theme.colors.primaryDark },
        '&:active': { backgroundColor: theme.colors.primaryDark }
      },
      secondary: {
        backgroundColor: theme.colors.secondary,
        color: theme.colors.white,
        '&:hover': { backgroundColor: theme.colors.secondaryDark },
        '&:active': { backgroundColor: theme.colors.secondaryDark }
      },
      success: {
        backgroundColor: theme.colors.success,
        color: theme.colors.white,
        '&:hover': { backgroundColor: '#059669' }
      },
      danger: {
        backgroundColor: theme.colors.danger,
        color: theme.colors.white,
        '&:hover': { backgroundColor: '#dc2626' }
      },
      warning: {
        backgroundColor: theme.colors.warning,
        color: theme.colors.white,
        '&:hover': { backgroundColor: '#d97706' }
      },
      ghost: {
        backgroundColor: 'transparent',
        color: theme.colors.text,
        '&:hover': { backgroundColor: theme.colors.gray100 }
      }
    },

    // Outline variant
    outline: {
      true: {
        backgroundColor: 'transparent',
        border: `${theme.borderWidth[2]} solid currentColor`,
        '&:hover': {
          backgroundColor: 'currentColor',
          color: theme.colors.white
        }
      }
    },

    // Full width variant
    fullWidth: {
      true: {
        width: '100%'
      }
    },

    // Loading variant
    loading: {
      true: {
        position: 'relative',
        pointerEvents: 'none',
        '&::after': {
          content: '""',
          position: 'absolute',
          width: '16px',
          height: '16px',
          border: '2px solid transparent',
          borderTopColor: 'currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }
      }
    }
  },

  // Compound variants
  compoundVariants: [
    {
      size: 'xs',
      outline: true,
      css: { border: `${theme.borderWidth[1]} solid currentColor` }
    },
    {
      size: 'sm',
      outline: true,
      css: { border: `${theme.borderWidth[1]} solid currentColor` }
    },
    {
      color: 'ghost',
      outline: true,
      css: { border: `${theme.borderWidth[1]} solid ${theme.colors.border}` }
    }
  ],

  defaultVariants: {
    size: 'md',
    color: 'primary'
  }
});

// ===================================
// 2. Badge Variants
// ===================================

export const badge = variants({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    borderRadius: theme.borderRadius.full,
    lineHeight: theme.lineHeight.none
  },

  variants: {
    variant: {
      solid: {},
      outline: {
        backgroundColor: 'transparent',
        border: `${theme.borderWidth[1]} solid currentColor`
      },
      subtle: {
        opacity: 0.8
      }
    },

    color: {
      primary: {
        backgroundColor: theme.colors.primary,
        color: theme.colors.white
      },
      success: {
        backgroundColor: theme.colors.success,
        color: theme.colors.white
      },
      warning: {
        backgroundColor: theme.colors.warning,
        color: theme.colors.white
      },
      danger: {
        backgroundColor: theme.colors.danger,
        color: theme.colors.white
      },
      gray: {
        backgroundColor: theme.colors.gray200,
        color: theme.colors.gray700
      }
    },

    size: {
      sm: {
        padding: `${theme.spacing[0]} ${theme.spacing[2]}`,
        fontSize: theme.fontSize.xs
      },
      md: {
        padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
        fontSize: theme.fontSize.sm
      },
      lg: {
        padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
        fontSize: theme.fontSize.base
      }
    }
  },

  defaultVariants: {
    variant: 'solid',
    color: 'primary',
    size: 'md'
  }
});

// ===================================
// 3. Card Slot Variants
// ===================================

export const card = slotVariants({
  slots: {
    root: {
      backgroundColor: theme.colors.white,
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      transition: `all ${theme.transitions.base}`
    },
    header: {
      padding: theme.spacing[6],
      borderBottom: `${theme.borderWidth[1]} solid ${theme.colors.border}`,
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      color: theme.colors.text
    },
    body: {
      padding: theme.spacing[6],
      fontSize: theme.fontSize.base,
      lineHeight: theme.lineHeight.relaxed,
      color: theme.colors.text
    },
    footer: {
      padding: theme.spacing[6],
      borderTop: `${theme.borderWidth[1]} solid ${theme.colors.border}`,
      backgroundColor: theme.colors.surface,
      fontSize: theme.fontSize.sm
    }
  },

  variants: {
    size: {
      sm: {
        root: { maxWidth: '320px' },
        header: { padding: theme.spacing[4], fontSize: theme.fontSize.base },
        body: { padding: theme.spacing[4] },
        footer: { padding: theme.spacing[4] }
      },
      md: {
        root: { maxWidth: '480px' },
        header: { padding: theme.spacing[6] },
        body: { padding: theme.spacing[6] },
        footer: { padding: theme.spacing[6] }
      },
      lg: {
        root: { maxWidth: '640px' },
        header: { padding: theme.spacing[8], fontSize: theme.fontSize.xl },
        body: { padding: theme.spacing[8] },
        footer: { padding: theme.spacing[8] }
      }
    },

    variant: {
      outlined: {
        root: {
          border: `${theme.borderWidth[1]} solid ${theme.colors.border}`,
          boxShadow: theme.shadows.none
        }
      },
      elevated: {
        root: {
          boxShadow: theme.shadows.lg,
          '&:hover': {
            boxShadow: theme.shadows.xl,
            transform: 'translateY(-2px)'
          }
        }
      },
      filled: {
        root: { backgroundColor: theme.colors.surface }
      }
    },

    interactive: booleanVariant({
      root: {
        cursor: 'pointer',
        '&:hover': {
          boxShadow: theme.shadows.md,
          transform: 'translateY(-1px)'
        }
      }
    })
  },

  defaultVariants: {
    size: 'md',
    variant: 'elevated'
  }
});

// ===================================
// 4. Input Variants
// ===================================

export const input = variants({
  base: {
    width: '100%',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    fontSize: theme.fontSize.base,
    fontFamily: theme.fontFamily.sans,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    outline: 'none',
    transition: `all ${theme.transitions.fast}`,

    '&::placeholder': {
      color: theme.colors.gray400
    },

    '&:disabled': {
      backgroundColor: theme.colors.gray100,
      cursor: 'not-allowed',
      opacity: 0.6
    }
  },

  variants: {
    variant: {
      outline: {
        border: `${theme.borderWidth[1]} solid ${theme.colors.border}`,
        '&:focus': {
          borderColor: theme.colors.primary,
          boxShadow: `0 0 0 3px ${theme.colors.primary}20`
        }
      },
      filled: {
        border: 'none',
        backgroundColor: theme.colors.gray100,
        '&:focus': {
          backgroundColor: theme.colors.white,
          boxShadow: `0 0 0 3px ${theme.colors.primary}20`
        }
      },
      flushed: {
        border: 'none',
        borderBottom: `${theme.borderWidth[2]} solid ${theme.colors.border}`,
        borderRadius: 0,
        paddingLeft: 0,
        paddingRight: 0,
        '&:focus': {
          borderBottomColor: theme.colors.primary
        }
      }
    },

    size: {
      sm: {
        padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
        fontSize: theme.fontSize.sm
      },
      md: {
        padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
        fontSize: theme.fontSize.base
      },
      lg: {
        padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
        fontSize: theme.fontSize.lg
      }
    },

    error: {
      true: {
        borderColor: theme.colors.danger,
        '&:focus': {
          borderColor: theme.colors.danger,
          boxShadow: `0 0 0 3px ${theme.colors.danger}20`
        }
      }
    }
  },

  defaultVariants: {
    variant: 'outline',
    size: 'md'
  }
});

// ===================================
// 5. Alert Variants
// ===================================

export const alert = variants({
  base: {
    display: 'flex',
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSize.sm,
    lineHeight: theme.lineHeight.relaxed
  },

  variants: {
    status: {
      success: {
        backgroundColor: '#d1fae5',
        color: '#065f46',
        borderLeft: `${theme.borderWidth[4]} solid ${theme.colors.success}`
      },
      warning: {
        backgroundColor: '#fef3c7',
        color: '#92400e',
        borderLeft: `${theme.borderWidth[4]} solid ${theme.colors.warning}`
      },
      error: {
        backgroundColor: '#fee2e2',
        color: '#991b1b',
        borderLeft: `${theme.borderWidth[4]} solid ${theme.colors.danger}`
      },
      info: {
        backgroundColor: '#dbeafe',
        color: '#1e40af',
        borderLeft: `${theme.borderWidth[4]} solid ${theme.colors.info}`
      }
    },

    variant: {
      subtle: {},
      solid: {
        color: theme.colors.white
      },
      leftAccent: {
        borderLeft: `${theme.borderWidth[4]} solid`
      }
    }
  },

  compoundVariants: [
    {
      status: 'success',
      variant: 'solid',
      css: { backgroundColor: theme.colors.success }
    },
    {
      status: 'warning',
      variant: 'solid',
      css: { backgroundColor: theme.colors.warning }
    },
    {
      status: 'error',
      variant: 'solid',
      css: { backgroundColor: theme.colors.danger }
    },
    {
      status: 'info',
      variant: 'solid',
      css: { backgroundColor: theme.colors.info }
    }
  ],

  defaultVariants: {
    status: 'info',
    variant: 'subtle'
  }
});

// ===================================
// 6. Link State Variants
// ===================================

export const link = stateVariants({
  base: {
    color: theme.colors.primary,
    textDecoration: 'none',
    fontWeight: theme.fontWeight.medium,
    transition: `all ${theme.transitions.fast}`
  },

  states: {
    hover: {
      color: theme.colors.primaryDark,
      textDecoration: 'underline'
    },
    focus: {
      outline: `${theme.borderWidth[2]} solid ${theme.colors.primary}`,
      outlineOffset: '2px',
      borderRadius: theme.borderRadius.sm
    },
    active: {
      color: theme.colors.primaryDark,
      transform: 'translateY(1px)'
    },
    visited: {
      color: '#7c3aed'
    }
  }
});

// ===================================
// 7. Avatar Variants
// ===================================

export const avatar = variants({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray300,
    color: theme.colors.white,
    fontWeight: theme.fontWeight.medium,
    userSelect: 'none'
  },

  variants: {
    size: {
      xs: {
        width: '24px',
        height: '24px',
        fontSize: theme.fontSize.xs
      },
      sm: {
        width: '32px',
        height: '32px',
        fontSize: theme.fontSize.sm
      },
      md: {
        width: '40px',
        height: '40px',
        fontSize: theme.fontSize.base
      },
      lg: {
        width: '56px',
        height: '56px',
        fontSize: theme.fontSize.lg
      },
      xl: {
        width: '80px',
        height: '80px',
        fontSize: theme.fontSize.xl
      }
    },

    bordered: {
      true: {
        border: `${theme.borderWidth[2]} solid ${theme.colors.white}`,
        boxShadow: theme.shadows.sm
      }
    }
  },

  defaultVariants: {
    size: 'md'
  }
});
