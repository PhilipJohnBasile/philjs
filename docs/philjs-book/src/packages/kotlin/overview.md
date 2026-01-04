# @philjs/kotlin

Build native Android applications and Kotlin Multiplatform (KMP) projects with PhilJS signals and reactivity. This package provides seamless integration between PhilJS's reactive primitives and Kotlin's native ecosystem, including Jetpack Compose and Android Views.

## Installation

```bash
npm install @philjs/kotlin
```

## Features

- **Jetpack Compose Integration** - Use PhilJS signals directly in Compose UI with full reactivity
- **Android View Bindings** - Data binding and LiveData compatibility for traditional Android Views
- **Native Navigation** - Integrate with Android navigation components
- **WebView Bridge** - Bidirectional communication for hybrid apps via JSON-RPC protocol
- **Kotlin Multiplatform Support** - Share reactive logic across Android, iOS, and other KMP targets
- **Code Generation** - Generate Kotlin code from TypeScript definitions

## Quick Start

### Generate a Kotlin Project

```typescript
import { generateKotlinProject } from '@philjs/kotlin';

await generateKotlinProject('./my-android-app', {
  name: 'MyApp',
  packageName: 'com.example.myapp',
  minSdk: 24,
  targetSdk: 34,
  kotlinVersion: '1.9.0',
  composeVersion: '1.5.0'
});
```

This generates a complete Android project structure with:
- Gradle build configuration with Compose support
- PhilJS Signal implementation for Kotlin
- Bridge utilities for WebView communication

---

## Code Generation

The `@philjs/kotlin` package includes powerful code generation tools to bridge TypeScript and Kotlin.

### Project Configuration

```typescript
import type { KotlinProjectConfig } from '@philjs/kotlin';

const config: KotlinProjectConfig = {
  name: 'MyApp',
  packageName: 'com.example.myapp',
  minSdk: 24,
  targetSdk: 34,
  kotlinVersion: '1.9.0',
  composeVersion: '1.5.0'
};
```

### Generate Compose Components

Transform PhilJS component definitions into Jetpack Compose code:

```typescript
import { generateComposeComponent } from '@philjs/kotlin';
import type { ComposeComponent } from '@philjs/kotlin';

const component: ComposeComponent = {
  name: 'Counter',
  signals: [
    { name: 'count', type: 'Int', initialValue: 0 },
    { name: 'label', type: 'String', initialValue: 'Count' }
  ],
  template: `
    Column {
        Text(text = "\${label.value}: \${count.value}")
        Button(onClick = { count.update { it + 1 } }) {
            Text("Increment")
        }
    }
  `
};

const kotlinCode = generateComposeComponent(component);
```

**Generated Kotlin Code:**

```kotlin
package com.example.app

import androidx.compose.runtime.*
import androidx.compose.material3.*
import androidx.compose.foundation.layout.*

@Composable
fun Counter() {
    val count = rememberSignal(0)
    val label = rememberSignal("")

    Column {
        Text(text = "${label.value}: ${count.value}")
        Button(onClick = { count.update { it + 1 } }) {
            Text("Increment")
        }
    }
}
```

### Generate Native Modules

Create Kotlin native modules from TypeScript definitions:

```typescript
import { generateNativeModule } from '@philjs/kotlin';
import type { NativeModuleConfig } from '@philjs/kotlin';

const moduleConfig: NativeModuleConfig = {
  name: 'DeviceModule',
  methods: [
    {
      name: 'getBatteryLevel',
      params: [],
      returnType: 'Int',
      suspend: true
    },
    {
      name: 'vibrate',
      params: [{ name: 'duration', type: 'number' }],
      returnType: 'void'
    },
    {
      name: 'getDeviceInfo',
      params: [],
      returnType: 'object',
      suspend: true
    }
  ]
};

const kotlinModule = generateNativeModule(moduleConfig);
```

---

## Bridge API

The Bridge API enables bidirectional communication between JavaScript and Kotlin using a JSON-RPC protocol.

### TypeScript Side: BridgeRuntime

```typescript
import { BridgeRuntime, createBridge } from '@philjs/kotlin';

// Create a bridge instance
const bridge = createBridge({
  defaultTimeout: 5000,
  debug: true,
  sendMessage: (msg) => window.PhilJSNative?.postMessage(msg)
});

// Call a Kotlin method
const userName = await bridge.call<string>('getUserName', { userId: 123 });

// Listen for events from Kotlin
const unsubscribe = bridge.on('locationUpdate', (location) => {
  console.log('New location:', location.lat, location.lng);
});

// Emit events to Kotlin
bridge.emit('userAction', { action: 'click', target: 'submitButton' });

// Register a handler for Kotlin to call
bridge.registerHandler('calculateTotal', async (params) => {
  const { items } = params as { items: number[] };
  return items.reduce((sum, item) => sum + item, 0);
});

// Wait for a specific event
const result = await bridge.waitFor('initComplete', 10000);

// Clean up when done
bridge.dispose();
```

### Bridge Message Protocol

The bridge uses a JSON-RPC-style protocol for all communication:

```typescript
interface BridgeMessage {
  id: string;           // Unique message ID for correlation
  type: 'call' | 'event' | 'response' | 'error';
  method?: string;      // Method name for call/event
  params?: unknown;     // Parameters
  result?: unknown;     // Result for responses
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}
```

### Kotlin Side: PhilJSBridge

Generate the Kotlin bridge code:

```typescript
import { generateWebViewBridge } from '@philjs/kotlin';
import type { WebViewBridgeConfig } from '@philjs/kotlin';

const bridgeConfig: WebViewBridgeConfig = {
  allowedOrigins: ['https://myapp.com', 'file://'],
  handlers: ['onUserLogin', 'onDataSync', 'onError'],
  javascriptEnabled: true
};

const kotlinBridge = generateWebViewBridge(bridgeConfig);
```

**Using the Bridge in Kotlin:**

```kotlin
import com.example.philjs.PhilJSBridge
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = findViewById(R.id.webView)

        // Initialize the bridge
        PhilJSBridge.initialize(webView)

        // Register handlers for JS to call
        PhilJSBridge.registerHandler("getUserName") { params ->
            buildJsonObject {
                put("name", "John Doe")
            }
        }

        // Listen for events from JS
        lifecycleScope.launch {
            PhilJSBridge.events.collect { (event, data) ->
                when (event) {
                    "userAction" -> handleUserAction(data)
                    "formSubmit" -> handleFormSubmit(data)
                }
            }
        }

        // Call JS methods
        lifecycleScope.launch {
            val result = PhilJSBridge.call<JsonElement>("calculateTotal")
            println("Total: $result")
        }

        // Emit events to JS
        PhilJSBridge.emit("locationUpdate", buildJsonObject {
            put("lat", 37.7749)
            put("lng", -122.4194)
        })
    }

    override fun onDestroy() {
        super.onDestroy()
        PhilJSBridge.destroy()
    }
}
```

### Complete Bridge Package Generation

Generate all necessary Kotlin files at once:

```typescript
import { generateKotlinBridgePackage } from '@philjs/kotlin';

const files = generateKotlinBridgePackage({
  packageName: 'com.example.myapp',
  webViewConfig: {
    allowedOrigins: ['https://myapp.com'],
    handlers: ['onAuth', 'onSync'],
    javascriptEnabled: true
  },
  modules: [
    {
      name: 'StorageModule',
      methods: [
        { name: 'save', params: [{ name: 'key', type: 'string' }, { name: 'value', type: 'string' }], returnType: 'void', suspend: true },
        { name: 'load', params: [{ name: 'key', type: 'string' }], returnType: 'string', suspend: true }
      ]
    }
  ]
});

// files is a Map<string, string> containing:
// - PhilJSBridge.kt
// - StorageModule.kt
// - build.gradle.kts.snippet
```

---

## Jetpack Compose Examples

### Signal Implementation in Kotlin

The generated `PhilJSSignal.kt` provides reactive signals compatible with Compose:

```kotlin
package com.example.myapp

import androidx.compose.runtime.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

/**
 * A reactive signal compatible with PhilJS
 */
class Signal<T>(initialValue: T) {
    private val _state = MutableStateFlow(initialValue)
    val state: StateFlow<T> = _state

    var value: T
        get() = _state.value
        set(value) { _state.value = value }

    fun set(value: T) {
        _state.value = value
    }

    fun update(transform: (T) -> T) {
        _state.value = transform(_state.value)
    }
}

/**
 * Create a signal as Compose state
 */
@Composable
fun <T> rememberSignal(initialValue: T): Signal<T> {
    return remember { Signal(initialValue) }
}

/**
 * Collect signal as Compose state
 */
@Composable
fun <T> Signal<T>.collectAsState(): State<T> {
    return state.collectAsState()
}
```

### Counter Example

```kotlin
@Composable
fun CounterScreen() {
    val count = rememberSignal(0)
    val countState by count.collectAsState()

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Count: $countState",
            style = MaterialTheme.typography.headlineLarge
        )

        Spacer(modifier = Modifier.height(16.dp))

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { count.update { it - 1 } }) {
                Text("-")
            }
            Button(onClick = { count.update { it + 1 } }) {
                Text("+")
            }
        }
    }
}
```

### Todo List with Signals

```kotlin
data class Todo(
    val id: String,
    val text: String,
    val completed: Boolean
)

@Composable
fun TodoListScreen() {
    val todos = rememberSignal<List<Todo>>(emptyList())
    val newTodoText = rememberSignal("")

    val todosState by todos.collectAsState()
    val textState by newTodoText.collectAsState()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // Input field
        Row(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = textState,
                onValueChange = { newTodoText.set(it) },
                modifier = Modifier.weight(1f),
                placeholder = { Text("Add a todo...") }
            )

            Spacer(modifier = Modifier.width(8.dp))

            Button(
                onClick = {
                    if (textState.isNotBlank()) {
                        todos.update { list ->
                            list + Todo(
                                id = UUID.randomUUID().toString(),
                                text = textState,
                                completed = false
                            )
                        }
                        newTodoText.set("")
                    }
                }
            ) {
                Text("Add")
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Todo list
        LazyColumn {
            items(todosState, key = { it.id }) { todo ->
                TodoItem(
                    todo = todo,
                    onToggle = {
                        todos.update { list ->
                            list.map { item ->
                                if (item.id == todo.id) {
                                    item.copy(completed = !item.completed)
                                } else {
                                    item
                                }
                            }
                        }
                    },
                    onDelete = {
                        todos.update { list ->
                            list.filter { it.id != todo.id }
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun TodoItem(
    todo: Todo,
    onToggle: () -> Unit,
    onDelete: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(
            checked = todo.completed,
            onCheckedChange = { onToggle() }
        )

        Text(
            text = todo.text,
            modifier = Modifier.weight(1f),
            textDecoration = if (todo.completed) {
                TextDecoration.LineThrough
            } else {
                TextDecoration.None
            }
        )

        IconButton(onClick = onDelete) {
            Icon(Icons.Default.Delete, contentDescription = "Delete")
        }
    }
}
```

### Navigation with Signals

```kotlin
sealed class Screen {
    object Home : Screen()
    data class Details(val id: String) : Screen()
    object Settings : Screen()
}

@Composable
fun AppNavigation() {
    val currentScreen = rememberSignal<Screen>(Screen.Home)
    val screenState by currentScreen.collectAsState()

    when (val screen = screenState) {
        is Screen.Home -> HomeScreen(
            onNavigateToDetails = { id ->
                currentScreen.set(Screen.Details(id))
            },
            onNavigateToSettings = {
                currentScreen.set(Screen.Settings)
            }
        )
        is Screen.Details -> DetailsScreen(
            id = screen.id,
            onBack = { currentScreen.set(Screen.Home) }
        )
        is Screen.Settings -> SettingsScreen(
            onBack = { currentScreen.set(Screen.Home) }
        )
    }
}

@Composable
fun HomeScreen(
    onNavigateToDetails: (String) -> Unit,
    onNavigateToSettings: () -> Unit
) {
    Column {
        Text("Home Screen", style = MaterialTheme.typography.headlineMedium)

        Button(onClick = { onNavigateToDetails("item-123") }) {
            Text("View Details")
        }

        Button(onClick = onNavigateToSettings) {
            Text("Settings")
        }
    }
}
```

---

## Android View Examples

### Data Binding Integration

For traditional Android Views, integrate signals with Data Binding:

```kotlin
// ViewModel with signals
class MainViewModel : ViewModel() {
    val userName = Signal("Guest")
    val isLoggedIn = Signal(false)
    val itemCount = Signal(0)

    fun login(name: String) {
        userName.set(name)
        isLoggedIn.set(true)
    }

    fun logout() {
        userName.set("Guest")
        isLoggedIn.set(false)
    }
}

// Activity using ViewBinding
class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Collect signals and update UI
        lifecycleScope.launch {
            viewModel.userName.state.collect { name ->
                binding.userNameText.text = "Welcome, $name"
            }
        }

        lifecycleScope.launch {
            viewModel.isLoggedIn.state.collect { loggedIn ->
                binding.loginButton.visibility = if (loggedIn) View.GONE else View.VISIBLE
                binding.logoutButton.visibility = if (loggedIn) View.VISIBLE else View.GONE
            }
        }

        // Button handlers
        binding.loginButton.setOnClickListener {
            viewModel.login("John")
        }

        binding.logoutButton.setOnClickListener {
            viewModel.logout()
        }
    }
}
```

### LiveData Compatibility

Convert signals to LiveData for backward compatibility:

```kotlin
import androidx.lifecycle.asLiveData

class LegacyViewModel : ViewModel() {
    private val _count = Signal(0)

    // Expose as LiveData for data binding
    val countLiveData = _count.state.asLiveData()

    fun increment() {
        _count.update { it + 1 }
    }

    fun decrement() {
        _count.update { it - 1 }
    }
}
```

**XML Layout with Data Binding:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<layout xmlns:android="http://schemas.android.com/apk/res/android">
    <data>
        <variable
            name="viewModel"
            type="com.example.myapp.LegacyViewModel" />
    </data>

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:gravity="center"
        android:orientation="vertical">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@{String.valueOf(viewModel.countLiveData)}"
            android:textSize="48sp" />

        <LinearLayout
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:orientation="horizontal">

            <Button
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:onClick="@{() -> viewModel.decrement()}"
                android:text="-" />

            <Button
                android:layout_width="wrap_content"
                android:layout_height="wrap_content"
                android:onClick="@{() -> viewModel.increment()}"
                android:text="+" />
        </LinearLayout>
    </LinearLayout>
</layout>
```

---

## WebView Hybrid App Setup

Build hybrid apps that combine PhilJS web content with native Kotlin functionality.

### Complete Setup Example

**1. TypeScript Side (PhilJS App):**

```typescript
import { createBridge } from '@philjs/kotlin';
import { signal, effect } from '@philjs/core';

// Initialize the bridge
const bridge = createBridge({
  defaultTimeout: 10000,
  debug: process.env.NODE_ENV === 'development'
});

// Create reactive state
const userLocation = signal<{ lat: number; lng: number } | null>(null);
const batteryLevel = signal<number>(100);

// Listen for native events
bridge.on('locationUpdate', (location) => {
  userLocation.value = location as { lat: number; lng: number };
});

bridge.on('batteryUpdate', (level) => {
  batteryLevel.value = level as number;
});

// Expose functions to native
bridge.registerHandler('getCartItems', () => {
  return [
    { id: '1', name: 'Widget', price: 9.99 },
    { id: '2', name: 'Gadget', price: 19.99 }
  ];
});

bridge.registerHandler('processPayment', async (params) => {
  const { amount, method } = params as { amount: number; method: string };
  // Process payment logic
  return { success: true, transactionId: 'tx_123' };
});

// Call native functionality
async function takePhoto(): Promise<string> {
  return await bridge.call<string>('capturePhoto', { quality: 0.8 });
}

async function shareContent(content: { title: string; text: string }): Promise<void> {
  await bridge.call('share', content);
}

// React to location changes
effect(() => {
  const loc = userLocation.value;
  if (loc) {
    console.log(`Location updated: ${loc.lat}, ${loc.lng}`);
    // Update UI or fetch location-based data
  }
});
```

**2. Kotlin Side (Android App):**

```kotlin
class HybridActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private val locationManager by lazy { getSystemService(Context.LOCATION_SERVICE) as LocationManager }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_hybrid)

        webView = findViewById(R.id.webView)
        setupWebView()
        setupNativeHandlers()
        startLocationUpdates()
    }

    private fun setupWebView() {
        // Initialize PhilJS bridge
        PhilJSBridge.initialize(webView, listOf("https://myapp.com", "file://"))

        // Load your PhilJS app
        webView.loadUrl("file:///android_asset/index.html")
    }

    private fun setupNativeHandlers() {
        // Handle photo capture
        PhilJSBridge.registerHandler("capturePhoto") { params ->
            val quality = (params as? JsonObject)?.get("quality")?.jsonPrimitive?.float ?: 0.8f
            capturePhoto(quality)
        }

        // Handle sharing
        PhilJSBridge.registerHandler("share") { params ->
            val obj = params as? JsonObject
            val title = obj?.get("title")?.jsonPrimitive?.content ?: ""
            val text = obj?.get("text")?.jsonPrimitive?.content ?: ""
            shareContent(title, text)
            null
        }

        // Handle vibration
        PhilJSBridge.registerHandler("vibrate") { params ->
            val duration = (params as? JsonPrimitive)?.long ?: 100L
            vibrate(duration)
            null
        }
    }

    private fun startLocationUpdates() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                5000L,  // 5 seconds
                10f,    // 10 meters
                object : LocationListener {
                    override fun onLocationChanged(location: Location) {
                        // Send location to PhilJS
                        PhilJSBridge.emit("locationUpdate", buildJsonObject {
                            put("lat", location.latitude)
                            put("lng", location.longitude)
                            put("accuracy", location.accuracy)
                        })
                    }
                }
            )
        }
    }

    private suspend fun capturePhoto(quality: Float): JsonElement {
        // Implement camera capture
        return buildJsonObject {
            put("uri", "content://media/photos/123")
            put("width", 1920)
            put("height", 1080)
        }
    }

    private fun shareContent(title: String, text: String) {
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_SUBJECT, title)
            putExtra(Intent.EXTRA_TEXT, text)
        }
        startActivity(Intent.createChooser(intent, "Share via"))
    }

    private fun vibrate(duration: Long) {
        val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createOneShot(duration, VibrationEffect.DEFAULT_AMPLITUDE))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(duration)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        PhilJSBridge.destroy()
    }
}
```

**3. Layout XML:**

```xml
<?xml version="1.0" encoding="utf-8"?>
<FrameLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webView"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</FrameLayout>
```

---

## Kotlin Multiplatform Support

Share reactive logic across platforms using Kotlin Multiplatform.

### Shared Module Structure

```
shared/
  src/
    commonMain/kotlin/
      com/example/shared/
        Signal.kt
        State.kt
    androidMain/kotlin/
      com/example/shared/
        PlatformSignal.kt
    iosMain/kotlin/
      com/example/shared/
        PlatformSignal.kt
```

### Common Signal Implementation

```kotlin
// commonMain/kotlin/com/example/shared/Signal.kt
package com.example.shared

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

expect class PlatformScope {
    fun launch(block: suspend () -> Unit)
}

class Signal<T>(initialValue: T) {
    private val _state = MutableStateFlow(initialValue)
    val state: StateFlow<T> = _state

    var value: T
        get() = _state.value
        set(value) { _state.value = value }

    fun update(transform: (T) -> T) {
        _state.value = transform(_state.value)
    }
}

// Shared business logic
class CounterStore {
    val count = Signal(0)

    fun increment() = count.update { it + 1 }
    fun decrement() = count.update { it - 1 }
    fun reset() = count.set(0)
}
```

### Android Implementation

```kotlin
// androidMain/kotlin/com/example/shared/PlatformSignal.kt
package com.example.shared

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

actual class PlatformScope {
    private val scope = CoroutineScope(Dispatchers.Main)

    actual fun launch(block: suspend () -> Unit) {
        scope.launch { block() }
    }
}
```

### iOS Implementation (Swift Interop)

```kotlin
// iosMain/kotlin/com/example/shared/PlatformSignal.kt
package com.example.shared

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

actual class PlatformScope {
    private val scope = CoroutineScope(Dispatchers.Main)

    actual fun launch(block: suspend () -> Unit) {
        scope.launch { block() }
    }
}
```

### Using in Android

```kotlin
class SharedViewModel : ViewModel() {
    val counterStore = CounterStore()
}

@Composable
fun SharedCounterScreen(viewModel: SharedViewModel = viewModel()) {
    val count by viewModel.counterStore.count.state.collectAsState()

    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Count: $count", style = MaterialTheme.typography.headlineLarge)

        Row {
            Button(onClick = { viewModel.counterStore.decrement() }) {
                Text("-")
            }
            Button(onClick = { viewModel.counterStore.increment() }) {
                Text("+")
            }
        }

        Button(onClick = { viewModel.counterStore.reset() }) {
            Text("Reset")
        }
    }
}
```

---

## API Reference

### Types

```typescript
interface KotlinProjectConfig {
  name: string;
  packageName: string;
  minSdk: number;
  targetSdk: number;
  kotlinVersion: string;
  composeVersion: string;
}

interface ComposeComponent {
  name: string;
  signals: SignalBinding[];
  template: string;
}

interface SignalBinding {
  name: string;
  type: string;
  initialValue?: unknown;
}

interface WebViewBridgeConfig {
  allowedOrigins: string[];
  handlers: string[];
  javascriptEnabled: boolean;
}

interface NativeModuleConfig {
  name: string;
  methods: NativeMethod[];
}

interface NativeMethod {
  name: string;
  params: Array<{ name: string; type: string }>;
  returnType: string;
  suspend?: boolean;
}
```

### BridgeRuntime Methods

| Method | Description |
|--------|-------------|
| `call<T>(method, params?, timeout?)` | Call a Kotlin method and await result |
| `on<T>(event, handler)` | Subscribe to events from Kotlin |
| `off<T>(event, handler)` | Unsubscribe from events |
| `once<T>(event, handler)` | Subscribe to a single event |
| `emit(event, data?)` | Emit event to Kotlin |
| `registerHandler(method, handler)` | Register handler for Kotlin calls |
| `waitFor<T>(event, timeout?)` | Wait for a specific event |
| `dispose()` | Cleanup bridge resources |

### Code Generation Functions

| Function | Description |
|----------|-------------|
| `generateKotlinProject(dir, config)` | Generate complete Android project |
| `generateComposeComponent(component)` | Generate Compose component code |
| `generateWebViewBridge(config)` | Generate WebView bridge Kotlin code |
| `generateNativeModule(config)` | Generate native module code |
| `generateKotlinBridgePackage(config)` | Generate complete bridge package |

---

## Best Practices

1. **Signal Scope** - Create signals at the appropriate lifecycle scope (ViewModel for shared state, Composable for local state)

2. **Bridge Cleanup** - Always call `dispose()` or use the Disposable pattern to clean up bridge resources

3. **Error Handling** - Wrap bridge calls in try-catch and handle timeouts appropriately

4. **Type Safety** - Use TypeScript definitions and Kotlin data classes for bridge communication

5. **Performance** - Use `collectAsState()` in Compose to automatically subscribe/unsubscribe from signals

## Related Packages

- [@philjs/core](../core/overview.md) - Core signal primitives
- [@philjs/swift](../swift/overview.md) - iOS/Swift integration
- [@philjs/native](../native/overview.md) - Cross-platform native apps
