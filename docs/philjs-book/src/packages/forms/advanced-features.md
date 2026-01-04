# Advanced Features

@philjs/forms includes powerful advanced features for complex form scenarios: multi-step wizards, input masking, and auto-save with draft recovery.

## Multi-Step Wizard

Create guided multi-step form experiences with validation, progress tracking, and conditional steps.

### Basic Wizard

```typescript
import { createWizard } from '@philjs/forms';

const wizard = createWizard({
  steps: [
    {
      id: 'account',
      title: 'Create Account',
      description: 'Enter your credentials',
      fields: ['email', 'password'],
      validate: async () => {
        const errors = await validateAccountForm();
        return Object.keys(errors).length === 0;
      },
    },
    {
      id: 'profile',
      title: 'Your Profile',
      description: 'Tell us about yourself',
      fields: ['name', 'bio', 'avatar'],
      canSkip: true,  // Allow skipping this step
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Customize your experience',
      fields: ['theme', 'notifications'],
    },
  ],
  initialStep: 0,
  allowJumpToStep: false,      // Require sequential completion
  validateOnStepChange: true,   // Validate before moving forward
  persistKey: 'signup-wizard',  // localStorage key for persistence
  onStepChange: (from, to) => {
    console.log(`Moving from step ${from} to ${to}`);
  },
  onComplete: async (data) => {
    await api.createUser(data);
  },
});
```

### Wizard Navigation

```typescript
// Move forward (validates current step first)
await wizard.nextStep();

// Move backward
await wizard.prevStep();

// Jump to specific step (if allowJumpToStep is true)
await wizard.goToStep(2);

// Skip current step (if canSkip is true)
await wizard.skipStep();

// Reset wizard to initial state
wizard.reset();

// Submit wizard (validates final step)
await wizard.submit();
```

### Wizard State

```typescript
// Access current state
wizard.state;
// {
//   currentStep: 0,
//   visitedSteps: Set<number>,
//   completedSteps: Set<number>,
//   isSubmitting: boolean,
//   isValidating: boolean,
//   direction: 'forward' | 'backward',
//   data: Record<string, unknown>
// }

// Computed properties
wizard.currentStepData;  // Current step configuration
wizard.progress;         // 0-100 percentage
wizard.isFirstStep;      // boolean
wizard.isLastStep;       // boolean
wizard.canGoNext;        // boolean
wizard.canGoPrev;        // boolean
wizard.activeSteps;      // Steps with conditions met
```

### Managing Wizard Data

```typescript
// Set individual data
wizard.setData('email', 'user@example.com');
wizard.setData('notifications', true);

// Get all wizard data
const data = wizard.getData();
// { email: 'user@example.com', notifications: true }

// Validate current step
const isValid = await wizard.validateCurrentStep();
```

### Conditional Steps

Show or hide steps based on form data:

```typescript
const wizard = createWizard({
  steps: [
    {
      id: 'accountType',
      title: 'Account Type',
      fields: ['accountType'],
    },
    {
      id: 'businessInfo',
      title: 'Business Information',
      fields: ['companyName', 'taxId', 'employees'],
      // Only show for business accounts
      condition: (data) => data.accountType === 'business',
    },
    {
      id: 'payment',
      title: 'Payment',
      fields: ['paymentMethod'],
    },
  ],
  onComplete: handleComplete,
});

// activeSteps only includes steps where condition returns true
const visibleSteps = wizard.activeSteps;
```

### Step Indicator Component

Build a progress indicator:

```typescript
import { getStepIndicatorData, calculateProgress } from '@philjs/forms';

function WizardProgress({ wizard }) {
  const steps = getStepIndicatorData({
    steps: wizard.steps,
    currentStep: wizard.state.currentStep,
    visitedSteps: wizard.state.visitedSteps,
    completedSteps: wizard.state.completedSteps,
  });

  // Each step has: { step, index, status, isClickable }
  // status: 'completed' | 'current' | 'upcoming' | 'skipped'

  const progress = calculateProgress(
    wizard.state.currentStep,
    wizard.steps.length,
    wizard.state.completedSteps
  );
  // { percentage: 50, completedCount: 1, remainingCount: 2 }

  return (
    <div class="wizard-progress">
      <div
        class="progress-bar"
        style={{ width: `${progress.percentage}%` }}
      />
      <nav class="step-indicators">
        {steps.map(({ step, index, status, isClickable }) => (
          <button
            key={step.id}
            class={`step-indicator ${status}`}
            disabled={!isClickable}
            onClick={() => wizard.goToStep(index)}
          >
            <span class="step-number">{index + 1}</span>
            <span class="step-title">{step.title}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
```

### Step Transitions

Animate step changes:

```typescript
import { getStepTransitionStyles } from '@philjs/forms';

const styles = getStepTransitionStyles({
  direction: wizard.state.direction, // 'forward' | 'backward'
  duration: 300,
  easing: 'ease-out',
});

// Returns CSS for enter/exit animations
// {
//   enter: { transform: 'translateX(100%)', opacity: '0' },
//   enterActive: { transform: 'translateX(0)', opacity: '1', transition: '...' },
//   exit: { transform: 'translateX(0)', opacity: '1' },
//   exitActive: { transform: 'translateX(-100%)', opacity: '0', transition: '...' },
// }
```

### Pre-built Wizard Templates

#### Checkout Wizard

```typescript
import { createCheckoutWizard } from '@philjs/forms';

const checkout = createCheckoutWizard({
  hasShipping: true,
  hasBilling: true,  // Shows billing step if different from shipping
  onComplete: async (data) => {
    await processOrder(data);
  },
});

// Creates steps: Cart Review -> Shipping -> Billing -> Payment -> Review
```

#### Signup Wizard

```typescript
import { createSignupWizard } from '@philjs/forms';

const signup = createSignupWizard({
  requireEmailVerification: true,
  hasProfileStep: true,
  onComplete: async (data) => {
    await createAccount(data);
  },
});

// Creates steps: Account -> Verify Email -> Profile -> Preferences
```

#### Survey Wizard

```typescript
import { createSurveyWizard } from '@philjs/forms';

const survey = createSurveyWizard(
  [
    { id: 'q1', title: 'How did you find us?', type: 'choice', required: true },
    { id: 'q2', title: 'Rate your experience', type: 'rating', required: true },
    { id: 'q3', title: 'Additional feedback', type: 'text', required: false },
  ],
  async (data) => {
    await submitSurvey(data);
  }
);

// Creates one step per question, non-required questions are skippable
```

## Input Masking

Format input values in real-time with predefined and custom masks.

### Phone Number Mask

```typescript
import { phoneMask } from '@philjs/forms';

// US format (default)
const result = phoneMask('5551234567');
// {
//   maskedValue: '(555) 123-4567',
//   rawValue: '5551234567',
//   isComplete: true,
//   isValid: true
// }

// International format
const intl = phoneMask('5551234567', {
  format: 'international',
  countryCode: '+1',
});
// maskedValue: '+1 (555) 123-4567'

// Simple format (no formatting)
const simple = phoneMask('5551234567', { format: 'simple' });
// maskedValue: '5551234567'
```

### Credit Card Mask

```typescript
import { creditCardMask, detectCardType, luhnCheck } from '@philjs/forms';

const result = creditCardMask('4111111111111111');
// {
//   maskedValue: '4111 1111 1111 1111',
//   rawValue: '4111111111111111',
//   isComplete: true,
//   isValid: true,  // Luhn check passed
//   cardType: 'visa'
// }

// American Express (different format)
const amex = creditCardMask('378282246310005');
// maskedValue: '3782 822463 10005' (4-6-5 format)
// cardType: 'amex'

// Detect card type
detectCardType('4111');   // 'visa'
detectCardType('5500');   // 'mastercard'
detectCardType('3782');   // 'amex'
detectCardType('6011');   // 'discover'

// Validate with Luhn algorithm
luhnCheck('4111111111111111');  // true
luhnCheck('4111111111111112');  // false
```

### Currency Mask

```typescript
import { currencyMask } from '@philjs/forms';

const result = currencyMask('1234567.89');
// {
//   maskedValue: '$1,234,567.89',
//   rawValue: '1234567.89',
//   isComplete: true,
//   isValid: true
// }

// Custom options
const euro = currencyMask('1234567.89', {
  symbol: '\u20AC',
  symbolPosition: 'suffix',
  thousandsSeparator: '.',
  decimalSeparator: ',',
  decimalPlaces: 2,
  allowNegative: true,
});
// maskedValue: '1.234.567,89\u20AC'
```

### Date Mask

```typescript
import { dateMask } from '@philjs/forms';

const result = dateMask('12252024');
// {
//   maskedValue: '12/25/2024',
//   rawValue: '12252024',
//   isComplete: true,
//   isValid: true,
//   date: Date object
// }

// Different formats
dateMask('25122024', { format: 'DD/MM/YYYY' });
// maskedValue: '25/12/2024'

dateMask('20241225', { format: 'YYYY-MM-DD' });
// maskedValue: '2024-12-25'
```

### Time Mask

```typescript
import { timeMask } from '@philjs/forms';

const result = timeMask('1430');
// {
//   maskedValue: '14:30',
//   rawValue: '1430',
//   isComplete: true,
//   isValid: true
// }

// 12-hour format
const time12 = timeMask('0930', { format: '12h' });

// With seconds
const withSeconds = timeMask('143025', { showSeconds: true });
// maskedValue: '14:30:25'
```

### SSN Mask

```typescript
import { ssnMask } from '@philjs/forms';

const result = ssnMask('123456789');
// {
//   maskedValue: '123-45-6789',
//   rawValue: '123456789',
//   isComplete: true,
//   isValid: true
// }
```

### ZIP Code Mask

```typescript
import { zipCodeMask } from '@philjs/forms';

// US 5-digit
const us5 = zipCodeMask('12345');
// maskedValue: '12345'

// US extended
const us9 = zipCodeMask('123456789', { format: 'us-extended' });
// maskedValue: '12345-6789'

// Canada
const canada = zipCodeMask('K1A0B1', { format: 'canada' });
// maskedValue: 'K1A 0B1'

// UK
const uk = zipCodeMask('SW1A1AA', { format: 'uk' });
```

### Custom Masks

```typescript
import { applyMask, parseMaskPattern, unmask, maskChars } from '@philjs/forms';

// Mask characters:
// 9 = digit
// a = letter (any case)
// A = uppercase letter
// * = alphanumeric

// Custom pattern
const result = applyMask('AB123456', 'AA-999999');
// maskedValue: 'AB-123456'

// Parse pattern to array
const pattern = parseMaskPattern('(999) 999-9999');
// [/\d/, /\d/, /\d/, ...] with literal characters

// Remove mask
const raw = unmask('(555) 123-4567', '(999) 999-9999');
// '5551234567'
```

### Mask Input Handler

Create an input handler for real-time masking:

```typescript
import { createMaskInputHandler, phoneMask } from '@philjs/forms';

const handler = createMaskInputHandler(
  (value) => phoneMask(value),
  (result) => {
    console.log('Masked:', result.maskedValue);
    console.log('Raw:', result.rawValue);
    console.log('Valid:', result.isValid);
  }
);

// Use in your input element
<input
  type="tel"
  onInput={handler.onInput}
  onKeyDown={handler.onKeyDown}
  onFocus={handler.onFocus}
  onBlur={handler.onBlur}
/>
```

### Mask Presets

```typescript
import { maskPresets } from '@philjs/forms';

maskPresets.phone.us           // '(999) 999-9999'
maskPresets.phone.international // '+9 (999) 999-9999'
maskPresets.creditCard.standard // '9999 9999 9999 9999'
maskPresets.creditCard.amex    // '9999 999999 99999'
maskPresets.date['MM/DD/YYYY'] // '99/99/9999'
maskPresets.date['YYYY-MM-DD'] // '9999-99-99'
maskPresets.time['12h']        // '99:99'
maskPresets.time['withSeconds'] // '99:99:99'
maskPresets.ssn                // '999-99-9999'
maskPresets.zip.us             // '99999'
maskPresets.zip.usExtended     // '99999-9999'
```

## Auto-Save & Draft Recovery

Automatically save form progress and recover from interruptions.

### Basic Auto-Save

```typescript
import { createAutoSave } from '@philjs/forms';

const autoSave = createAutoSave({
  key: 'contact-form',
  debounceMs: 1000,       // Save after 1 second of inactivity
  maxVersions: 10,        // Keep up to 10 versions
  storage: localStorage,  // or sessionStorage, or custom
  encrypt: false,         // Basic encryption for sensitive data
  onSave: (draft) => {
    console.log('Saved at:', new Date(draft.timestamp));
  },
  onRestore: (draft) => {
    console.log('Restored version:', draft.version);
  },
});
```

### Using Auto-Save

```typescript
// Update data (triggers debounced save)
autoSave.setData({
  name: 'John',
  email: 'john@example.com',
  message: 'Hello...',
});

// Manual save
await autoSave.save();

// Check for recoverable draft
if (autoSave.checkRecovery()) {
  const draft = autoSave.restore();
  if (draft) {
    // Populate form with draft.data
    form.setValues(draft.data);
  }
}

// Get version history
const versions = autoSave.getVersions();
// [{ id, data, timestamp, version, checksum }, ...]

// Restore specific version
const oldDraft = autoSave.restoreVersion(5);

// Clear all saved data
autoSave.clear();

// Mark form as clean (no pending saves)
autoSave.markClean();

// Discard recovery draft
autoSave.discardRecovery();
```

### Auto-Save State

```typescript
autoSave.state;
// {
//   isDirty: boolean,      // Has unsaved changes
//   lastSaved: number,     // Timestamp of last save
//   isSaving: boolean,     // Currently saving
//   hasRecovery: boolean,  // Has recoverable draft
//   versions: FormDraft[]  // Version history
// }
```

### React Integration

```typescript
import { useAutoSave } from '@philjs/forms';

function MyForm() {
  const [formData, setFormData] = useState({ name: '', email: '' });

  const { controller, hasRecovery, recover, discard } = useAutoSave(
    formData,
    {
      key: 'my-form',
      debounceMs: 2000,
    }
  );

  useEffect(() => {
    if (hasRecovery) {
      const confirmed = window.confirm('Recover previous draft?');
      if (confirmed) {
        const data = recover();
        if (data) {
          setFormData(data);
        }
      } else {
        discard();
      }
    }
  }, []);

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      {controller.state.isSaving && <span>Saving...</span>}
      {controller.state.lastSaved && (
        <span>Last saved: {formatTime(controller.state.lastSaved)}</span>
      )}
    </form>
  );
}
```

### Conflict Resolution

Handle conflicts between local and remote data:

```typescript
import { resolveConflict } from '@philjs/forms';

const localDraft = autoSave.restore();
const remoteDraft = await fetchRemoteDraft();

// Resolve with different strategies
const resolved = resolveConflict(localDraft, remoteDraft, 'local');
// Strategies: 'local', 'remote', 'merge', 'manual'

// 'merge' combines fields, preferring newer values
// 'manual' returns local for custom handling
```

### Custom Storage Adapters

#### IndexedDB Storage

```typescript
import { createIndexedDBStorage } from '@philjs/forms';

const storage = await createIndexedDBStorage('myApp');

const autoSave = createAutoSave({
  key: 'large-form',
  storage,  // Uses IndexedDB instead of localStorage
});
```

#### Session Storage

```typescript
import { createSessionStorage } from '@philjs/forms';

const storage = createSessionStorage();

const autoSave = createAutoSave({
  key: 'temp-form',
  storage,  // Clears when browser closes
});
```

### Recovery Dialog Helpers

```typescript
import { formatDraftTimestamp, getRecoveryMessage } from '@philjs/forms';

const draft = autoSave.restore();

// Format timestamp for display
formatDraftTimestamp(draft.timestamp);
// "Just now", "5 minutes ago", "2 hours ago", "Dec 25, 2:30 PM"

// Get recovery message
getRecoveryMessage(draft);
// "You have unsaved changes from 5 minutes ago (3 fields). Would you like to recover them?"
```

### Complete Auto-Save Example

```typescript
function ContactForm() {
  const form = useForm({
    initialValues: { name: '', email: '', message: '' },
  });

  const autoSave = createAutoSave({
    key: 'contact-form',
    debounceMs: 2000,
    onSave: () => {
      showToast('Draft saved');
    },
  });

  // Check for recovery on mount
  useEffect(() => {
    if (autoSave.checkRecovery()) {
      showRecoveryDialog({
        onRecover: () => {
          const draft = autoSave.restore();
          if (draft) {
            form.setValues(draft.data);
          }
        },
        onDiscard: () => {
          autoSave.discardRecovery();
        },
      });
    }
  }, []);

  // Update auto-save when form changes
  useEffect(() => {
    autoSave.setData(form.values());
  }, [form.values()]);

  // Clear on successful submit
  const handleSubmit = async (values) => {
    await submitForm(values);
    autoSave.clear();
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)}>
      {/* Form fields */}
      <footer>
        {autoSave.state.lastSaved && (
          <small>
            Draft saved {formatDraftTimestamp(autoSave.state.lastSaved)}
          </small>
        )}
      </footer>
    </form>
  );
}
```

## Type Definitions

### Wizard Types

```typescript
interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  fields: string[];
  validate?: () => boolean | Promise<boolean>;
  canSkip?: boolean;
  condition?: (data: Record<string, unknown>) => boolean;
}

interface WizardConfig {
  steps: WizardStep[];
  initialStep?: number;
  allowJumpToStep?: boolean;
  validateOnStepChange?: boolean;
  persistKey?: string;
  onStepChange?: (from: number, to: number) => void;
  onComplete?: (data: Record<string, unknown>) => void | Promise<void>;
}

interface WizardState {
  currentStep: number;
  visitedSteps: Set<number>;
  completedSteps: Set<number>;
  isSubmitting: boolean;
  isValidating: boolean;
  direction: 'forward' | 'backward';
  data: Record<string, unknown>;
}
```

### Mask Types

```typescript
interface MaskConfig {
  pattern: string;
  placeholder?: string;
  guide?: boolean;
  keepCharPositions?: boolean;
  showMaskOnFocus?: boolean;
  showMaskOnHover?: boolean;
}

interface MaskResult {
  maskedValue: string;
  rawValue: string;
  isComplete: boolean;
  isValid: boolean;
}

type MaskChar = string | RegExp;
```

### Auto-Save Types

```typescript
interface AutoSaveConfig {
  key: string;
  debounceMs?: number;
  maxVersions?: number;
  storage?: Storage;
  encrypt?: boolean;
  onSave?: (data: FormDraft) => void;
  onRestore?: (data: FormDraft) => void;
  onConflict?: (local: FormDraft, remote: FormDraft) => FormDraft;
}

interface FormDraft {
  id: string;
  data: Record<string, unknown>;
  timestamp: number;
  version: number;
  checksum: string;
  metadata?: Record<string, unknown>;
}

interface AutoSaveState {
  isDirty: boolean;
  lastSaved: number | null;
  isSaving: boolean;
  hasRecovery: boolean;
  versions: FormDraft[];
}

type ConflictStrategy = 'local' | 'remote' | 'merge' | 'manual';
```

## Related

- [Overview](./overview.md) - Package overview
- [Validation](./validation.md) - Form validation
- [Fields](./fields.md) - Field components
- [API Reference](./api-reference.md) - Complete API
