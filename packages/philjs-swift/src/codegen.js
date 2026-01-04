/**
 * Swift code generation for PhilJS
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
/**
 * Generate Swift project structure
 */
export async function generateSwiftProject(dir, config) {
    const swiftDir = join(dir, config.name);
    await mkdir(swiftDir, { recursive: true });
    // Generate Package.swift
    const packageSwift = `// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "${config.name}",
    platforms: [
        ${config.deploymentTarget.iOS ? `.iOS(.v${config.deploymentTarget.iOS.replace('.', '_')}),` : ''}
        ${config.deploymentTarget.macOS ? `.macOS(.v${config.deploymentTarget.macOS.replace('.', '_')})` : ''}
    ],
    products: [
        .library(name: "${config.name}", targets: ["${config.name}"])
    ],
    dependencies: [
        .package(url: "https://github.com/nicklockwood/SwiftFormat", from: "0.53.0")
    ],
    targets: [
        .target(
            name: "${config.name}",
            dependencies: []
        ),
        .testTarget(
            name: "${config.name}Tests",
            dependencies: ["${config.name}"]
        )
    ]
)
`;
    await writeFile(join(swiftDir, 'Package.swift'), packageSwift);
    // Generate PhilJSSignal.swift
    const signalSwift = `import SwiftUI
import Combine

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

/// Bridge for communicating with PhilJS WebView
public class PhilJSBridge: ObservableObject {
    public static let shared = PhilJSBridge()

    public func call(_ method: String, args: [Any] = []) async throws -> Any? {
        // WebView bridge - calls JavaScript methods in the PhilJS app
        // Override this method to implement your custom bridge logic
        return nil
    }

    public func emit(_ event: String, data: Any? = nil) {
        // Emit events to the PhilJS app via WebView
        // Override this method to implement your custom event emission
    }
}
`;
    await mkdir(join(swiftDir, 'Sources', config.name), { recursive: true });
    await writeFile(join(swiftDir, 'Sources', config.name, 'PhilJSSignal.swift'), signalSwift);
}
/**
 * Generate SwiftUI component from PhilJS component
 */
export function generateSwiftUIComponent(component) {
    const signalDeclarations = component.signals
        .map(s => `    @Signal var ${s.name}: ${mapTypeToSwift(s.type)} = ${formatSwiftValue(s.initialValue, s.type)}`)
        .join('\n');
    return `import SwiftUI

struct ${component.name}: View {
${signalDeclarations}

    var body: some View {
        ${component.template}
    }
}

#Preview {
    ${component.name}()
}
`;
}
function mapTypeToSwift(tsType) {
    const typeMap = {
        'string': 'String',
        'number': 'Double',
        'boolean': 'Bool',
        'string[]': '[String]',
        'number[]': '[Double]',
        'any': 'Any',
        'void': 'Void',
    };
    return typeMap[tsType] || tsType;
}
function formatSwiftValue(value, type) {
    if (value === undefined || value === null) {
        if (type === 'string' || type === 'String')
            return '""';
        if (type === 'number' || type === 'Double')
            return '0.0';
        if (type === 'boolean' || type === 'Bool')
            return 'false';
        return 'nil';
    }
    if (typeof value === 'string')
        return `"${value}"`;
    return String(value);
}
//# sourceMappingURL=codegen.js.map