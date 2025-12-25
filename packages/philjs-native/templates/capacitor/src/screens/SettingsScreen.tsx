/**
 * Settings Screen
 */

import { signal } from 'philjs-core';
import {
  Modal,
  useAppState,
  impact,
  notification,
  clearStorage,
} from 'philjs-native';

// Local state
const showModal = signal(false);
const darkMode = signal(false);
const notificationsEnabled = signal(true);
const hapticFeedback = signal(true);

/**
 * Settings Screen component
 */
export function SettingsScreen() {
  const appState = useAppState();

  const handleToggle = async (
    setting: 'darkMode' | 'notifications' | 'haptic',
    value: boolean
  ) => {
    switch (setting) {
      case 'darkMode':
        darkMode.set(value);
        break;
      case 'notifications':
        notificationsEnabled.set(value);
        break;
      case 'haptic':
        hapticFeedback.set(value);
        break;
    }

    if (hapticFeedback()) {
      await impact('light');
    }
  };

  const handleClearData = async () => {
    showModal.set(true);
  };

  const confirmClearData = async () => {
    try {
      await clearStorage();
      await notification('success');
      showModal.set(false);
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Settings</h1>

      {/* App State Info */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>App State</h2>
        <InfoRow label="State" value={appState.state} />
        <InfoRow label="Active Time" value={formatTime(appState.activeTime)} />
        <InfoRow label="Background Count" value={String(appState.backgroundCount)} />
      </div>

      {/* Appearance */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Appearance</h2>
        <ToggleRow
          label="Dark Mode"
          value={darkMode()}
          onChange={(v) => handleToggle('darkMode', v)}
        />
      </div>

      {/* Notifications */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Notifications</h2>
        <ToggleRow
          label="Push Notifications"
          value={notificationsEnabled()}
          onChange={(v) => handleToggle('notifications', v)}
        />
      </div>

      {/* Feedback */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Feedback</h2>
        <ToggleRow
          label="Haptic Feedback"
          value={hapticFeedback()}
          onChange={(v) => handleToggle('haptic', v)}
        />
      </div>

      {/* Data */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Data</h2>
        <button
          onClick={handleClearData}
          style={{
            ...buttonStyle,
            backgroundColor: '#ff3b30',
          }}
        >
          Clear All Data
        </button>
      </div>

      {/* About */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>About</h2>
        <InfoRow label="Version" value="1.0.0" />
        <InfoRow label="Build" value="1" />
        <InfoRow label="Framework" value="PhilJS" />
      </div>

      {/* Confirm Modal */}
      <Modal
        visible={showModal()}
        onClose={() => showModal.set(false)}
        title="Clear Data"
        presentationStyle="formSheet"
      >
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Are you sure you want to clear all app data? This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => showModal.set(false)}
              style={{
                ...buttonStyle,
                flex: 1,
                backgroundColor: '#e5e5ea',
                color: '#000',
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmClearData}
              style={{
                ...buttonStyle,
                flex: 1,
                backgroundColor: '#ff3b30',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Info row component
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid #eee',
    }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

// Toggle row component
function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #eee',
    }}>
      <span style={{ color: '#000' }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: '51px',
          height: '31px',
          borderRadius: '16px',
          border: 'none',
          backgroundColor: value ? '#34c759' : '#e5e5ea',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        <div
          style={{
            width: '27px',
            height: '27px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            position: 'absolute',
            top: '2px',
            left: value ? '22px' : '2px',
            transition: 'left 0.2s',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  );
}

// Format time helper
function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

// Styles
const cardStyle: Record<string, string> = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

const cardTitleStyle: Record<string, string> = {
  fontSize: '18px',
  fontWeight: '600',
  marginBottom: '12px',
};

const buttonStyle: Record<string, string> = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#007aff',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
};

export default SettingsScreen;
