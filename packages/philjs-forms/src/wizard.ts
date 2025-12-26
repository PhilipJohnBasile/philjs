/**
 * Multi-Step Form Wizard
 *
 * A comprehensive wizard system for multi-step forms:
 * - Step navigation with validation
 * - Progress tracking
 * - Conditional steps
 * - Step persistence
 * - Animated transitions
 */

// =============================================================================
// Types
// =============================================================================

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  fields: string[];
  validate?: () => boolean | Promise<boolean>;
  canSkip?: boolean;
  condition?: (data: Record<string, unknown>) => boolean;
}

export interface WizardConfig {
  steps: WizardStep[];
  initialStep?: number;
  allowJumpToStep?: boolean;
  validateOnStepChange?: boolean;
  persistKey?: string;
  onStepChange?: (from: number, to: number) => void;
  onComplete?: (data: Record<string, unknown>) => void | Promise<void>;
}

export interface WizardState {
  currentStep: number;
  visitedSteps: Set<number>;
  completedSteps: Set<number>;
  isSubmitting: boolean;
  isValidating: boolean;
  direction: 'forward' | 'backward';
  data: Record<string, unknown>;
}

export interface WizardController {
  state: WizardState;
  steps: WizardStep[];
  activeSteps: WizardStep[];
  currentStepData: WizardStep;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  goToStep: (index: number) => Promise<boolean>;
  nextStep: () => Promise<boolean>;
  prevStep: () => Promise<boolean>;
  skipStep: () => Promise<boolean>;
  reset: () => void;
  submit: () => Promise<void>;
  setData: (key: string, value: unknown) => void;
  getData: () => Record<string, unknown>;
  validateCurrentStep: () => Promise<boolean>;
}

// =============================================================================
// Wizard Implementation
// =============================================================================

/**
 * Create a multi-step form wizard
 */
export function createWizard(config: WizardConfig): WizardController {
  const {
    steps,
    initialStep = 0,
    allowJumpToStep = false,
    validateOnStepChange = true,
    persistKey,
    onStepChange,
    onComplete,
  } = config;

  let state: WizardState = {
    currentStep: initialStep,
    visitedSteps: new Set([initialStep]),
    completedSteps: new Set(),
    isSubmitting: false,
    isValidating: false,
    direction: 'forward',
    data: {},
  };

  // Restore from persistence
  if (persistKey && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(`wizard_${persistKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        state = {
          ...state,
          currentStep: parsed.currentStep ?? initialStep,
          visitedSteps: new Set(parsed.visitedSteps ?? [initialStep]),
          completedSteps: new Set(parsed.completedSteps ?? []),
          data: parsed.data ?? {},
        };
      } catch {
        // Invalid saved state, start fresh
      }
    }
  }

  const listeners = new Set<() => void>();

  function notify() {
    listeners.forEach((fn) => fn());
    persist();
  }

  function persist() {
    if (persistKey && typeof localStorage !== 'undefined') {
      localStorage.setItem(
        `wizard_${persistKey}`,
        JSON.stringify({
          currentStep: state.currentStep,
          visitedSteps: Array.from(state.visitedSteps),
          completedSteps: Array.from(state.completedSteps),
          data: state.data,
        })
      );
    }
  }

  function getActiveSteps(): WizardStep[] {
    return steps.filter((step) => {
      if (!step.condition) return true;
      return step.condition(state.data);
    });
  }

  function getCurrentActiveIndex(): number {
    const activeSteps = getActiveSteps();
    const currentStep = steps[state.currentStep];
    return activeSteps.findIndex((s) => s.id === currentStep?.id);
  }

  async function validateStep(stepIndex: number): Promise<boolean> {
    const step = steps[stepIndex];
    if (!step?.validate) return true;

    state.isValidating = true;
    notify();

    try {
      const result = await step.validate();
      return result;
    } finally {
      state.isValidating = false;
      notify();
    }
  }

  async function goToStep(targetIndex: number): Promise<boolean> {
    const activeSteps = getActiveSteps();
    if (targetIndex < 0 || targetIndex >= activeSteps.length) {
      return false;
    }

    // Check if jump is allowed
    if (!allowJumpToStep && !state.visitedSteps.has(targetIndex)) {
      return false;
    }

    // Validate current step if going forward
    const currentActiveIndex = getCurrentActiveIndex();
    if (validateOnStepChange && targetIndex > currentActiveIndex) {
      const isValid = await validateStep(state.currentStep);
      if (!isValid) return false;
      state.completedSteps.add(state.currentStep);
    }

    const fromStep = state.currentStep;
    state.direction = targetIndex > currentActiveIndex ? 'forward' : 'backward';
    state.currentStep = steps.findIndex((s) => s.id === activeSteps[targetIndex].id);
    state.visitedSteps.add(state.currentStep);

    onStepChange?.(fromStep, state.currentStep);
    notify();

    return true;
  }

  async function nextStep(): Promise<boolean> {
    const currentActiveIndex = getCurrentActiveIndex();
    return goToStep(currentActiveIndex + 1);
  }

  async function prevStep(): Promise<boolean> {
    const currentActiveIndex = getCurrentActiveIndex();
    return goToStep(currentActiveIndex - 1);
  }

  async function skipStep(): Promise<boolean> {
    const currentStep = steps[state.currentStep];
    if (!currentStep?.canSkip) return false;
    return nextStep();
  }

  function reset() {
    state = {
      currentStep: initialStep,
      visitedSteps: new Set([initialStep]),
      completedSteps: new Set(),
      isSubmitting: false,
      isValidating: false,
      direction: 'forward',
      data: {},
    };

    if (persistKey && typeof localStorage !== 'undefined') {
      localStorage.removeItem(`wizard_${persistKey}`);
    }

    notify();
  }

  async function submit(): Promise<void> {
    // Validate final step
    const isValid = await validateStep(state.currentStep);
    if (!isValid) return;

    state.isSubmitting = true;
    state.completedSteps.add(state.currentStep);
    notify();

    try {
      await onComplete?.(state.data);
    } finally {
      state.isSubmitting = false;
      notify();
    }
  }

  function setData(key: string, value: unknown) {
    state.data[key] = value;
    notify();
  }

  function getData(): Record<string, unknown> {
    return { ...state.data };
  }

  async function validateCurrentStep(): Promise<boolean> {
    return validateStep(state.currentStep);
  }

  const controller: WizardController = {
    get state() {
      return state;
    },
    get steps() {
      return steps;
    },
    get activeSteps() {
      return getActiveSteps();
    },
    get currentStepData() {
      return steps[state.currentStep];
    },
    get progress() {
      const activeSteps = getActiveSteps();
      const currentActiveIndex = getCurrentActiveIndex();
      return activeSteps.length > 1
        ? (currentActiveIndex / (activeSteps.length - 1)) * 100
        : 100;
    },
    get isFirstStep() {
      return getCurrentActiveIndex() === 0;
    },
    get isLastStep() {
      const activeSteps = getActiveSteps();
      return getCurrentActiveIndex() === activeSteps.length - 1;
    },
    get canGoNext() {
      const activeSteps = getActiveSteps();
      return getCurrentActiveIndex() < activeSteps.length - 1;
    },
    get canGoPrev() {
      return getCurrentActiveIndex() > 0;
    },
    goToStep,
    nextStep,
    prevStep,
    skipStep,
    reset,
    submit,
    setData,
    getData,
    validateCurrentStep,
  };

  return controller;
}

// =============================================================================
// React Hook for Wizard
// =============================================================================

/**
 * React hook for wizard (compatible with signal-based systems)
 */
export function useWizard(config: WizardConfig): WizardController {
  // This would integrate with the signal system
  return createWizard(config);
}

// =============================================================================
// Step Indicator Component Helpers
// =============================================================================

export interface StepIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  visitedSteps: Set<number>;
  completedSteps: Set<number>;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
  showDescription?: boolean;
}

/**
 * Generate step indicator data for rendering
 */
export function getStepIndicatorData(props: StepIndicatorProps): Array<{
  step: WizardStep;
  index: number;
  status: 'completed' | 'current' | 'upcoming' | 'skipped';
  isClickable: boolean;
}> {
  const { steps, currentStep, visitedSteps, completedSteps } = props;

  return steps.map((step, index) => {
    let status: 'completed' | 'current' | 'upcoming' | 'skipped';

    if (completedSteps.has(index)) {
      status = 'completed';
    } else if (index === currentStep) {
      status = 'current';
    } else if (visitedSteps.has(index) && !completedSteps.has(index)) {
      status = 'skipped';
    } else {
      status = 'upcoming';
    }

    return {
      step,
      index,
      status,
      isClickable: visitedSteps.has(index) || status === 'completed',
    };
  });
}

// =============================================================================
// Progress Bar Helpers
// =============================================================================

/**
 * Calculate wizard progress percentage
 */
export function calculateProgress(
  currentStep: number,
  totalSteps: number,
  completedSteps: Set<number>
): {
  percentage: number;
  completedCount: number;
  remainingCount: number;
} {
  const completedCount = completedSteps.size;
  const remainingCount = totalSteps - completedCount;
  const percentage = totalSteps > 1
    ? (currentStep / (totalSteps - 1)) * 100
    : 100;

  return {
    percentage: Math.min(100, Math.max(0, percentage)),
    completedCount,
    remainingCount,
  };
}

// =============================================================================
// Step Transition Helpers
// =============================================================================

export type TransitionDirection = 'forward' | 'backward';

export interface StepTransitionConfig {
  direction: TransitionDirection;
  duration?: number;
  easing?: string;
}

/**
 * Generate CSS transition styles for step changes
 */
export function getStepTransitionStyles(config: StepTransitionConfig): {
  enter: Record<string, string>;
  enterActive: Record<string, string>;
  exit: Record<string, string>;
  exitActive: Record<string, string>;
} {
  const { direction, duration = 300, easing = 'ease-out' } = config;
  const offset = direction === 'forward' ? '100%' : '-100%';
  const exitOffset = direction === 'forward' ? '-100%' : '100%';

  return {
    enter: {
      transform: `translateX(${offset})`,
      opacity: '0',
    },
    enterActive: {
      transform: 'translateX(0)',
      opacity: '1',
      transition: `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`,
    },
    exit: {
      transform: 'translateX(0)',
      opacity: '1',
    },
    exitActive: {
      transform: `translateX(${exitOffset})`,
      opacity: '0',
      transition: `transform ${duration}ms ${easing}, opacity ${duration}ms ${easing}`,
    },
  };
}

// =============================================================================
// Wizard Templates
// =============================================================================

/**
 * Create a checkout wizard configuration
 */
export function createCheckoutWizard(options: {
  onComplete: (data: Record<string, unknown>) => Promise<void>;
  hasShipping?: boolean;
  hasBilling?: boolean;
}): WizardConfig {
  const { onComplete, hasShipping = true, hasBilling = true } = options;

  const steps: WizardStep[] = [
    {
      id: 'cart',
      title: 'Cart Review',
      description: 'Review your items',
      fields: ['items', 'coupon'],
    },
  ];

  if (hasShipping) {
    steps.push({
      id: 'shipping',
      title: 'Shipping',
      description: 'Enter shipping address',
      fields: ['shippingAddress', 'shippingMethod'],
    });
  }

  if (hasBilling) {
    steps.push({
      id: 'billing',
      title: 'Billing',
      description: 'Enter billing information',
      fields: ['billingAddress', 'sameAsShipping'],
      condition: (data) => !data.sameAsShipping,
    });
  }

  steps.push(
    {
      id: 'payment',
      title: 'Payment',
      description: 'Enter payment details',
      fields: ['paymentMethod', 'cardNumber', 'expiry', 'cvv'],
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Confirm your order',
      fields: [],
    }
  );

  return {
    steps,
    validateOnStepChange: true,
    persistKey: 'checkout',
    onComplete,
  };
}

/**
 * Create a signup wizard configuration
 */
export function createSignupWizard(options: {
  onComplete: (data: Record<string, unknown>) => Promise<void>;
  requireEmailVerification?: boolean;
  hasProfileStep?: boolean;
}): WizardConfig {
  const { onComplete, requireEmailVerification = true, hasProfileStep = true } = options;

  const steps: WizardStep[] = [
    {
      id: 'account',
      title: 'Account',
      description: 'Create your account',
      fields: ['email', 'password', 'confirmPassword'],
    },
  ];

  if (requireEmailVerification) {
    steps.push({
      id: 'verify',
      title: 'Verify Email',
      description: 'Enter verification code',
      fields: ['verificationCode'],
    });
  }

  if (hasProfileStep) {
    steps.push({
      id: 'profile',
      title: 'Profile',
      description: 'Set up your profile',
      fields: ['firstName', 'lastName', 'avatar', 'bio'],
      canSkip: true,
    });
  }

  steps.push({
    id: 'preferences',
    title: 'Preferences',
    description: 'Customize your experience',
    fields: ['theme', 'notifications', 'language'],
    canSkip: true,
  });

  return {
    steps,
    validateOnStepChange: true,
    persistKey: 'signup',
    onComplete,
  };
}

/**
 * Create a survey wizard configuration
 */
export function createSurveyWizard(questions: Array<{
  id: string;
  title: string;
  type: 'text' | 'choice' | 'rating' | 'multiselect';
  required?: boolean;
}>, onComplete: (data: Record<string, unknown>) => Promise<void>): WizardConfig {
  const steps: WizardStep[] = questions.map((q) => ({
    id: q.id,
    title: q.title,
    fields: [q.id],
    canSkip: !q.required,
  }));

  return {
    steps,
    allowJumpToStep: true,
    validateOnStepChange: false,
    onComplete,
  };
}
