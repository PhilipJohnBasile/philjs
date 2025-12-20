/**
 * Contact Form Story
 *
 * Example of a form component story with interactions
 */

import type { Meta, StoryObj } from '../src/index.js';
import { signal } from 'philjs-core';
import { withLayout } from '../src/decorators/index.js';
import { within, userEvent, expect } from '@storybook/test';

// Example Contact Form component
interface FormData {
  name: string;
  email: string;
  message: string;
}

interface ContactFormProps {
  onSubmit?: (data: FormData) => void;
}

function ContactForm(props: ContactFormProps) {
  const { onSubmit } = props;

  const name$ = signal('');
  const email$ = signal('');
  const message$ = signal('');
  const errors$ = signal<Partial<FormData>>({});
  const submitting$ = signal(false);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!name$()) {
      newErrors.name = 'Name is required';
    }

    if (!email$()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email$())) {
      newErrors.email = 'Invalid email address';
    }

    if (!message$()) {
      newErrors.message = 'Message is required';
    }

    errors$.set(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    submitting$.set(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const data: FormData = {
        name: name$(),
        email: email$(),
        message: message$(),
      };

      onSubmit?.(data);

      // Reset form
      name$.set('');
      email$.set('');
      message$.set('');
      errors$.set({});
    } finally {
      submitting$.set(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  };

  const errorStyle = {
    color: '#d32f2f',
    fontSize: '12px',
    marginTop: '4px',
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Name
        </label>
        <input
          type="text"
          value={name$()}
          onInput={(e: any) => name$.set(e.target.value)}
          style={{
            ...inputStyle,
            borderColor: errors$().name ? '#d32f2f' : '#ccc',
          }}
          aria-label="Name"
        />
        {errors$().name && <div style={errorStyle}>{errors$().name}</div>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Email
        </label>
        <input
          type="email"
          value={email$()}
          onInput={(e: any) => email$.set(e.target.value)}
          style={{
            ...inputStyle,
            borderColor: errors$().email ? '#d32f2f' : '#ccc',
          }}
          aria-label="Email"
        />
        {errors$().email && <div style={errorStyle}>{errors$().email}</div>}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
          Message
        </label>
        <textarea
          value={message$()}
          onInput={(e: any) => message$.set(e.target.value)}
          rows={5}
          style={{
            ...inputStyle,
            borderColor: errors$().message ? '#d32f2f' : '#ccc',
            resize: 'vertical',
          }}
          aria-label="Message"
        />
        {errors$().message && <div style={errorStyle}>{errors$().message}</div>}
      </div>

      <button
        type="submit"
        disabled={submitting$()}
        style={{
          padding: '12px 24px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: submitting$() ? 'not-allowed' : 'pointer',
          opacity: submitting$() ? 0.6 : 1,
        }}
      >
        {submitting$() ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}

const meta: Meta<typeof ContactForm> = {
  title: 'Forms/ContactForm',
  component: ContactForm,
  tags: ['autodocs'],
  decorators: [withLayout],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ContactForm>;

export const Default: Story = {
  args: {
    onSubmit: (data) => {
      console.log('Form submitted:', data);
    },
  },
};

export const FilledForm: Story = {
  args: {
    onSubmit: (data) => {
      console.log('Form submitted:', data);
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Name'), 'John Doe');
    await userEvent.type(canvas.getByLabelText('Email'), 'john@example.com');
    await userEvent.type(canvas.getByLabelText('Message'), 'Hello, this is a test message!');
  },
};

export const WithValidationErrors: Story = {
  args: {
    onSubmit: (data) => {
      console.log('Form submitted:', data);
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Try to submit empty form
    const submitButton = canvas.getByRole('button', { name: /send message/i });
    await userEvent.click(submitButton);

    // Validation errors should appear
    await expect(canvas.getByText(/name is required/i)).toBeInTheDocument();
    await expect(canvas.getByText(/email is required/i)).toBeInTheDocument();
    await expect(canvas.getByText(/message is required/i)).toBeInTheDocument();
  },
};

export const InvalidEmail: Story = {
  args: {
    onSubmit: (data) => {
      console.log('Form submitted:', data);
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Name'), 'John Doe');
    await userEvent.type(canvas.getByLabelText('Email'), 'invalid-email');
    await userEvent.type(canvas.getByLabelText('Message'), 'Test message');

    const submitButton = canvas.getByRole('button', { name: /send message/i });
    await userEvent.click(submitButton);

    await expect(canvas.getByText(/invalid email address/i)).toBeInTheDocument();
  },
};

export const Submitting: Story = {
  args: {
    onSubmit: async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log('Form submitted:', data);
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Name'), 'John Doe');
    await userEvent.type(canvas.getByLabelText('Email'), 'john@example.com');
    await userEvent.type(canvas.getByLabelText('Message'), 'Test message');

    const submitButton = canvas.getByRole('button', { name: /send message/i });
    await userEvent.click(submitButton);
  },
};
