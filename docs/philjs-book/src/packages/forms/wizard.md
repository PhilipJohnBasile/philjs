# Form Wizard

Multi-step forms ("Wizards") are notoriously difficult to build. State management, validation between steps, backward navigation, and persistence can lead to spaghetti code. `@philjs/forms` provides a dedicated `useWizard` primitive to solve this.

## Features

- **Step Management**: Navigation, skipping, completion tracking.
- **Conditional Steps**: Show/hide steps based on previous answers.
- **Persistence**: Auto-save progress to `localStorage`.
- **Validation**: Per-step Zod validation.
- **Templates**: Pre-built configurations for Checkout, Signup, etc.

## Basic Usage

The `useWizard` hook takes a configuration object and returns a controller.

```tsx
import { useWizard } from '@philjs/forms';

const wizard = useWizard({
  initialStep: 0,
  persistKey: 'onboarding_flow',
  steps: [
    {
      id: 'account',
      title: 'Account',
      fields: ['email', 'password'],
      validate: () => validateAccount(formData) // Return Promise<boolean>
    },
    {
      id: 'profile',
      title: 'Profile',
      fields: ['bio', 'avatar'],
      canSkip: true
    },
    {
      id: 'confirm',
      title: 'Confirmation',
      fields: []
    }
  ],
  onComplete: async (data) => {
    await api.submit(data);
  }
});
```

## Controlling the Wizard

The returned `controller` object provides everything you need to build the UI:

```tsx
function WizardUI({ wizard }) {
  return (
    <div>
      {/* Progress Bar */}
      <div className="progress">
        <div style={{ width: `${wizard.progress}%` }} />
      </div>

      {/* Current Step Content */}
      <h2 >{wizard.currentStepData.title}</h2>
      
      {/* Navigation */}
      <div className="actions">
        <button 
          onClick={wizard.prevStep} 
          disabled={!wizard.canGoPrev}
        >
          Back
        </button>

        <button onClick={wizard.nextStep}>
          {wizard.isLastStep ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
}
```

## Pre-Built Templates

For common use cases, use one of the factory functions to generate a config.

```typescript
import { createCheckoutWizard, createSignupWizard } from '@philjs/forms';

// Create a standard ecommerce checkout
const checkoutConfig = createCheckoutWizard({
  hasShipping: true,
  hasBilling: true,
  onComplete: submitOrder
});

const wizard = useWizard(checkoutConfig);
```

## Advanced Logic

### Conditional Steps

Steps can be dynamically hidden based on data from previous steps.

```typescript
{
  id: 'billing_address',
  title: 'Billing Address',
  // Only show if user unchecked "Same as shipping"
  condition: (data) => data.useShippingForBilling === false
}
```

### Persistence

By providing a `persistKey`, the wizard automatically saves its state to `localStorage`. If the user accidentally closes the tab, they can resume exactly where they left off.

```typescript
useWizard({
  persistKey: 'user_registration_v1',
  // ...
});
```
