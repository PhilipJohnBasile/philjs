# Multi-Step Forms

Build wizard-style forms with multiple steps, progress indicators, and state persistence.


## What You'll Learn

- Multi-step form structure
- Step navigation
- Progress indicators
- State persistence
- Validation per step
- Review and submit
- Best practices

## Basic Multi-Step Form

### Simple Wizard

```typescript
import { signal } from '@philjs/core';

interface FormData {
  // Step 1
  name: string;
  email: string;

  // Step 2
  address: string;
  city: string;
  zipCode: string;

  // Step 3
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

function MultiStepForm() {
  const currentStep = signal(1);
  const formData = signal<FormData>({
    name: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    formData.set({ ...formData(), [field]: value });
  };

  const nextStep = () => {
    if (currentStep() < 3) {
      currentStep.set(currentStep() + 1);
    }
  };

  const prevStep = () => {
    if (currentStep() > 1) {
      currentStep.set(currentStep() - 1);
    }
  };

  const handleSubmit = async () => {
    // Submit final form
    await submitOrder(formData());
  };

  return (
    <div className="wizard">
      <ProgressBar currentStep={currentStep()} totalSteps={3} />

      {currentStep() === 1 && (
        <Step1
          data={formData()}
          updateField={updateField}
          onNext={nextStep}
        />
      )}

      {currentStep() === 2 && (
        <Step2
          data={formData()}
          updateField={updateField}
          onNext={nextStep}
          onPrev={prevStep}
        />
      )}

      {currentStep() === 3 && (
        <Step3
          data={formData()}
          updateField={updateField}
          onSubmit={handleSubmit}
          onPrev={prevStep}
        />
      )}
    </div>
  );
}
```

### Step Components

```typescript
// Step 1: Personal Info
function Step1({ data, updateField, onNext }: {
  data: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  onNext: () => void;
}) {
  const errors = signal<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.name) newErrors.name = 'Name is required';
    if (!data.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(data.email)) {
      newErrors.email = 'Invalid email';
    }

    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="step">
      <h2>Personal Information</h2>

      <div>
        <label>Name</label>
        <input
          type="text"
          value={data.name}
          onInput={(e) => updateField('name', e.target.value)}
        />
        {errors().name && <span className="error">{errors().name}</span>}
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          value={data.email}
          onInput={(e) => updateField('email', e.target.value)}
        />
        {errors().email && <span className="error">{errors().email}</span>}
      </div>

      <button onClick={handleNext}>Next</button>
    </div>
  );
}

// Step 2: Address
function Step2({ data, updateField, onNext, onPrev }: {
  data: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const errors = signal<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.address) newErrors.address = 'Address is required';
    if (!data.city) newErrors.city = 'City is required';
    if (!data.zipCode) newErrors.zipCode = 'ZIP code is required';

    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="step">
      <h2>Shipping Address</h2>

      <div>
        <label>Address</label>
        <input
          type="text"
          value={data.address}
          onInput={(e) => updateField('address', e.target.value)}
        />
        {errors().address && <span className="error">{errors().address}</span>}
      </div>

      <div>
        <label>City</label>
        <input
          type="text"
          value={data.city}
          onInput={(e) => updateField('city', e.target.value)}
        />
        {errors().city && <span className="error">{errors().city}</span>}
      </div>

      <div>
        <label>ZIP Code</label>
        <input
          type="text"
          value={data.zipCode}
          onInput={(e) => updateField('zipCode', e.target.value)}
        />
        {errors().zipCode && <span className="error">{errors().zipCode}</span>}
      </div>

      <div className="actions">
        <button onClick={onPrev}>Back</button>
        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
}

// Step 3: Payment
function Step3({ data, updateField, onSubmit, onPrev }: {
  data: FormData;
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  onSubmit: () => void;
  onPrev: () => void;
}) {
  const errors = signal<Record<string, string>>({});
  const submitting = signal(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!data.cardNumber) newErrors.cardNumber = 'Card number is required';
    if (!data.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!data.cvv) newErrors.cvv = 'CVV is required';

    errors.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    submitting.set(true);
    await onSubmit();
    submitting.set(false);
  };

  return (
    <div className="step">
      <h2>Payment Information</h2>

      <div>
        <label>Card Number</label>
        <input
          type="text"
          value={data.cardNumber}
          onInput={(e) => updateField('cardNumber', e.target.value)}
          disabled={submitting()}
        />
        {errors().cardNumber && <span className="error">{errors().cardNumber}</span>}
      </div>

      <div>
        <label>Expiry Date</label>
        <input
          type="text"
          value={data.expiryDate}
          onInput={(e) => updateField('expiryDate', e.target.value)}
          disabled={submitting()}
          placeholder="MM/YY"
        />
        {errors().expiryDate && <span className="error">{errors().expiryDate}</span>}
      </div>

      <div>
        <label>CVV</label>
        <input
          type="text"
          value={data.cvv}
          onInput={(e) => updateField('cvv', e.target.value)}
          disabled={submitting()}
        />
        {errors().cvv && <span className="error">{errors().cvv}</span>}
      </div>

      <div className="actions">
        <button onClick={onPrev} disabled={submitting()}>
          Back
        </button>
        <button onClick={handleSubmit} disabled={submitting()}>
          {submitting() ? 'Processing...' : 'Submit Order'}
        </button>
      </div>
    </div>
  );
}
```

## Progress Indicators

### Progress Bar

```typescript
function ProgressBar({ currentStep, totalSteps }: {
  currentStep: number;
  totalSteps: number;
}) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${progress}%` }} />
      <div className="progress-text">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
}
```

### Step Indicators

```typescript
function StepIndicator({ steps, currentStep }: {
  steps: string[];
  currentStep: number;
}) {
  return (
    <div className="step-indicator">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div
            key={stepNumber}
            className={`step ${isCurrent ? 'current' : ''} ${isComplete ? 'complete' : ''}`}
          >
            <div className="step-number">
              {isComplete ? '✓' : stepNumber}
            </div>
            <div className="step-label">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

// Usage
<StepIndicator
  steps={['Personal Info', 'Address', 'Payment']}
  currentStep={currentStep()}
/>
```

## State Persistence

### LocalStorage Persistence

```typescript
function PersistentMultiStepForm() {
  const STORAGE_KEY = 'multiStepFormData';

  // Load from localStorage on mount
  const loadSavedData = (): FormData => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      name: '',
      email: '',
      address: '',
      city: '',
      zipCode: '',
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    };
  };

  const formData = signal<FormData>(loadSavedData());
  const currentStep = signal(1);

  // Save to localStorage on every change
  effect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData()));
  });

  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSubmit = async () => {
    await submitOrder(formData());

    // Clear saved data after successful submission
    clearSavedData();
  };

  return (
    <div className="wizard">
      {/* Wizard steps */}
    </div>
  );
}
```

### URL State Persistence

```typescript
import { useSearchParams } from '@philjs/router';

function URLPersistedWizard() {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStep = signal(
    parseInt(searchParams.get('step') || '1')
  );

  const goToStep = (step: number) => {
    currentStep.set(step);
    setSearchParams({ step: step.toString() });
  };

  return (
    <div className="wizard">
      <StepIndicator
        steps={['Info', 'Address', 'Payment']}
        currentStep={currentStep()}
      />

      {/* Step content */}
    </div>
  );
}
```

## Review Step

### Summary Before Submit

```typescript
function ReviewStep({ data, onEdit, onSubmit }: {
  data: FormData;
  onEdit: (step: number) => void;
  onSubmit: () => void;
}) {
  const submitting = signal(false);

  const handleSubmit = async () => {
    submitting.set(true);
    await onSubmit();
    submitting.set(false);
  };

  return (
    <div className="review-step">
      <h2>Review Your Information</h2>

      <section className="review-section">
        <div className="section-header">
          <h3>Personal Information</h3>
          <button onClick={() => onEdit(1)}>Edit</button>
        </div>
        <dl>
          <dt>Name:</dt>
          <dd>{data.name}</dd>
          <dt>Email:</dt>
          <dd>{data.email}</dd>
        </dl>
      </section>

      <section className="review-section">
        <div className="section-header">
          <h3>Shipping Address</h3>
          <button onClick={() => onEdit(2)}>Edit</button>
        </div>
        <dl>
          <dt>Address:</dt>
          <dd>{data.address}</dd>
          <dt>City:</dt>
          <dd>{data.city}</dd>
          <dt>ZIP Code:</dt>
          <dd>{data.zipCode}</dd>
        </dl>
      </section>

      <section className="review-section">
        <div className="section-header">
          <h3>Payment Method</h3>
          <button onClick={() => onEdit(3)}>Edit</button>
        </div>
        <dl>
          <dt>Card:</dt>
          <dd>**** **** **** {data.cardNumber.slice(-4)}</dd>
          <dt>Expires:</dt>
          <dd>{data.expiryDate}</dd>
        </dl>
      </section>

      <button
        className="submit-button"
        onClick={handleSubmit}
        disabled={submitting()}
      >
        {submitting() ? 'Processing...' : 'Confirm and Submit'}
      </button>
    </div>
  );
}
```

## Conditional Steps

### Dynamic Step Flow

```typescript
interface WizardData {
  accountType: 'personal' | 'business';
  name: string;
  email: string;
  // Business-only fields
  companyName?: string;
  taxId?: string;
}

function ConditionalWizard() {
  const formData = signal<WizardData>({
    accountType: 'personal',
    name: '',
    email: ''
  });

  const currentStep = signal(1);

  const getSteps = () => {
    const baseSteps = [
      { id: 1, label: 'Account Type', component: AccountTypeStep },
      { id: 2, label: 'Personal Info', component: PersonalInfoStep }
    ];

    // Add business step if business account
    if (formData().accountType === 'business') {
      baseSteps.push({
        id: 3,
        label: 'Business Info',
        component: BusinessInfoStep
      });
    }

    baseSteps.push({
      id: baseSteps.length + 1,
      label: 'Review',
      component: ReviewStep
    });

    return baseSteps;
  };

  const steps = memo(() => getSteps());

  const nextStep = () => {
    if (currentStep() < steps().length) {
      currentStep.set(currentStep() + 1);
    }
  };

  const CurrentStepComponent = memo(() => {
    const step = steps().find(s => s.id === currentStep());
    return step?.component || null;
  });

  return (
    <div className="wizard">
      <StepIndicator
        steps={steps().map(s => s.label)}
        currentStep={currentStep()}
      />

      <CurrentStepComponent
        data={formData()}
        updateField={(field, value) => {
          formData.set({ ...formData(), [field]: value });
        }}
        onNext={nextStep}
      />
    </div>
  );
}
```

## Validation Strategies

### Per-Step Validation

```typescript
interface StepValidation {
  validate: (data: FormData) => Record<string, string>;
}

const stepValidations: Record<number, StepValidation> = {
  1: {
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.name) errors.name = 'Name is required';
      if (!data.email) errors.email = 'Email is required';
      return errors;
    }
  },
  2: {
    validate: (data) => {
      const errors: Record<string, string> = {};
      if (!data.address) errors.address = 'Address is required';
      if (!data.city) errors.city = 'City is required';
      return errors;
    }
  }
};

function ValidatedWizard() {
  const formData = signal<FormData>({/* ... */});
  const currentStep = signal(1);
  const errors = signal<Record<string, string>>({});

  const validateCurrentStep = (): boolean => {
    const validation = stepValidations[currentStep()];
    if (!validation) return true;

    const stepErrors = validation.validate(formData());
    errors.set(stepErrors);

    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      currentStep.set(currentStep() + 1);
      errors.set({}); // Clear errors for next step
    }
  };

  return (
    <div className="wizard">
      {/* Step content with errors() displayed */}
    </div>
  );
}
```

### Prevent Navigation with Errors

```typescript
function StrictWizard() {
  const canProceed = signal(false);
  const canGoBack = signal(true);

  const updateValidationState = () => {
    const validation = stepValidations[currentStep()];
    const stepErrors = validation.validate(formData());

    canProceed.set(Object.keys(stepErrors).length === 0);
  };

  // Update validation state on field changes
  effect(() => {
    updateValidationState();
  });

  return (
    <div className="wizard">
      {/* Step content */}

      <div className="actions">
        <button
          onClick={prevStep}
          disabled={!canGoBack()}
        >
          Back
        </button>

        <button
          onClick={nextStep}
          disabled={!canProceed()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

## Animations

### Step Transitions

```typescript
import { animate } from '@philjs/core';

function AnimatedWizard() {
  const currentStep = signal(1);
  const direction = signal<'forward' | 'backward'>('forward');

  const nextStep = () => {
    direction.set('forward');
    currentStep.set(currentStep() + 1);
  };

  const prevStep = () => {
    direction.set('backward');
    currentStep.set(currentStep() - 1);
  };

  return (
    <div className="wizard">
      <div
        className={`step-container ${direction()}`}
        key={currentStep()}
      >
        {currentStep() === 1 && <Step1 />}
        {currentStep() === 2 && <Step2 />}
        {currentStep() === 3 && <Step3 />}
      </div>
    </div>
  );
}

// CSS
/*
.step-container {
  animation: slideIn 0.3s ease-out;
}

.step-container.forward {
  animation: slideInRight 0.3s ease-out;
}

.step-container.backward {
  animation: slideInLeft 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
*/
```

## Best Practices

### Save Progress Automatically

```typescript
// ✅ Auto-save every change
effect(() => {
  localStorage.setItem('formData', JSON.stringify(formData()));
});

// ❌ Only save on submit (user loses progress)
```

### Show Clear Progress

```typescript
// ✅ Visual progress indicator
<ProgressBar currentStep={currentStep()} totalSteps={3} />
<StepIndicator steps={['Info', 'Address', 'Payment']} />

// ❌ No indication of progress
```

### Validate Per Step

```typescript
// ✅ Validate before allowing next step
const nextStep = () => {
  if (validateCurrentStep()) {
    currentStep.set(currentStep() + 1);
  }
};

// ❌ Only validate on final submit
```

### Allow Back Navigation

```typescript
// ✅ Always allow going back
<button onClick={prevStep}>Back</button>

// ❌ Trap users in current step
```

### Preserve Field Values

```typescript
// ✅ Keep all form data in state
const formData = signal<FormData>({ /* all fields */ });

// ❌ Lose data when switching steps
```

### Show Review Step

```typescript
// ✅ Let users review before submit
<ReviewStep data={formData()} onEdit={goToStep} />

// ❌ Submit without review
```

## Summary

You've learned:

✅ Multi-step form structure
✅ Step navigation and progress indicators
✅ State persistence (localStorage, URL)
✅ Per-step validation
✅ Review step before submission
✅ Conditional steps
✅ Step transitions and animations
✅ Best practices for wizards

Multi-step forms improve UX for complex data entry!

---

**Next:** [File Uploads →](./file-uploads.md) Handle file uploads with preview and validation
