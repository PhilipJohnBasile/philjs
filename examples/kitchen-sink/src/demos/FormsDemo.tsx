import { signal, memo } from "@philjs/core";

export function FormsDemo() {
  return (
    <div data-test="forms-demo">
      <h2 style="margin: 0 0 1.5rem 0; color: var(--primary);">Forms & Validation</h2>

      <ControlledInputsExample />
      <FormValidationExample />
      <MultiStepFormExample />
    </div>
  );
}

function ControlledInputsExample() {
  const textValue = signal("");
  const numberValue = signal(0);
  const checkboxValue = signal(false);
  const radioValue = signal("option1");
  const selectValue = signal("apple");

  return (
    <div class="card" data-test="controlled-inputs">
      <h3 style="margin: 0 0 1rem 0;">Controlled Inputs</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Text Input:</label>
          <input
            class="input"
            type="text"
            value={textValue}
            onInput={(e) => textValue.set((e.target as HTMLInputElement).value)}
            placeholder="Enter text..."
            data-test="text-input"
          />
          <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">
            Value: <span data-test="text-value">{textValue}</span>
          </p>
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
            Number Input: <span data-test="number-value">{numberValue}</span>
          </label>
          <input
            class="input"
            type="number"
            value={numberValue}
            onInput={(e) => numberValue.set(Number((e.target as HTMLInputElement).value))}
            data-test="number-input"
          />
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <input
            type="checkbox"
            checked={checkboxValue}
            onChange={(e) => checkboxValue.set((e.target as HTMLInputElement).checked)}
            data-test="checkbox-input"
          />
          <label style="font-weight: 600;">
            Checkbox: <span data-test="checkbox-value">{() => (checkboxValue() ? "Checked" : "Unchecked")}</span>
          </label>
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Radio Buttons:</label>
          <div style="display: flex; gap: 1rem;">
            {["option1", "option2", "option3"].map(opt => (
              <label key={opt} style="display: flex; align-items: center; gap: 0.5rem;">
                <input
                  type="radio"
                  name="radio-group"
                  checked={() => radioValue() === opt}
                  onChange={() => radioValue.set(opt)}
                  data-test={`radio-${opt}`}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
          <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">
            Selected: <span data-test="radio-value">{radioValue}</span>
          </p>
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Select:</label>
          <select
            class="input"
            value={selectValue}
            onChange={(e) => selectValue.set((e.target as HTMLSelectElement).value)}
            data-test="select-input"
          >
            <option value="apple">Apple</option>
            <option value="banana">Banana</option>
            <option value="orange">Orange</option>
            <option value="grape">Grape</option>
          </select>
          <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">
            Selected: <span data-test="select-value">{selectValue}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function FormValidationExample() {
  const email = signal("");
  const password = signal("");
  const confirmPassword = signal("");
  const submitted = signal(false);

  const emailValid = memo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email()));
  const passwordValid = memo(() => password().length >= 8);
  const passwordsMatch = memo(() => password() === confirmPassword() && confirmPassword().length > 0);
  const formValid = memo(() => emailValid() && passwordValid() && passwordsMatch());

  const emailTouched = memo(() => email().length > 0);
  const passwordTouched = memo(() => password().length > 0);
  const confirmTouched = memo(() => confirmPassword().length > 0);

  const emailStyle = memo(() => inputStyle(emailValid(), emailTouched()));
  const passwordStyle = memo(() => inputStyle(passwordValid(), passwordTouched()));
  const confirmStyle = memo(() => inputStyle(passwordsMatch(), confirmTouched()));
  const submitDisabled = memo(() => !formValid());
  const submitStyle = memo(() =>
    submitDisabled() ? { opacity: "0.5", cursor: "not-allowed" } : {}
  );

  const inputStyle = (isValid: boolean, touched: boolean) => ({
    ...({
      width: "100%",
      padding: "0.75rem",
      borderRadius: "6px",
      fontSize: "1rem",
      transition: "border-color 0.2s ease",
    }),
    border: `1px solid ${!touched ? "var(--border)" : isValid ? "var(--success)" : "var(--error)"}`,
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (formValid()) {
      submitted.set(true);
      setTimeout(() => {
        email.set("");
        password.set("");
        confirmPassword.set("");
        submitted.set(false);
      }, 3000);
    }
  };

  return (
    <div class="card" data-test="form-validation">
      <h3 style="margin: 0 0 1rem 0;">Form Validation</h3>
      <form onSubmit={handleSubmit} style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email:</label>
          <input
            style={emailStyle}
            type="email"
            value={email}
            onInput={(e) => email.set((e.target as HTMLInputElement).value)}
            placeholder="you@example.com"
            data-test="email-input"
          />
          {() =>
            emailTouched() && !emailValid()
              ? <p style="margin: 0.5rem 0 0 0; color: var(--error); font-size: 0.9rem;" data-test="email-error">
                  Please enter a valid email
                </p>
              : null
          }
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Password (min 8 chars):</label>
          <input
            style={passwordStyle}
            type="password"
            value={password}
            onInput={(e) => password.set((e.target as HTMLInputElement).value)}
            placeholder="********"
            data-test="password-input"
          />
          {() =>
            passwordTouched() && !passwordValid()
              ? <p style="margin: 0.5rem 0 0 0; color: var(--error); font-size: 0.9rem;" data-test="password-error">
                  Password must be at least 8 characters
                </p>
              : null
          }
        </div>

        <div>
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Confirm Password:</label>
          <input
            style={confirmStyle}
            type="password"
            value={confirmPassword}
            onInput={(e) => confirmPassword.set((e.target as HTMLInputElement).value)}
            placeholder="********"
            data-test="confirm-password-input"
          />
          {() =>
            confirmTouched() && !passwordsMatch()
              ? <p style="margin: 0.5rem 0 0 0; color: var(--error); font-size: 0.9rem;" data-test="confirm-error">
                  Passwords don't match
                </p>
              : null
          }
        </div>

        <button
          type="submit"
          class="button"
          disabled={submitDisabled}
          style={submitStyle}
          data-test="submit-button"
        >
          Submit
        </button>

        {() =>
          submitted()
            ? <div style="background: var(--success); color: white; padding: 1rem; border-radius: 6px;" data-test="success-message">
                ✓ Form submitted successfully!
              </div>
            : null
        }
      </form>
    </div>
  );
}

function MultiStepFormExample() {
  const step = signal(1);
  const name = signal("");
  const age = signal("");
  const country = signal("");

  const canProceed = memo(() => {
    if (step() === 1) return name().length > 0;
    if (step() === 2) return age().length > 0 && Number(age()) > 0;
    if (step() === 3) return country().length > 0;
    return false;
  });

  const progressPercent = memo(() => (step() / 3) * 100);
  const progressStyle = memo(() => ({
    background: "var(--primary)",
    height: "100%",
    width: `${progressPercent()}%`,
    transition: "width 0.3s ease",
  }));
  const proceedDisabled = memo(() => !canProceed());
  const proceedStyle = memo(() =>
    proceedDisabled() ? { opacity: "0.5", cursor: "not-allowed" } : {}
  );

  const reset = () => {
    step.set(1);
    name.set("");
    age.set("");
    country.set("");
  };

  return (
    <div class="card" data-test="multi-step-form">
      <h3 style="margin: 0 0 1rem 0;">Multi-Step Form</h3>

      {/* Progress Bar */}
      <div style="background: var(--bg-alt); height: 8px; border-radius: 4px; margin-bottom: 1.5rem; overflow: hidden;">
        <div
          style={progressStyle}
          data-test="progress-bar"
        ></div>
      </div>

      <div style="min-height: 200px;">
        {() => {
          const currentStep = step();
          if (currentStep === 1) {
            return (
              <div data-test="step-1">
                <h4 style="margin: 0 0 1rem 0;">Step 1: Personal Info</h4>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Name:</label>
                <input
                  class="input"
                  value={name}
                  onInput={(e) => name.set((e.target as HTMLInputElement).value)}
                  placeholder="Enter your name"
                  data-test="name-input"
                />
              </div>
            );
          }
          if (currentStep === 2) {
            return (
              <div data-test="step-2">
                <h4 style="margin: 0 0 1rem 0;">Step 2: Demographics</h4>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Age:</label>
                <input
                  class="input"
                  type="number"
                  value={age}
                  onInput={(e) => age.set((e.target as HTMLInputElement).value)}
                  placeholder="Enter your age"
                  data-test="age-input"
                />
              </div>
            );
          }
          if (currentStep === 3) {
            return (
              <div data-test="step-3">
                <h4 style="margin: 0 0 1rem 0;">Step 3: Location</h4>
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Country:</label>
                <input
                  class="input"
                  value={country}
                  onInput={(e) => country.set((e.target as HTMLInputElement).value)}
                  placeholder="Enter your country"
                  data-test="country-input"
                />
              </div>
            );
          }
          if (currentStep === 4) {
            return (
              <div data-test="step-4">
                <h4 style="margin: 0 0 1rem 0;">✓ Complete!</h4>
                <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
                  <p style="margin: 0 0 0.5rem 0;"><strong>Name:</strong> {name}</p>
                  <p style="margin: 0 0 0.5rem 0;"><strong>Age:</strong> {age}</p>
                  <p style="margin: 0;"><strong>Country:</strong> {country}</p>
                </div>
              </div>
            );
          }
          return null;
        }}
      </div>

      <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
        {() => {
          const currentStep = step();
          const buttons: any[] = [];

          if (currentStep > 1 && currentStep < 4) {
            buttons.push(
              <button class="button" onClick={() => step.set(step() - 1)} data-test="prev-button">
                Previous
              </button>
            );
          }

          if (currentStep < 3) {
            buttons.push(
              <button
                class="button"
                onClick={() => step.set(step() + 1)}
                disabled={proceedDisabled}
                style={proceedStyle}
                data-test="next-button"
              >
                Next
              </button>
            );
          } else if (currentStep === 3) {
            buttons.push(
              <button
                class="button"
                onClick={() => step.set(4)}
                disabled={proceedDisabled}
                style={proceedStyle}
                data-test="finish-button"
              >
                Finish
              </button>
            );
          } else if (currentStep === 4) {
            buttons.push(
              <button class="button" onClick={reset} data-test="reset-button">
                Start Over
              </button>
            );
          }

          return buttons;
        }}
      </div>
    </div>
  );
}
