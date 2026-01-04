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
/**
 * Create a multi-step form wizard
 */
export declare function createWizard(config: WizardConfig): WizardController;
/**
 * React hook for wizard (compatible with signal-based systems)
 */
export declare function useWizard(config: WizardConfig): WizardController;
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
export declare function getStepIndicatorData(props: StepIndicatorProps): Array<{
    step: WizardStep;
    index: number;
    status: 'completed' | 'current' | 'upcoming' | 'skipped';
    isClickable: boolean;
}>;
/**
 * Calculate wizard progress percentage
 */
export declare function calculateProgress(currentStep: number, totalSteps: number, completedSteps: Set<number>): {
    percentage: number;
    completedCount: number;
    remainingCount: number;
};
export type TransitionDirection = 'forward' | 'backward';
export interface StepTransitionConfig {
    direction: TransitionDirection;
    duration?: number;
    easing?: string;
}
/**
 * Generate CSS transition styles for step changes
 */
export declare function getStepTransitionStyles(config: StepTransitionConfig): {
    enter: Record<string, string>;
    enterActive: Record<string, string>;
    exit: Record<string, string>;
    exitActive: Record<string, string>;
};
/**
 * Create a checkout wizard configuration
 */
export declare function createCheckoutWizard(options: {
    onComplete: (data: Record<string, unknown>) => Promise<void>;
    hasShipping?: boolean;
    hasBilling?: boolean;
}): WizardConfig;
/**
 * Create a signup wizard configuration
 */
export declare function createSignupWizard(options: {
    onComplete: (data: Record<string, unknown>) => Promise<void>;
    requireEmailVerification?: boolean;
    hasProfileStep?: boolean;
}): WizardConfig;
/**
 * Create a survey wizard configuration
 */
export declare function createSurveyWizard(questions: Array<{
    id: string;
    title: string;
    type: 'text' | 'choice' | 'rating' | 'multiselect';
    required?: boolean;
}>, onComplete: (data: Record<string, unknown>) => Promise<void>): WizardConfig;
//# sourceMappingURL=wizard.d.ts.map