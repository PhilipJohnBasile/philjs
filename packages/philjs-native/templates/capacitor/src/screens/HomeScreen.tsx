/**
 * Home Screen
 */

import { signal } from 'philjs-core';
import {
  useDevice,
  useNetwork,
  useBattery,
  useOrientation,
  takePhoto,
  getCurrentPosition,
  impact,
} from 'philjs-native';

// Local state
const photoUri = signal<string | null>(null);
const location = signal<{ lat: number; lng: number } | null>(null);
const isLoading = signal(false);

/**
 * Home Screen component
 */
export function HomeScreen() {
  const device = useDevice();
  const network = useNetwork();
  const battery = useBattery();
  const orientation = useOrientation();

  const handleTakePhoto = async () => {
    isLoading.set(true);
    try {
      const result = await takePhoto({
        quality: 80,
        width: 800,
        height: 600,
        source: 'prompt',
      });
      if (result) {
        photoUri.set(result.webPath || result.base64);
        await impact('medium');
      }
    } catch (error) {
      console.error('Photo failed:', error);
    } finally {
      isLoading.set(false);
    }
  };

  const handleGetLocation = async () => {
    isLoading.set(true);
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
      });
      location.set({
        lat: position.latitude,
        lng: position.longitude,
      });
      await impact('light');
    } catch (error) {
      console.error('Location failed:', error);
    } finally {
      isLoading.set(false);
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Welcome</h1>

      {/* Device Info Card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Device Info</h2>
        <InfoRow label="Platform" value={device.platform} />
        <InfoRow label="Model" value={device.model} />
        <InfoRow label="OS Version" value={device.osVersion} />
        <InfoRow label="Orientation" value={orientation.type} />
      </div>

      {/* Network Status Card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Network</h2>
        <InfoRow
          label="Status"
          value={network.isOnline ? 'Online' : 'Offline'}
          valueColor={network.isOnline ? '#34c759' : '#ff3b30'}
        />
        <InfoRow label="Type" value={network.connectionType} />
        {network.effectiveType && (
          <InfoRow label="Speed" value={network.effectiveType} />
        )}
      </div>

      {/* Battery Card */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Battery</h2>
        <InfoRow
          label="Level"
          value={`${battery.percentage}%`}
          valueColor={battery.percentage > 20 ? '#34c759' : '#ff3b30'}
        />
        <InfoRow
          label="Charging"
          value={battery.isCharging ? 'Yes' : 'No'}
        />
      </div>

      {/* Actions */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Actions</h2>

        <button
          onClick={handleTakePhoto}
          disabled={isLoading()}
          style={buttonStyle}
        >
          {isLoading() ? 'Loading...' : 'Take Photo'}
        </button>

        {photoUri() && (
          <img
            src={photoUri()!}
            alt="Captured"
            style={{
              width: '100%',
              borderRadius: '8px',
              marginTop: '12px',
            }}
          />
        )}

        <button
          onClick={handleGetLocation}
          disabled={isLoading()}
          style={{ ...buttonStyle, marginTop: '12px' }}
        >
          {isLoading() ? 'Loading...' : 'Get Location'}
        </button>

        {location() && (
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
            Lat: {location()!.lat.toFixed(6)}, Lng: {location()!.lng.toFixed(6)}
          </p>
        )}
      </div>
    </div>
  );
}

// Info row component
function InfoRow({
  label,
  value,
  valueColor = '#000',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #eee',
    }}>
      <span style={{ color: '#666' }}>{label}</span>
      <span style={{ color: valueColor, fontWeight: 500 }}>{value}</span>
    </div>
  );
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

export default HomeScreen;
