/**
 * Kotlin/Android type definitions
 */

export interface KotlinProjectConfig {
  name: string;
  packageName: string;
  minSdk: number;
  targetSdk: number;
  kotlinVersion: string;
  composeVersion: string;
}

export interface ComposeComponent {
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
  javascriptEnabled: boolean;
}

export interface NativeModuleConfig {
  name: string;
  methods: NativeMethod[];
}

export interface NativeMethod {
  name: string;
  params: Array<{ name: string; type: string }>;
  returnType: string;
  suspend?: boolean;
}
