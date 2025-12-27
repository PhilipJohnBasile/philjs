/**
 * Swift WebView Bridge for PhilJS
 */

import type { WebViewBridgeConfig, NativeModuleConfig } from './types.js';

/**
 * Generate Swift WebView bridge code
 */
export function generateWebViewBridge(config: WebViewBridgeConfig): string {
  return `import WebKit

class PhilJSWebView: WKWebView {
    private let bridge = PhilJSBridge.shared

    init() {
        let config = WKWebViewConfiguration()
        let userContentController = WKUserContentController()

        // Register handlers
        ${config.handlers.map(h => `userContentController.add(self, name: "${h}")`).join('\n        ')}

        config.userContentController = userContentController
        super.init(frame: .zero, configuration: config)
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}

extension PhilJSWebView: WKScriptMessageHandler {
    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        bridge.emit(message.name, data: message.body)
    }
}
`;
}

/**
 * Generate native module Swift code
 */
export function generateNativeModule(config: NativeModuleConfig): string {
  const methods = config.methods.map(m => {
    const params = m.params.map(p => `${p.name}: ${mapTypeToSwift(p.type)}`).join(', ');
    const asyncKeyword = m.async ? 'async ' : '';
    const returnType = m.returnType === 'void' ? '' : ` -> ${mapTypeToSwift(m.returnType)}`;

    return `    public ${asyncKeyword}func ${m.name}(${params})${returnType} {
        // TODO: Implement
    }`;
  }).join('\n\n');

  return `import Foundation

public class ${config.name} {
    public static let shared = ${config.name}()

    private init() {}

${methods}
}
`;
}

function mapTypeToSwift(tsType: string): string {
  const typeMap: Record<string, string> = {
    'string': 'String',
    'number': 'Double',
    'boolean': 'Bool',
    'void': 'Void',
    'any': 'Any',
  };
  return typeMap[tsType] || tsType;
}
