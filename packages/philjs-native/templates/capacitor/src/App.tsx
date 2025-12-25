/**
 * PhilJS Capacitor App - Root Component
 */

import { signal } from 'philjs-core';
import {
  SafeAreaView,
  StatusBar,
  NavigationBar,
  TabBar,
} from 'philjs-native';
import {
  useDevice,
  useNetwork,
  useBattery,
  useAppState,
} from 'philjs-native';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';

// Tab state
const activeTab = signal('home');

// Tab configuration
const tabs = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

/**
 * App root component
 */
export function App() {
  const device = useDevice();
  const network = useNetwork();
  const battery = useBattery();
  const appState = useAppState();

  return (
    <SafeAreaView edges={['top', 'bottom']}>
      <StatusBar style="dark" backgroundColor="#ffffff" />

      {/* Navigation Bar */}
      <NavigationBar
        title="PhilJS App"
        backgroundColor="#ffffff"
        titleColor="#000000"
      />

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
      }}>
        {/* Offline Banner */}
        {network.isOffline && (
          <div style={{
            backgroundColor: '#ff3b30',
            color: '#ffffff',
            padding: '8px',
            textAlign: 'center',
            fontSize: '14px',
          }}>
            No internet connection
          </div>
        )}

        {/* Screen Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab() === 'home' && <HomeScreen />}
          {activeTab() === 'settings' && <SettingsScreen />}
        </div>
      </div>

      {/* Tab Bar */}
      <TabBar
        tabs={tabs}
        activeTab={activeTab()}
        onTabChange={(tabId) => activeTab.set(tabId)}
        backgroundColor="#ffffff"
        activeColor="#007aff"
        inactiveColor="#8e8e93"
      />
    </SafeAreaView>
  );
}

export default App;
