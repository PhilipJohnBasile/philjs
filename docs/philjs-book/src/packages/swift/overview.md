# @philjs/swift

Swift bindings for PhilJS - build native iOS and macOS applications with reactive signals.

## Introduction

`@philjs/swift` enables you to build native iOS and macOS applications using PhilJS's reactive signal system. Whether you're building a fully native SwiftUI app, a hybrid WebView-based app, or integrating with Capacitor/Ionic, this package provides the tools you need.

### Key Capabilities

- **SwiftUI Integration**: Use PhilJS signals as `@Observable` properties in SwiftUI views
- **UIKit/AppKit Bindings**: Combine-based reactive bindings for traditional view frameworks
- **Native Navigation**: Bridge navigation between PhilJS router and native navigation controllers
- **WebView Bridge**: Bidirectional JSON-RPC communication between JavaScript and Swift
- **Capacitor Integration**: First-class support for Capacitor and Ionic hybrid apps
- **Code Generation**: Generate Swift code from TypeScript definitions

## Installation

```bash
npm install @philjs/swift
```

### Requirements

- Node.js 24+
- Xcode 15+ (for iOS/macOS development)
- Swift 5.9+
- iOS 17+ or macOS 14+ deployment target

## Features

### SwiftUI Integration with PhilJS Signals

The package generates Swift `Signal` property wrappers that integrate seamlessly with SwiftUI's observation system:

```swift
import SwiftUI

/// A reactive signal compatible with PhilJS
@propertyWrapper
public class Signal<T>: ObservableObject {
    @Published public var wrappedValue: T

    public var projectedValue: Binding<T> {
        Binding(get: { self.wrappedValue }, set: { self.wrappedValue = $0 })
    }

    public init(wrappedValue: T) {
        self.wrappedValue = wrappedValue
    }

    public func set(_ value: T) {
        wrappedValue = value
    }

    public func update(_ transform: (T) -> T) {
        wrappedValue = transform(wrappedValue)
    }
}
```

### UIKit/AppKit Bindings with Combine

For UIKit and AppKit applications, signals integrate with Combine for reactive updates:

```swift
import Combine

/// A computed signal that derives from other signals
public class Computed<T>: ObservableObject {
    @Published public private(set) var value: T
    private var cancellables = Set<AnyCancellable>()

    public init<S: ObservableObject>(_ source: S, compute: @escaping () -> T) {
        self.value = compute()
        source.objectWillChange
            .sink { [weak self] _ in
                self?.value = compute()
            }
            .store(in: &cancellables)
    }
}
```

### WebView Bridge for Hybrid Apps

The WebView bridge enables bidirectional communication between your JavaScript app and native Swift code using a JSON-RPC protocol.

### Capacitor/Ionic Integration

Seamless integration with Capacitor allows you to call native Swift methods from your PhilJS application and vice versa.

## Code Generation

### Generate Swift Project Structure

Generate a complete Swift package with PhilJS signal support:

```typescript
import { generateSwiftProject } from '@philjs/swift';

await generateSwiftProject('./ios', {
  name: 'MyApp',
  bundleId: 'com.example.myapp',
  version: '1.0.0',
  deploymentTarget: {
    iOS: '17.0',
    macOS: '14.0',
  },
  capabilities: ['push-notifications', 'background-fetch'],
});
```

This generates:

```
MyApp/
  Package.swift
  Sources/
    MyApp/
      PhilJSSignal.swift
```

### Generate SwiftUI Components

Convert PhilJS component definitions to SwiftUI:

```typescript
import { generateSwiftUIComponent } from '@philjs/swift';

const component = {
  name: 'CounterView',
  signals: [
    { name: 'count', type: 'number', initialValue: 0 },
    { name: 'label', type: 'string', initialValue: 'Count' },
  ],
  template: `VStack {
        Text(label)
        Text("\\(count)")
        Button("Increment") { count += 1 }
    }`,
};

const swiftCode = generateSwiftUIComponent(component);
```

Generated Swift code:

```swift
import SwiftUI

struct CounterView: View {
    @Signal var count: Double = 0.0
    @Signal var label: String = "Count"

    var body: some View {
        VStack {
            Text(label)
            Text("\(count)")
            Button("Increment") { count += 1 }
        }
    }
}

#Preview {
    CounterView()
}
```

## Bridge API

The bridge enables bidirectional communication between JavaScript and Swift using a JSON-RPC protocol.

### TypeScript Bridge Runtime

```typescript
import { BridgeRuntime, createBridgeRuntime } from '@philjs/swift';

// Create a bridge instance
const bridge = createBridgeRuntime({ defaultTimeout: 30000 });

// Call a native Swift method
const result = await bridge.call<string>('getUserName');

// Call with parameters
const user = await bridge.call<User>('fetchUser', { id: 123 });

// Subscribe to events from Swift
const unsubscribe = bridge.on('locationUpdate', (location) => {
  console.log('Location:', location);
});

// Emit events to Swift
bridge.emit('userAction', { type: 'tap', target: 'button' });

// Register a handler that Swift can call
bridge.registerHandler('getAppState', async (params) => {
  return { isLoggedIn: true, theme: 'dark' };
});

// Clean up when done
bridge.dispose();
```

### Bridge Message Types

The bridge uses typed messages for reliable communication:

```typescript
type BridgeMessageType = 'call' | 'event' | 'response' | 'error';

interface BridgeMessage<T = unknown> {
  id: string;               // Unique message ID
  type: BridgeMessageType;  // Message type
  method?: string;          // Method name (for call/event)
  params?: T;               // Parameters
  result?: T;               // Result (for response)
  error?: BridgeError;      // Error info (for error)
}

interface BridgeError {
  code: number;
  message: string;
  data?: unknown;
}
```

### Swift Bridge Implementation

The Swift side of the bridge handles incoming messages and provides a Combine-based API:

```swift
import WebKit
import Combine

@MainActor
public class PhilJSBridge: NSObject, ObservableObject {
    public static let shared = PhilJSBridge()
    public weak var webView: WKWebView?

    // Call JavaScript methods
    public func call<T>(_ method: String, params: Any? = nil) async throws -> T?

    // Emit events to JavaScript
    public func emit(_ event: String, data: Any? = nil)

    // Subscribe to events from JavaScript
    public func on(_ event: String) -> AnyPublisher<Any?, Never>

    // Register native method handlers
    public func registerHandler(_ method: String, handler: @escaping (Any?) async throws -> Any?)
}
```

## SwiftUI Examples

### @Observable Integration

Create observable view models that sync with PhilJS signals:

```swift
import SwiftUI
import Combine

@Observable
class TodoViewModel {
    var todos: [Todo] = []
    var filter: TodoFilter = .all

    var filteredTodos: [Todo] {
        switch filter {
        case .all: return todos
        case .active: return todos.filter { !$0.completed }
        case .completed: return todos.filter { $0.completed }
        }
    }

    private var cancellables = Set<AnyCancellable>()

    init() {
        // Subscribe to PhilJS events
        PhilJSBridge.shared.on("todosUpdated")
            .compactMap { $0 as? [[String: Any]] }
            .map { $0.compactMap { Todo(from: $0) } }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] todos in
                self?.todos = todos
            }
            .store(in: &cancellables)
    }

    func addTodo(_ title: String) async {
        try? await PhilJSBridge.shared.call("addTodo", params: ["title": title])
    }

    func toggleTodo(_ id: String) async {
        try? await PhilJSBridge.shared.call("toggleTodo", params: ["id": id])
    }
}
```

### Using Signals in SwiftUI Views

```swift
import SwiftUI

struct TodoListView: View {
    @State private var viewModel = TodoViewModel()
    @State private var newTodoTitle = ""

    var body: some View {
        NavigationStack {
            List {
                ForEach(viewModel.filteredTodos) { todo in
                    TodoRow(todo: todo) {
                        Task { await viewModel.toggleTodo(todo.id) }
                    }
                }
            }
            .navigationTitle("Todos")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Picker("Filter", selection: $viewModel.filter) {
                        Text("All").tag(TodoFilter.all)
                        Text("Active").tag(TodoFilter.active)
                        Text("Completed").tag(TodoFilter.completed)
                    }
                }
            }
            .safeAreaInset(edge: .bottom) {
                HStack {
                    TextField("New todo", text: $newTodoTitle)
                        .textFieldStyle(.roundedBorder)
                    Button("Add") {
                        Task {
                            await viewModel.addTodo(newTodoTitle)
                            newTodoTitle = ""
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(newTodoTitle.isEmpty)
                }
                .padding()
                .background(.bar)
            }
        }
    }
}

struct TodoRow: View {
    let todo: Todo
    let onToggle: () -> Void

    var body: some View {
        HStack {
            Image(systemName: todo.completed ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(todo.completed ? .green : .secondary)
                .onTapGesture(perform: onToggle)

            Text(todo.title)
                .strikethrough(todo.completed)
                .foregroundStyle(todo.completed ? .secondary : .primary)
        }
    }
}
```

### State Management with Signals

Create a centralized store that syncs with PhilJS:

```swift
import SwiftUI
import Combine

@MainActor
@Observable
class AppStore {
    static let shared = AppStore()

    // State signals
    var user: User?
    var isLoading = false
    var notifications: [Notification] = []
    var theme: Theme = .system

    private var cancellables = Set<AnyCancellable>()

    private init() {
        setupBridgeBindings()
    }

    private func setupBridgeBindings() {
        let bridge = PhilJSBridge.shared

        // Sync user state
        bridge.on("userChanged")
            .compactMap { $0 as? [String: Any] }
            .map { User(from: $0) }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] user in
                self?.user = user
            }
            .store(in: &cancellables)

        // Sync theme
        bridge.on("themeChanged")
            .compactMap { $0 as? String }
            .compactMap { Theme(rawValue: $0) }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] theme in
                self?.theme = theme
            }
            .store(in: &cancellables)

        // Register native handlers
        bridge.registerHandler("getDeviceInfo") { _ in
            return [
                "platform": "iOS",
                "version": UIDevice.current.systemVersion,
                "model": UIDevice.current.model
            ]
        }

        bridge.registerHandler("requestNotificationPermission") { _ in
            let center = UNUserNotificationCenter.current()
            let granted = try await center.requestAuthorization(options: [.alert, .badge, .sound])
            return ["granted": granted]
        }
    }

    // Actions that sync to PhilJS
    func login(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }

        let result: [String: Any]? = try await PhilJSBridge.shared.call(
            "auth.login",
            params: ["email": email, "password": password]
        )

        if let userData = result {
            user = User(from: userData)
        }
    }

    func logout() async {
        try? await PhilJSBridge.shared.call("auth.logout")
        user = nil
    }

    func setTheme(_ theme: Theme) {
        self.theme = theme
        PhilJSBridge.shared.emit("setTheme", data: theme.rawValue)
    }
}
```

## UIKit Examples

### Combine Integration

Use Combine to bind signals to UIKit views:

```swift
import UIKit
import Combine

class CounterViewController: UIViewController {
    @Signal var count: Int = 0

    private let countLabel = UILabel()
    private let incrementButton = UIButton(type: .system)
    private let decrementButton = UIButton(type: .system)

    private var cancellables = Set<AnyCancellable>()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupBindings()
    }

    private func setupUI() {
        view.backgroundColor = .systemBackground

        countLabel.font = .systemFont(ofSize: 48, weight: .bold)
        countLabel.textAlignment = .center

        incrementButton.setTitle("Increment", for: .normal)
        incrementButton.addTarget(self, action: #selector(increment), for: .touchUpInside)

        decrementButton.setTitle("Decrement", for: .normal)
        decrementButton.addTarget(self, action: #selector(decrement), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [
            decrementButton,
            countLabel,
            incrementButton
        ])
        stack.axis = .horizontal
        stack.spacing = 20
        stack.alignment = .center
        stack.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }

    private func setupBindings() {
        // Bind signal to label
        $count
            .map { String($0) }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] text in
                self?.countLabel.text = text
            }
            .store(in: &cancellables)

        // Sync with PhilJS
        $count
            .sink { count in
                PhilJSBridge.shared.emit("countChanged", data: count)
            }
            .store(in: &cancellables)

        // Listen for changes from PhilJS
        PhilJSBridge.shared.on("setCount")
            .compactMap { $0 as? Int }
            .receive(on: DispatchQueue.main)
            .sink { [weak self] count in
                self?.count = count
            }
            .store(in: &cancellables)
    }

    @objc private func increment() {
        count += 1
    }

    @objc private func decrement() {
        count -= 1
    }
}
```

### ViewController Binding Pattern

Create reusable binding utilities for UIKit:

```swift
import UIKit
import Combine

// MARK: - Binding Extensions

extension UILabel {
    func bind<T>(to publisher: AnyPublisher<T, Never>, transform: @escaping (T) -> String) -> AnyCancellable {
        publisher
            .map(transform)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] text in
                self?.text = text
            }
    }
}

extension UITextField {
    var textPublisher: AnyPublisher<String, Never> {
        NotificationCenter.default.publisher(for: UITextField.textDidChangeNotification, object: self)
            .compactMap { ($0.object as? UITextField)?.text }
            .eraseToAnyPublisher()
    }
}

extension UISwitch {
    var isOnPublisher: AnyPublisher<Bool, Never> {
        publisher(for: .valueChanged)
            .compactMap { ($0 as? UISwitch)?.isOn }
            .eraseToAnyPublisher()
    }
}

// MARK: - Base ViewController

class PhilJSViewController: UIViewController {
    var cancellables = Set<AnyCancellable>()
    let bridge = PhilJSBridge.shared

    func bind<T>(_ signal: Signal<T>, to label: UILabel, transform: @escaping (T) -> String) {
        signal.$wrappedValue
            .map(transform)
            .receive(on: DispatchQueue.main)
            .sink { [weak label] text in
                label?.text = text
            }
            .store(in: &cancellables)
    }

    func bind(_ textField: UITextField, to signal: Signal<String>) {
        textField.textPublisher
            .sink { [weak signal] text in
                signal?.wrappedValue = text
            }
            .store(in: &cancellables)
    }

    func bindBridge<T>(_ event: String, to signal: Signal<T>) {
        bridge.on(event)
            .compactMap { $0 as? T }
            .receive(on: DispatchQueue.main)
            .sink { [weak signal] value in
                signal?.wrappedValue = value
            }
            .store(in: &cancellables)
    }
}

// MARK: - Example Usage

class ProfileViewController: PhilJSViewController {
    @Signal var userName: String = ""
    @Signal var email: String = ""
    @Signal var isDarkMode: Bool = false

    private let nameLabel = UILabel()
    private let emailField = UITextField()
    private let darkModeSwitch = UISwitch()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        setupBindings()
        loadProfile()
    }

    private func setupBindings() {
        // Bind signals to UI
        bind($userName, to: nameLabel) { $0 }
        bind(emailField, to: $email)

        // Bind switch
        darkModeSwitch.isOnPublisher
            .sink { [weak self] isOn in
                self?.isDarkMode = isOn
                self?.bridge.emit("setDarkMode", data: isOn)
            }
            .store(in: &cancellables)

        // Listen for bridge events
        bindBridge("userNameChanged", to: $userName)
        bindBridge("darkModeChanged", to: $isDarkMode)
    }

    private func loadProfile() {
        Task {
            let profile: [String: Any]? = try? await bridge.call("getProfile")
            if let name = profile?["name"] as? String {
                userName = name
            }
            if let email = profile?["email"] as? String {
                self.email = email
            }
        }
    }
}
```

## Hybrid App Setup with Capacitor

### Project Setup

1. Create a new Capacitor project or add to existing:

```bash
npm install @capacitor/core @capacitor/ios
npx cap init MyApp com.example.myapp
npx cap add ios
```

2. Install PhilJS Swift bindings:

```bash
npm install @philjs/swift
```

3. Generate the native bridge code:

```typescript
// scripts/generate-bridge.ts
import { generateBridgeSetup } from '@philjs/swift';
import { writeFileSync, mkdirSync } from 'fs';

const { swift, typescript } = generateBridgeSetup({
  modules: [
    {
      name: 'DeviceModule',
      methods: [
        { name: 'getInfo', params: [], returnType: 'object', async: true },
        { name: 'vibrate', params: [{ name: 'duration', type: 'number' }], returnType: 'void' },
      ],
    },
    {
      name: 'StorageModule',
      methods: [
        { name: 'get', params: [{ name: 'key', type: 'string' }], returnType: 'string', async: true },
        { name: 'set', params: [{ name: 'key', type: 'string' }, { name: 'value', type: 'string' }], returnType: 'void', async: true },
        { name: 'remove', params: [{ name: 'key', type: 'string' }], returnType: 'void', async: true },
      ],
    },
  ],
  webViewConfig: {
    allowedOrigins: ['https://localhost', 'capacitor://localhost'],
    handlers: ['PhilJS', 'Capacitor'],
  },
});

mkdirSync('ios/App/App/PhilJS', { recursive: true });
writeFileSync('ios/App/App/PhilJS/Bridge.swift', swift);
writeFileSync('src/native/bridge.ts', typescript);
```

4. Run the generator:

```bash
npx tsx scripts/generate-bridge.ts
```

### TypeScript Integration

Use the generated bindings in your PhilJS app:

```typescript
// src/native/index.ts
import { createPhilJSBridge } from './bridge';

// Create the bridge singleton
export const native = createPhilJSBridge({ timeout: 30000 });

// Re-export module clients
export const { deviceModule, storageModule, bridge } = native;
```

```typescript
// src/stores/device.ts
import { signal, computed } from '@philjs/core';
import { deviceModule } from '../native';

export const deviceInfo = signal<DeviceInfo | null>(null);
export const isLoading = signal(false);

export async function loadDeviceInfo() {
  isLoading.set(true);
  try {
    const info = await deviceModule.getInfo();
    deviceInfo.set(info);
  } finally {
    isLoading.set(false);
  }
}

export async function hapticFeedback() {
  await deviceModule.vibrate(50);
}
```

```typescript
// src/stores/storage.ts
import { signal, effect } from '@philjs/core';
import { storageModule } from '../native';

// Persistent signal that syncs with native storage
export function persistentSignal<T>(key: string, defaultValue: T) {
  const state = signal<T>(defaultValue);
  let isInitialized = false;

  // Load initial value
  storageModule.get(key).then((stored) => {
    if (stored) {
      state.set(JSON.parse(stored));
    }
    isInitialized = true;
  });

  // Persist changes
  effect(() => {
    if (isInitialized) {
      storageModule.set(key, JSON.stringify(state.get()));
    }
  });

  return state;
}

// Usage
export const userPreferences = persistentSignal('preferences', {
  theme: 'system',
  notifications: true,
  language: 'en',
});
```

### Native Swift Implementation

Implement the generated module stubs:

```swift
// ios/App/App/PhilJS/DeviceModule.swift
import UIKit
import AudioToolbox

@MainActor
public class DeviceModule: ObservableObject {
    public static let shared = DeviceModule()

    private init() {}

    public func register(with bridge: PhilJSBridge) {
        bridge.registerHandler("DeviceModule.getInfo") { _ in
            return await self.getInfo()
        }

        bridge.registerHandler("DeviceModule.vibrate") { params in
            guard let duration = (params as? [String: Any])?["duration"] as? Double else {
                throw BridgeRuntimeError.decodingError
            }
            self.vibrate(duration: duration)
        }
    }

    public func getInfo() async -> [String: Any] {
        let device = UIDevice.current

        return [
            "platform": "ios",
            "model": device.model,
            "osVersion": device.systemVersion,
            "name": device.name,
            "isSimulator": TARGET_OS_SIMULATOR != 0,
            "batteryLevel": device.batteryLevel,
            "batteryState": batteryStateString(device.batteryState)
        ]
    }

    public func vibrate(duration: Double) {
        if duration <= 0 {
            return
        }

        // Use haptic feedback for short durations
        if duration < 100 {
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
        } else {
            // Use system vibration for longer durations
            AudioServicesPlaySystemSound(kSystemSoundID_Vibrate)
        }
    }

    private func batteryStateString(_ state: UIDevice.BatteryState) -> String {
        switch state {
        case .charging: return "charging"
        case .full: return "full"
        case .unplugged: return "unplugged"
        default: return "unknown"
        }
    }
}
```

```swift
// ios/App/App/PhilJS/StorageModule.swift
import Foundation

@MainActor
public class StorageModule: ObservableObject {
    public static let shared = StorageModule()

    private let defaults = UserDefaults.standard
    private let keyPrefix = "philjs_"

    private init() {}

    public func register(with bridge: PhilJSBridge) {
        bridge.registerHandler("StorageModule.get") { params in
            guard let key = (params as? [String: Any])?["key"] as? String else {
                throw BridgeRuntimeError.decodingError
            }
            return self.get(key: key)
        }

        bridge.registerHandler("StorageModule.set") { params in
            guard let dict = params as? [String: Any],
                  let key = dict["key"] as? String,
                  let value = dict["value"] as? String else {
                throw BridgeRuntimeError.decodingError
            }
            self.set(key: key, value: value)
        }

        bridge.registerHandler("StorageModule.remove") { params in
            guard let key = (params as? [String: Any])?["key"] as? String else {
                throw BridgeRuntimeError.decodingError
            }
            self.remove(key: key)
        }
    }

    public func get(key: String) -> String? {
        return defaults.string(forKey: keyPrefix + key)
    }

    public func set(key: String, value: String) {
        defaults.set(value, forKey: keyPrefix + key)
    }

    public func remove(key: String) {
        defaults.removeObject(forKey: keyPrefix + key)
    }
}
```

### App Delegate Setup

Initialize the bridge in your AppDelegate:

```swift
// ios/App/App/AppDelegate.swift
import UIKit
import Capacitor

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Initialize PhilJS bridge modules
        Task { @MainActor in
            setupPhilJSBridge()
        }

        return true
    }
}

@MainActor
func setupPhilJSBridge() {
    let bridge = PhilJSBridge.shared

    // Register all modules
    DeviceModule.shared.register(with: bridge)
    StorageModule.shared.register(with: bridge)

    print("[PhilJS] Bridge initialized with native modules")
}
```

## Type Definitions

### SwiftProjectConfig

Configuration for generating a Swift project:

```typescript
interface SwiftProjectConfig {
  name: string;
  bundleId: string;
  version: string;
  deploymentTarget: {
    iOS?: string;   // e.g., "17.0"
    macOS?: string; // e.g., "14.0"
  };
  capabilities?: string[];
}
```

### SwiftUIComponent

Definition for generating SwiftUI components:

```typescript
interface SwiftUIComponent {
  name: string;
  signals: SignalBinding[];
  template: string;
}

interface SignalBinding {
  name: string;
  type: string;
  initialValue?: unknown;
}
```

### WebViewBridgeConfig

Configuration for the WebView bridge:

```typescript
interface WebViewBridgeConfig {
  allowedOrigins: string[];
  handlers: string[];
  userScripts?: string[];
}
```

### NativeModuleConfig

Configuration for generating native modules:

```typescript
interface NativeModuleConfig {
  name: string;
  methods: NativeMethod[];
}

interface NativeMethod {
  name: string;
  params: Array<{ name: string; type: string }>;
  returnType: string;
  async?: boolean;
}
```

## API Reference

### Code Generation Functions

#### `generateSwiftProject(dir, config)`

Generates a complete Swift package structure with PhilJS signal support.

```typescript
async function generateSwiftProject(
  dir: string,
  config: SwiftProjectConfig
): Promise<void>
```

#### `generateSwiftUIComponent(component)`

Generates a SwiftUI view from a component definition.

```typescript
function generateSwiftUIComponent(component: SwiftUIComponent): string
```

#### `generateWebViewBridge(config)`

Generates the Swift WebView bridge implementation.

```typescript
function generateWebViewBridge(config: WebViewBridgeConfig): string
```

#### `generateNativeModule(config)`

Generates a native Swift module with bridge registration.

```typescript
function generateNativeModule(config: NativeModuleConfig): string
```

#### `generateTypeScriptBindings(config)`

Generates TypeScript client bindings for a Swift module.

```typescript
function generateTypeScriptBindings(config: NativeModuleConfig): string
```

#### `generateBridgeSetup(config)`

Generates complete bridge setup for both Swift and TypeScript.

```typescript
function generateBridgeSetup(config: {
  modules: NativeModuleConfig[];
  webViewConfig: WebViewBridgeConfig;
}): { swift: string; typescript: string }
```

### Bridge Runtime

#### `createBridgeRuntime(options?)`

Creates a new bridge runtime instance.

```typescript
function createBridgeRuntime(options?: {
  defaultTimeout?: number;
}): BridgeRuntime
```

#### `BridgeRuntime` Class

The main runtime class for JS-Swift communication:

```typescript
class BridgeRuntime implements Disposable {
  // Call a native Swift method
  call<T, P>(method: string, params?: P, options?: { timeout?: number }): Promise<T>;

  // Subscribe to events
  on<T>(event: string, handler: (data: T) => void): () => void;

  // Unsubscribe from events
  off<T>(event: string, handler: (data: T) => void): void;

  // Subscribe once
  once<T>(event: string, handler: (data: T) => void): () => void;

  // Emit events to Swift
  emit<T>(event: string, data?: T): void;

  // Register handlers for Swift calls
  registerHandler<T, R>(method: string, handler: (params: T) => R | Promise<R>): () => void;

  // Handle incoming messages from Swift
  handleMessage(messageJson: string): void;

  // Clean up resources
  dispose(): void;
  [Symbol.dispose](): void;
}
```

## Best Practices

### Signal Naming Conventions

Use consistent naming between TypeScript and Swift:

```typescript
// TypeScript
const userCount = signal(0);
const isLoading = signal(false);
```

```swift
// Swift
@Signal var userCount: Int = 0
@Signal var isLoading: Bool = false
```

### Error Handling

Always handle bridge errors gracefully:

```typescript
try {
  const result = await bridge.call('riskyOperation');
} catch (error) {
  if (error.message.includes('timeout')) {
    // Handle timeout
  } else {
    // Handle other errors
  }
}
```

```swift
do {
    let result: String? = try await bridge.call("riskyOperation")
} catch BridgeRuntimeError.timeout(let method, let timeout) {
    print("Call to \(method) timed out after \(timeout)s")
} catch {
    print("Bridge error: \(error)")
}
```

### Memory Management

Properly dispose of the bridge when the view is destroyed:

```typescript
// Using explicit resource management
{
  using bridge = createBridgeRuntime();
  // Bridge is automatically disposed when scope exits
}

// Or manual disposal
const bridge = createBridgeRuntime();
// ... use bridge
bridge.dispose();
```

```swift
deinit {
    PhilJSBridge.shared.dispose()
}
```

## See Also

- [@philjs/core](../core/overview.md) - Core signal primitives
- [@philjs/native](../native/overview.md) - Cross-platform native development
- [@philjs/desktop](../desktop/overview.md) - Desktop application development with Tauri
