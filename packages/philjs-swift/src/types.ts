/**
 * Swift/iOS/macOS type definitions
 */

export interface SwiftProjectConfig {
  name: string;
  bundleId: string;
  version: string;
  deploymentTarget: {
    iOS?: string;
    macOS?: string;
  };
  capabilities?: string[];
}

export interface SwiftUIComponent {
  name: string;
  signals: SignalBinding[];
  template: string;
}

export interface SignalBinding {
  name: string;
  type: string;
  initialValue?: unknown;
}

export interface WebViewBridgeConfig {
  allowedOrigins: string[];
  handlers: string[];
  userScripts?: string[];
}

export interface NativeModuleConfig {
  name: string;
  methods: NativeMethod[];
}

export interface NativeMethod {
  name: string;
  params: Array<{ name: string; type: string }>;
  returnType: string;
  async?: boolean;
}
