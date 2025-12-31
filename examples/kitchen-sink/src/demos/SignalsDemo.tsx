import { signal, memo, effect, batch, untrack, onCleanup } from "@philjs/core";

export function SignalsDemo() {
  return (
    <div data-test="signals-demo">
      <h2 style="margin: 0 0 1.5rem 0; color: var(--primary);">Signals & Reactivity</h2>

      <BasicSignalsExample />
      <MemosExample />
      <EffectsExample />
      <BatchUpdatesExample />
      <UntrackExample />
    </div>
  );
}

function BasicSignalsExample() {
  const count = signal(0);
  const name = signal("PhilJS");

  return (
    <div class="card" data-test="basic-signals">
      <h3 style="margin: 0 0 1rem 0;">Basic Signals</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <p style="margin: 0 0 0.5rem 0;">Count: <strong data-test="count-value">{count}</strong></p>
          <div style="display: flex; gap: 0.5rem;">
            <button class="button" onClick={() => count.set(count() + 1)} data-test="increment">
              Increment
            </button>
            <button class="button" onClick={() => count.set(count() - 1)} data-test="decrement">
              Decrement
            </button>
            <button class="button" onClick={() => count.set(0)} data-test="reset">
              Reset
            </button>
          </div>
        </div>

        <div>
          <p style="margin: 0 0 0.5rem 0;">Name: <strong data-test="name-value">{name}</strong></p>
          <input
            class="input"
            value={name}
            onInput={(e) => name.set((e.target as HTMLInputElement).value)}
            placeholder="Enter name..."
            data-test="name-input"
          />
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <code>const count = signal(0)</code>
        </div>
      </div>
    </div>
  );
}

function MemosExample() {
  const firstName = signal("John");
  const lastName = signal("Doe");
  const age = signal(30);

  const fullName = memo(() => `${firstName()} ${lastName()}`);
  const greeting = memo(() => `Hello, ${fullName()}!`);
  const canVote = memo(() => age() >= 18);
  const ageGroup = memo(() => {
    const a = age();
    if (a < 18) return "Minor";
    if (a < 65) return "Adult";
    return "Senior";
  });

  return (
    <div class="card" data-test="memos">
      <h3 style="margin: 0 0 1rem 0;">Computed Values (Memos)</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <input
            class="input"
            value={firstName}
            onInput={(e) => firstName.set((e.target as HTMLInputElement).value)}
            placeholder="First name"
            data-test="first-name"
          />
          <input
            class="input"
            value={lastName}
            onInput={(e) => lastName.set((e.target as HTMLInputElement).value)}
            placeholder="Last name"
            data-test="last-name"
          />
        </div>

        <div>
          <p style="margin: 0 0 0.5rem 0;">Age: <strong data-test="age-value">{age}</strong></p>
          <input
            type="range"
            min="0"
            max="100"
            value={age}
            onInput={(e) => age.set(Number((e.target as HTMLInputElement).value))}
            style="width: 100%;"
            data-test="age-slider"
          />
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <p style="margin: 0 0 0.5rem 0;"><strong>Full Name:</strong> <span data-test="full-name">{fullName}</span></p>
          <p style="margin: 0 0 0.5rem 0;"><strong>Greeting:</strong> <span data-test="greeting">{greeting}</span></p>
          <p style="margin: 0 0 0.5rem 0;"><strong>Can Vote:</strong> <span data-test="can-vote">{() => (canVote() ? "Yes" : "No")}</span></p>
          <p style="margin: 0;"><strong>Age Group:</strong> <span data-test="age-group">{ageGroup}</span></p>
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <code>{"const fullName = memo(() => `${firstName()} ${lastName()}`)"}</code>
        </div>
      </div>
    </div>
  );
}

function EffectsExample() {
  const enabled = signal(true);
  const counter = signal(0);
  const log = signal<string[]>([]);

  // Effect with cleanup
  effect(() => {
    if (!enabled()) return;

    const interval = setInterval(() => {
      counter.set(c => c + 1);
      log.set(l => [...l.slice(-4), `Tick at ${new Date().toLocaleTimeString()}`]);
    }, 1000);

    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return (
    <div class="card" data-test="effects">
      <h3 style="margin: 0 0 1rem 0;">Effects & Side Effects</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <button
            class="button"
            onClick={() => enabled.set(!enabled())}
            data-test="toggle-effect"
          >
            {() => `${enabled() ? "Stop" : "Start"} Counter`}
          </button>
          <span data-test="effect-counter">Counter: <strong>{counter}</strong></span>
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px; max-height: 150px; overflow-y: auto;">
          <strong>Effect Log:</strong>
          <div style="margin-top: 0.5rem;" data-test="effect-log">
            {() => {
              const entries = log();
              if (entries.length === 0) {
                return <p style="margin: 0; color: var(--text-secondary);">No events yet...</p>;
              }
              return entries.map((entry, i) => (
                <p key={i} style="margin: 0.25rem 0; font-size: 0.9rem;">{entry}</p>
              ));
            }}
          </div>
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <code>{"effect(() => { /* side effect */ });"}</code>
        </div>
      </div>
    </div>
  );
}

function BatchUpdatesExample() {
  const x = signal(0);
  const y = signal(0);
  const z = signal(0);
  const updateCount = signal(0);

  const sum = memo(() => {
    updateCount.set(c => c + 1);
    return x() + y() + z();
  });

  const updateIndividually = () => {
    x.set(x() + 1);
    y.set(y() + 1);
    z.set(z() + 1);
  };

  const updateBatched = () => {
    batch(() => {
      x.set(x() + 1);
      y.set(y() + 1);
      z.set(z() + 1);
    });
  };

  return (
    <div class="card" data-test="batch">
      <h3 style="margin: 0 0 1rem 0;">Batch Updates</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;">
          <div>
            <strong>X:</strong> <span data-test="batch-x">{x}</span>
          </div>
          <div>
            <strong>Y:</strong> <span data-test="batch-y">{y}</span>
          </div>
          <div>
            <strong>Z:</strong> <span data-test="batch-z">{z}</span>
          </div>
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <p style="margin: 0 0 0.5rem 0;"><strong>Sum:</strong> <span data-test="batch-sum">{sum}</span></p>
          <p style="margin: 0;"><strong>Memo Evaluations:</strong> <span data-test="update-count">{updateCount}</span></p>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="button" onClick={updateIndividually} data-test="update-individual">
            Update Individually (3 evaluations)
          </button>
          <button class="button" onClick={updateBatched} data-test="update-batched">
            Update Batched (1 evaluation)
          </button>
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <code>{"batch(() => { x.set(1); y.set(2); });"}</code>
        </div>
      </div>
    </div>
  );
}

function UntrackExample() {
  const tracked = signal(0);
  const untracked = signal(0);
  const effectCount = signal(0);

  effect(() => {
    effectCount.set(c => c + 1);
    tracked(); // This is tracked
    untrack(() => untracked()); // This is NOT tracked
  });

  return (
    <div class="card" data-test="untrack">
      <h3 style="margin: 0 0 1rem 0;">Untrack Reads</h3>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <p style="margin: 0 0 0.5rem 0;"><strong>Tracked:</strong> <span data-test="tracked-value">{tracked}</span></p>
            <button class="button" onClick={() => tracked.set(tracked() + 1)} data-test="update-tracked">
              Update Tracked
            </button>
          </div>
          <div>
            <p style="margin: 0 0 0.5rem 0;"><strong>Untracked:</strong> <span data-test="untracked-value">{untracked}</span></p>
            <button class="button" onClick={() => untracked.set(untracked() + 1)} data-test="update-untracked">
              Update Untracked
            </button>
          </div>
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <p style="margin: 0;"><strong>Effect Executions:</strong> <span data-test="effect-count">{effectCount}</span></p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">
            Effect only re-runs when tracked signal changes
          </p>
        </div>

        <div style="background: var(--bg-alt); padding: 1rem; border-radius: 6px;">
          <code>{"untrack(() => signal())"}</code>
        </div>
      </div>
    </div>
  );
}
