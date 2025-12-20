/**
 * User Profile Route Story
 *
 * Example of a route component story with mock data
 */

import type { Meta, StoryObj } from '../src/index.js';
import { signal } from 'philjs-core';
import { withRouter, withLayout } from '../src/decorators/index.js';
import { createMockLoader } from '../src/mocks/index.js';

// Example User Profile component
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
}

interface UserProfileProps {
  userId?: string;
  loader?: any;
}

function UserProfile(props: UserProfileProps) {
  const { userId = '1', loader } = props;

  // In a real app, this would use the loader data
  const user$ = signal<User>({
    id: userId,
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://via.placeholder.com/150',
    bio: 'Software developer and PhilJS enthusiast.',
  });

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <img
          src={user$().avatar}
          alt={user$().name}
          style={{ width: '80px', height: '80px', borderRadius: '50%' }}
        />
        <div>
          <h1 style={{ margin: '0 0 8px 0' }}>{user$().name}</h1>
          <p style={{ margin: 0, color: '#666' }}>{user$().email}</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2>About</h2>
        <p>{user$().bio}</p>
      </div>

      <div>
        <button
          style={{
            padding: '8px 16px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  );
}

const meta: Meta<typeof UserProfile> = {
  title: 'Routes/UserProfile',
  component: UserProfile,
  tags: ['autodocs'],
  decorators: [withRouter, withLayout],
  parameters: {
    layout: 'fullscreen',
    router: {
      pathname: '/users/[id]',
      params: { id: '1' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserProfile>;

export const Default: Story = {
  args: {
    userId: '1',
  },
};

export const WithDifferentUser: Story = {
  args: {
    userId: '2',
  },
  parameters: {
    router: {
      pathname: '/users/2',
      params: { id: '2' },
    },
  },
};

export const Loading: Story = {
  render: () => {
    const loader = createMockLoader(async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://via.placeholder.com/150',
        bio: 'Software developer and PhilJS enthusiast.',
      };
    });

    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        {loader.loading$() ? <div>Loading user profile...</div> : <UserProfile />}
      </div>
    );
  },
};

export const Error: Story = {
  render: () => {
    return (
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
          }}
        >
          Failed to load user profile
        </div>
      </div>
    );
  },
};
